import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ConfirmDialog, Modal } from '../components/Modal';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { recordAuditLog } from '../lib/audit';
import { deleteIncident, getIncident, restoreIncident, saveIncident } from '../lib/db';
import { toLocalInput, timeAgo } from '../lib/format';
import { useLocations } from '../hooks/useLocations';
import { allProvinces, municipalitiesIn } from '../lib/locations';
import { DEFAULT_FORM, formTypeOf, getForm, issuesBySection } from '../lib/forms';
import {
  blankBarangayProfile,
  blankLifeline,
  blankStructure,
  ensureDamage,
  hasParts,
  partSum,
  uid
} from '../lib/model';
import { insertAt, rowLabel } from '../lib/rows';

/* A fix worse than this is still recorded, but the assessor is told not
   to trust it as an exact pin. */
const GPS_WEAK_M = 30;

/* GeolocationPositionError codes are stable, so each gets a message the
   assessor can actually act on. */
const GPS_ERRORS = {
  1: 'Location permission was denied. Allow it in the browser settings, or enter the coordinates manually.',
  2: 'No GPS fix available right now. Move outdoors and away from cover, or enter the coordinates manually.',
  3: 'Timed out waiting for a GPS fix. Move into the open and try again, or enter the coordinates manually.',
  default: 'Could not get a GPS fix. Move outdoors and try again, or enter the coordinates manually.'
};

/* Path setter used by Form 2 ("s7.altWater.0.damaged"). Clones only the
   spine it touches, and appends to arrays when the key is a new index. */
export function setPath(root, path, value) {
  const keys = String(path).split('.');
  const walk = (node, i) => {
    if (i === keys.length) return value;
    const k = keys[i];
    if (Array.isArray(node)) {
      const idx = Number(k);
      const copy = node.slice();
      copy[idx] = walk(copy[idx] ?? {}, i + 1);
      return copy;
    }
    return { ...(node || {}), [k]: walk((node || {})[k] ?? {}, i + 1) };
  };
  return walk(root, 0);
}

export default function IncidentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const notify = useToast();
  const isNew = !id;

  const [inc, setInc] = useState(null);
  const [page, setPage] = useState(0);

  const [savedAt, setSavedAt] = useState(null);
  const [gps, setGps] = useState({ busy: false, error: '', accuracy: null, weak: false });
  const [askDelete, setAskDelete] = useState(false);
  const [askPreview, setAskPreview] = useState(false);
  const [askLeave, setAskLeave] = useState(false);
  const [askReload, setAskReload] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  const { regions: locationRegions } = useLocations();
  const hydrated = useRef(false);
  const skipNextSaveRef = useRef(false);
  const lastSavedUpdatedAtRef = useRef('');
  const saveTimer = useRef(null);
  const incRef = useRef(null);
  const dirty = useRef(false);
  const deletedRef = useRef(false);

  incRef.current = inc;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isNew) {
        const wanted = params.get('type');
        const def = getForm(wanted || DEFAULT_FORM);
        if (mounted) {
          skipNextSaveRef.current = true;
          setInc(def.create());
          hydrated.current = true;
        }
        return;
      }
      const found = await getIncident(id);
      if (!mounted) return;
      if (!found || found.deletedAt) {
        navigate('/', { replace: true });
        return;
      }
      const foundType = formTypeOf(found);
      if (foundType === 'building' || foundType === 'agriculture') {
        navigate('/', { replace: true });
        return;
      }
      skipNextSaveRef.current = true;
      lastSavedUpdatedAtRef.current = found.updatedAt || '';
      setInc(ensureDamage(found));
      setSavedAt(found.updatedAt || null);
      hydrated.current = true;
    })();
    return () => {
      mounted = false;
    };
  }, [id, isNew, navigate, params]);

  /* Auto-save. The pending timer is flushed on unmount so in-app
     navigation can never drop the last few keystrokes. */
  useEffect(() => {
    if (!inc || !hydrated.current || deletedRef.current) return undefined;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return undefined;
    }
    dirty.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (deletedRef.current) return;
      const saved = await saveIncident(inc);
      lastSavedUpdatedAtRef.current = saved.updatedAt || '';
      dirty.current = false;
      setSavedAt(saved.updatedAt);
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [inc]);

  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      /* Do not resurrect a soft-deleted form with the unmount flush. */
      if (!deletedRef.current && dirty.current && incRef.current) saveIncident(incRef.current);
      dirty.current = false;
    };
    return () => flush();
  }, []);

  const loadLatest = useCallback(
    async ({ silent = false } = {}) => {
      const targetId = id || incRef.current?.id;
      if (!targetId) return false;
      const found = await getIncident(targetId);
      if (!found) {
        if (!isNew) navigate('/', { replace: true });
        return false;
      }
      if (found.deletedAt) {
        navigate('/', { replace: true });
        return false;
      }
      if (silent && found.updatedAt && found.updatedAt === lastSavedUpdatedAtRef.current) {
        return false;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      skipNextSaveRef.current = true;
      lastSavedUpdatedAtRef.current = found.updatedAt || '';
      setInc(ensureDamage(found));
      hydrated.current = true;
      dirty.current = false;
      setSavedAt(found.updatedAt);
      setLastRefreshed(new Date());
      return true;
    },
    [id, isNew, navigate]
  );

  const handleRefresh = useCallback(async () => {
    if (dirty.current) {
      setAskReload(true);
      return;
    }
    const startedAt = Date.now();
    setIsReloading(true);
    try {
      const loaded = await loadLatest({ silent: false });
      const elapsed = Date.now() - startedAt;
      if (elapsed < 350) {
        await new Promise((r) => setTimeout(r, 350 - elapsed));
      }
      setLastRefreshed(new Date());
      if (loaded) {
        notify.success('Assessment refreshed from the latest saved version.');
      } else {
        notify.info('Assessment form is up to date.');
      }
    } finally {
      setIsReloading(false);
    }
  }, [loadLatest, notify]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !dirty.current && !isNew) {
        loadLatest({ silent: true });
      }
    };
    const onFocus = () => {
      if (!dirty.current && !isNew) loadLatest({ silent: true });
    };
    const onDataChanged = () => {
      if (!dirty.current && !isNew) loadLatest({ silent: true });
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('rdana:data-changed', onDataChanged);
    window.addEventListener('online', onDataChanged);
    window.addEventListener('storage', onDataChanged);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('rdana:data-changed', onDataChanged);
      window.removeEventListener('online', onDataChanged);
      window.removeEventListener('storage', onDataChanged);
    };
  }, [loadLatest, isNew]);

  /* Last-resort guard for tab close / reload. Browsers only allow the
     native prompt, and only while there is genuinely unsaved work. */
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty.current) return undefined;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const clearGpsError = useCallback(() => {
    setGps((g) => (g.error || g.weak ? { ...g, error: '', weak: false } : g));
  }, []);

  const form = useMemo(() => getForm(formTypeOf(inc)), [inc]);
  const sections = form.sections;
  const issues = useMemo(() => form.validate(inc || {}), [form, inc]);
  const counts = useMemo(() => issuesBySection(issues), [issues]);

  const onChangePath = useCallback(
    (path, value) => {
      setInc((s) => setPath(s, path, value));
      if (path.endsWith('gpsLat') || path.endsWith('gpsLng')) clearGpsError();
    },
    [clearGpsError]
  );

  /* Form 2 sections remove rows through a dotted path. This gives them
     the same one-call undo behaviour as the Form 1 store handlers.
     Declared up here with the other hooks so it is never skipped by the
     early return below. */
  const removeRow = useCallback(
    (path, list, i, label) => {
      const removed = (list || [])[i];
      if (!removed) return;
      setInc((s) => setPath(s, path, (list || []).filter((_, j) => j !== i)));
      notify.undo(`Removed ${label} "${rowLabel(removed)}"`, () =>
        setInc((s) => setPath(s, path, insertAt(list || [], i, removed)))
      );
    },
    [notify]
  );

  /* --- Form 1 helpers (kept as a bag so the editor shell stays generic) --- */
  const f1 = useMemo(() => {
    const updateProfile = (f, v) => {
      setInc((s) => ({ ...s, profile: { ...s.profile, [f]: v } }));
      if (f === 'gpsLat' || f === 'gpsLng') clearGpsError();
    };
    const updateEffects = (m, c, v) =>
      setInc((s) => {
        const cur = s.initialEffects[m] || {};
        const next = { ...cur, [c]: v };
        // Total is the sum of the five disaggregation columns unless the
        // assessor has explicitly unlocked the cell.
        if (c !== 'total' && !next.totalManual) {
          next.total = hasParts(next) ? String(partSum(next)) : '';
        }
        return { ...s, initialEffects: { ...s.initialEffects, [m]: next } };
      });
    const setTotalMode = (m, manual) =>
      setInc((s) => {
        const cur = s.initialEffects[m] || {};
        const next = { ...cur, totalManual: manual };
        if (!manual) next.total = hasParts(next) ? String(partSum(next)) : '';
        return { ...s, initialEffects: { ...s.initialEffects, [m]: next } };
      });

    const patchRow = (key) => (i, f, v) =>
      setInc((s) => ({ ...s, [key]: s[key].map((x, j) => (j === i ? { ...x, [f]: v } : x)) }));
    const addRow = (key, blank) => () => setInc((s) => ({ ...s, [key]: [...s[key], blank] }));

    /* Removing a row is deliberately not a blocking dialog — assessors
       strip out blank filler rows constantly. The row goes immediately
       and can be restored from the Undo toast. */
    const delRow = (key, label) => (i) => {
      const removed = (incRef.current?.[key] || [])[i];
      if (!removed) return;
      setInc((s) => ({ ...s, [key]: (s[key] || []).filter((_, j) => j !== i) }));
      notify.undo(`Removed ${label} "${rowLabel(removed)}"`, () =>
        setInc((s) => ({ ...s, [key]: insertAt(s[key] || [], i, removed) }))
      );
    };

    const blankIssue = () => ({ id: uid(), healthIssue: '', nonHealthIssue: '' });
    const blankAction = () => ({
      id: uid(),
      groupInvolved: '',
      assetsDeployed: '',
      assistanceExtent: '',
      familiesServed: ''
    });

    /* --- Damage register (nested under inc.damage) -------------------- */

    const withDamage = (s, patch) => ({
      ...s,
      damage: { structures: [], barangays: [], notes: '', ...(s.damage || {}), ...patch }
    });

    const updateStructure = (i, f, v) =>
      setInc((s) => {
        const list = s.damage?.structures || [];
        return withDamage(s, { structures: list.map((x, j) => (j === i ? { ...x, [f]: v } : x)) });
      });

    const addStructure = () =>
      setInc((s) => withDamage(s, { structures: [...(s.damage?.structures || []), blankStructure()] }));

    const removeStructure = (i) => {
      const list = incRef.current?.damage?.structures || [];
      const removed = list[i];
      if (!removed) return;
      setInc((s) =>
        withDamage(s, { structures: (s.damage?.structures || []).filter((_, j) => j !== i) })
      );
      notify.undo(`Removed structure "${rowLabel(removed)}"`, () =>
        setInc((s) =>
          withDamage(s, { structures: insertAt(s.damage?.structures || [], i, removed) })
        )
      );
    };

    const updateBarangayProfile = (id, f, v) =>
      setInc((s) => {
        const list = s.damage?.barangays || [];
        return withDamage(s, { barangays: list.map((x) => (x.id === id ? { ...x, [f]: v } : x)) });
      });

    const addBarangayProfile = () =>
      setInc((s) =>
        withDamage(s, { barangays: [...(s.damage?.barangays || []), blankBarangayProfile()] })
      );

    const removeBarangayProfile = (id) => {
      const list = incRef.current?.damage?.barangays || [];
      const idx = list.findIndex((r) => r.id === id);
      const removed = list[idx];
      if (idx < 0 || !removed) return;
      setInc((s) =>
        withDamage(s, { barangays: (s.damage?.barangays || []).filter((r) => r.id !== id) })
      );
      notify.undo(`Removed barangay "${rowLabel(removed)}"`, () =>
        setInc((s) =>
          withDamage(s, { barangays: insertAt(s.damage?.barangays || [], idx, removed) })
        )
      );
    };

    const updateDamageNotes = (v) => setInc((s) => withDamage(s, { notes: v }));

    return {
      updateProfile,
      updateEffects,
      setTotalMode,
      onNow: (f) => updateProfile(f, toLocalInput(new Date())),
      updateLifeline: patchRow('lifelines'),
      addLifeline: addRow('lifelines', { ...blankLifeline('custom', ''), custom: true }),
      removeLifeline: delRow('lifelines', 'lifeline'),
      updateIssue: patchRow('issues'),
      addIssue: addRow('issues', blankIssue()),
      removeIssue: delRow('issues', 'issue'),
      updateAction: patchRow('responseActions'),
      addAction: addRow('responseActions', blankAction()),
      removeAction: delRow('responseActions', 'response action'),
      updateNeed: (i, v) =>
        setInc((s) => ({ ...s, needs: s.needs.map((x, j) => (j === i ? { ...x, priorityNeeds: v } : x)) })),
      updateStructure,
      addStructure,
      removeStructure,
      updateBarangayProfile,
      addBarangayProfile,
      removeBarangayProfile,
      updateDamageNotes
    };
  }, [notify]);

  const psgc = useMemo(() => {
    const province = inc?.header?.province;
    return {
      regions: locationRegions,
      provinces: allProvinces(locationRegions),
      municipalities: municipalitiesIn(locationRegions, province)
    };
  }, [locationRegions, inc]);

  const onGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGps({ busy: false, error: 'This device does not report its location. Enter the coordinates manually.', accuracy: null, weak: false });
      return;
    }
    // Browsers only expose geolocation in a secure context. Over plain
    // http on a LAN address the API is absent, so say so plainly instead
    // of failing silently.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setGps({ busy: false, error: 'Location needs a secure (https) page. Enter the coordinates manually.', accuracy: null, weak: false });
      return;
    }
    setGps((g) => ({ ...g, busy: true, error: '' }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = String(pos.coords.latitude.toFixed(6));
        const lng = String(pos.coords.longitude.toFixed(6));
        const acc = Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null;
        const weak = acc != null && acc > GPS_WEAK_M;

        setInc((s) => {
          const patch = { gpsLat: lat, gpsLng: lng, gpsAccuracy: acc == null ? '' : String(acc) };
          return s.formType === 'phase2'
            ? { ...s, header: { ...s.header, ...patch } }
            : { ...s, profile: { ...s.profile, ...patch } };
        });
        setGps({ busy: false, error: '', accuracy: acc, weak });
        if (weak) notify.error(`Weak GPS fix (±${acc} m) — move outdoors for a more accurate pin.`, 6000);
      },
      (err) => {
        setGps({ busy: false, error: GPS_ERRORS[err?.code] || GPS_ERRORS.default, accuracy: null, weak: false });
      },
      // maximumAge 0 forces a fresh satellite fix instead of a cached one
      // left over from the assessor's previous stop.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const doDelete = async () => {
    setAskDelete(false);
    deletedRef.current = true;
    const targetId = inc.id;
    const targetTitle = form.title(inc);
    if (targetId) {
      await deleteIncident(targetId);
      recordAuditLog({
        action: 'Deleted assessment record',
        category: 'Assessments',
        severity: 'warning',
        target: targetTitle,
        details: `Assessment "${targetTitle}" moved to Archive (Deleted).`
      });
    }
    notify.undo('Assessment deleted — now in Archive as Deleted (latest Deleted on top)', async () => {
      if (targetId) {
        await restoreIncident(targetId);
        recordAuditLog({
          action: 'Restored assessment record',
          category: 'Assessments',
          severity: 'success',
          target: targetTitle,
          details: `Assessment "${targetTitle}" restored from Deleted archive.`
        });
      }
    });
    navigate('/');
  };

  const gotoReport = async () => {
    setAskPreview(false);
    const saved = await saveIncident(inc);
    navigate(`/incident/${saved.id}/report`);
  };

  /* Every rule is advisory, so previewing is never blocked — the dialog
     just surfaces the gaps before the assessor moves on. */
  const onPreview = () => {
    if (issues.length === 0) {
      gotoReport();
      return;
    }
    setAskPreview(true);
  };

  const jumpToFirstIssue = () => {
    setAskPreview(false);
    const target = sections.findIndex((s) => String(s.key) === String(issues[0]?.section));
    if (target >= 0) setPage(target);
  };

  const leaveToList = () => {
    setAskLeave(false);
    navigate('/');
  };

  /* A brand-new draft with no identifying detail is almost always an
     accidental visit, so confirm before leaving a stray record behind. */
  const onBackToList = () => {
    if (isNew && dirty.current && form.isUntitled?.(inc)) {
      setAskLeave(true);
      return;
    }
    navigate('/');
  };

  if (!inc) {
    return <div className="empty">Loading…</div>;
  }

  const visibleIssues = issues.slice(0, 6);
  const extraIssues = issues.length - visibleIssues.length;
  const title = isNew ? `New ${form.label} Assessment` : form.title(inc);
  const section = sections[page] || sections[0];

  const goNext = () => setPage((p) => Math.min(p + 1, sections.length - 1));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));

  const ctx = {
    inc,
    onChange: onChangePath,
    f1,
    psgc,
    removeRow,
    notify,
    gps: {
      busy: gps.busy,
      onGet: onGps,
      error: gps.error,
      accuracy: gps.accuracy,
      weak: gps.weak
    }
  };

  return (
    <div>
      <div className="toolbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBackToList}>
          ← Assessments
        </button>
        <div className="row">
          {savedAt && <span className="badge badge-success">Saved {timeAgo(savedAt)}</span>}
          <span className="badge badge-info">Draft · local-first</span>
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isReloading}
            label="Refresh"
          />
          <button type="button" className="btn btn-outline btn-sm" onClick={onPreview}>
            Preview report
          </button>
        </div>
      </div>

      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{form.campaign} · auto-saves to this device as you type.</p>

      {issues.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {visibleIssues.map((it, i) => (
            <div key={i} className={`alert alert-${it.level}`}>
              <b>{form.formName}</b> · {it.message}
            </div>
          ))}
          {extraIssues > 0 && <div className="alert alert-warning">+ {extraIssues} more issue(s)…</div>}
        </div>
      )}

      {issues.length === 0 && savedAt && (
        <div style={{ marginBottom: 14 }}>
          <div className="alert alert-success">All sections look good — no validation issues found.</div>
        </div>
      )}

      <div className="summary-strip">
        {sections.map((s, i) => {
          const n = counts[s.key] || 0;
          return (
            <button
              key={s.key}
              type="button"
              className={`chip chip-btn ${i === page ? 'chip-active' : ''} ${n ? 'chip-issue' : 'chip-ok'}`}
              onClick={() => setPage(i)}
              title={s.title}
            >
              {s.chip || s.key}
              {n ? ` · ${n}` : ' ✓'}
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="section-head static">
          <span className="section-index">{section.key || section.chip}</span>
          <span className="section-title">{section.title}</span>
          <span className="muted" style={{ fontSize: '0.75rem' }}>
            Section {page + 1} of {sections.length}
          </span>
        </div>
        <div className="section-body">{form.renderSection(page, ctx)}</div>
        <div className="wizard-nav">
          <button type="button" className="btn btn-outline btn-sm" onClick={goPrev} disabled={page === 0}>
            ← Previous
          </button>
          {page < sections.length - 1 ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={goNext}>
              Next section →
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={onPreview}>
              Finish → Report preview
            </button>
          )}
        </div>
      </div>

      <div className="toolbar spread" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => setAskDelete(true)}>
          Delete assessment
        </button>
        <div className="muted" style={{ fontSize: '0.78rem' }}>
          Auto-save is on · No internet needed
        </div>
      </div>

      <ConfirmDialog
        open={askDelete}
        title="Delete this assessment?"
        message={`"${form.title(inc)}" will be moved to Archive as Deleted (recent Deleted on top) and excluded from Assessments and totals. You can Restore it from Archive, or Undo now.`}
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setAskDelete(false)}
      />

      <ConfirmDialog
        open={askLeave}
        title="Discard this empty draft?"
        message="This assessment has not been given a name or location yet. Leaving now keeps it as an untitled draft on the list."
        confirmLabel="Leave anyway"
        onConfirm={leaveToList}
        onCancel={() => setAskLeave(false)}
      />

      <ConfirmDialog
        open={askReload}
        title="Reload saved version?"
        message="You have unsaved changes. Reloading will discard the latest keystrokes and restore the last saved version of this assessment."
        confirmLabel="Reload anyway"
        onConfirm={async () => {
          setAskReload(false);
          setIsReloading(true);
          try {
            await loadLatest();
            notify.success('Assessment refreshed from the latest saved version.');
          } finally {
            setIsReloading(false);
          }
        }}
        onCancel={() => setAskReload(false)}
      />

      <Modal
        open={askPreview}
        title={`${issues.length} thing${issues.length === 1 ? '' : 's'} to check first`}
        onCancel={() => setAskPreview(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={jumpToFirstIssue}>
              Go to first issue
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={gotoReport}>
              Preview anyway
            </button>
          </>
        }
      >
        <p className="modal-msg">
          These are advisory, not blockers. The report will still open — but blank spots usually mean a
          field team missed something worth capturing.
        </p>
        <ul className="modal-issues">
          {issues.slice(0, 8).map((it, i) => (
            <li key={i}>
              <span className="modal-issue-sec">Section {it.section}</span> {it.message}
            </li>
          ))}
          {issues.length > 8 && <li className="muted">+{issues.length - 8} more…</li>}
        </ul>
      </Modal>
    </div>
  );
}