import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ActionsSection,
  EffectsSection,
  IssuesSection,
  LifelinesSection,
  NeedsSection,
  ProfileSection
} from '../components/sections';
import { getIncident, deleteIncident, saveIncident } from '../lib/db';
import { toLocalInput, timeAgo, composeSitePlace } from '../lib/format';
import { useLocations } from '../hooks/useLocations';
import { blankLifeline, createIncident, uid } from '../lib/model';
import { issuesBySection, validateIncident } from '../lib/validate';

const SECTIONS = [
  { key: 'I', title: 'Profile of the Disaster' },
  { key: 'II', title: 'Initial Effects' },
  { key: 'III', title: 'Status of Lifelines & Critical Facilities' },
  { key: 'IV', title: 'Other Health & Non-Health Issues' },
  { key: 'V', title: 'Initial Response Actions' },
  { key: 'VI', title: 'Initial Needs Assessment' }
];

const CAMPAIGN = 'RDANA Form 1 — Phase 1 (within 72 hours)';

export default function IncidentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [inc, setInc] = useState(null);
  const [page, setPage] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const { regions: locationRegions } = useLocations();
  const hydrated = useRef(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isNew) {
        if (mounted) {
          setInc(createIncident());
          hydrated.current = true;
        }
        return;
      }
      const found = await getIncident(id);
      if (!mounted) return;
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setInc(found);
      hydrated.current = true;
    })();
    return () => {
      mounted = false;
    };
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (!inc || !hydrated.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const saved = await saveIncident(inc);
      setSavedAt(saved.updatedAt);
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [inc]);

  const issues = useMemo(() => validateIncident(inc || {}), [inc]);
  const counts = useMemo(() => issuesBySection(issues), [issues]);

  if (!inc) {
    return <div className="empty">Loading…</div>;
  }

  const updateProfile = (f, v) => setInc((s) => ({ ...s, profile: { ...s.profile, [f]: v } }));
  const updateEffects = (m, c, v) =>
    setInc((s) => ({
      ...s,
      initialEffects: { ...s.initialEffects, [m]: { ...s.initialEffects[m], [c]: v } }
    }));

  const updateLifeline = (i, f, v) =>
    setInc((s) => ({ ...s, lifelines: s.lifelines.map((x, j) => (j === i ? { ...x, [f]: v } : x)) }));
  const addLifeline = () =>
    setInc((s) => ({ ...s, lifelines: [...s.lifelines, { ...blankLifeline('custom', ''), custom: true }] }));
  const removeLifeline = (i) => setInc((s) => ({ ...s, lifelines: s.lifelines.filter((_, j) => j !== i) }));

  const updateIssue = (i, f, v) =>
    setInc((s) => ({ ...s, issues: s.issues.map((x, j) => (j === i ? { ...x, [f]: v } : x)) }));
  const addIssue = () => setInc((s) => ({ ...s, issues: [...s.issues, { id: uid(), healthIssue: '', nonHealthIssue: '' }] }));
  const removeIssue = (i) => setInc((s) => ({ ...s, issues: s.issues.filter((_, j) => j !== i) }));

  const updateAction = (i, f, v) =>
    setInc((s) => ({ ...s, responseActions: s.responseActions.map((x, j) => (j === i ? { ...x, [f]: v } : x)) }));
  const addAction = () =>
    setInc((s) => ({
      ...s,
      responseActions: [
        ...s.responseActions,
        { id: uid(), groupInvolved: '', assetsDeployed: '', assistanceExtent: '', familiesServed: '' }
      ]
    }));
  const removeAction = (i) => setInc((s) => ({ ...s, responseActions: s.responseActions.filter((_, j) => j !== i) }));

  const updateNeed = (i, v) =>
    setInc((s) => ({ ...s, needs: s.needs.map((x, j) => (j === i ? { ...x, priorityNeeds: v } : x)) }));

  const onNow = (f) => updateProfile(f, toLocalInput(new Date()));

  const onGps = () => {
    if (!navigator.geolocation) {
      window.alert('Geolocation is not available on this device. Enter coordinates manually.');
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInc((s) => ({
          ...s,
          profile: {
            ...s.profile,
            gpsLat: String(pos.coords.latitude.toFixed(6)),
            gpsLng: String(pos.coords.longitude.toFixed(6))
          }
        }));
        setGpsBusy(false);
      },
      () => {
        setGpsBusy(false);
        window.alert('Could not get GPS. Enter the coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this assessment permanently? This cannot be undone.')) return;
    if (inc.id) await deleteIncident(inc.id);
    navigate('/');
  };

  const onPreview = async () => {
    const saved = await saveIncident(inc);
    navigate(`/incident/${saved.id}/report`);
  };

  const visibleIssues = issues.slice(0, 6);
  const extraIssues = issues.length - visibleIssues.length;
  const place = composeSitePlace(inc.profile);
  const title =
    isNew ? 'New Assessment' : (place || inc.profile?.siteLocation || 'Untitled assessment');

  const goNext = () => setPage((p) => Math.min(p + 1, SECTIONS.length - 1));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));

  const section = SECTIONS[page];

  return (
    <div>
      <div className="toolbar">
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Incidents
        </Link>
        <div className="row">
          {savedAt && <span className="badge badge-success">Saved {timeAgo(savedAt)}</span>}
          <span className="badge badge-info">Draft · local-first</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={onPreview}>
            Preview report
          </button>
        </div>
      </div>

      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{CAMPAIGN} · auto-saves to this device as you type.</p>

      {issues.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {visibleIssues.map((it, i) => (
            <div key={i} className={`alert alert-${it.level}`}>
              <b>{it.section}</b> · {it.message}
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
        {SECTIONS.map((s, i) => {
          const n = counts[s.key] || 0;
          return (
            <button
              key={s.key}
              type="button"
              className={`chip chip-btn ${i === page ? 'chip-active' : ''} ${n ? 'chip-issue' : 'chip-ok'}`}
              onClick={() => setPage(i)}
              title={s.title}
            >
              {s.key}
              {n ? ` · ${n}` : ' ✓'}
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="section-head static">
          <span className="section-index">{section.key}</span>
          <span className="section-title">{section.title}</span>
          <span className="muted" style={{ fontSize: '0.75rem' }}>
            Section {page + 1} of {SECTIONS.length}
          </span>
        </div>
        <div className="section-body">
          {page === 0 && (
            <ProfileSection
              profile={inc.profile}
              onChange={updateProfile}
              onNow={onNow}
              onGps={onGps}
              gpsBusy={gpsBusy}
              locationRegions={locationRegions}
            />
          )}
          {page === 1 && <EffectsSection effects={inc.initialEffects} onChange={updateEffects} />}
          {page === 2 && (
            <LifelinesSection
              lifelines={inc.lifelines}
              onChange={updateLifeline}
              onAdd={addLifeline}
              onRemove={removeLifeline}
            />
          )}
          {page === 3 && <IssuesSection issues={inc.issues} onChange={updateIssue} onAdd={addIssue} onRemove={removeIssue} />}
          {page === 4 && (
            <ActionsSection
              actions={inc.responseActions}
              onChange={updateAction}
              onAdd={addAction}
              onRemove={removeAction}
            />
          )}
          {page === 5 && <NeedsSection needs={inc.needs} onChange={updateNeed} />}
        </div>
        <div className="wizard-nav">
          <button type="button" className="btn btn-outline btn-sm" onClick={goPrev} disabled={page === 0}>
            ← Previous
          </button>
          {page < SECTIONS.length - 1 ? (
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
        <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
          Delete assessment
        </button>
        <div className="muted" style={{ fontSize: '0.78rem' }}>
          Auto-save is on · No internet needed
        </div>
      </div>
    </div>
  );
}