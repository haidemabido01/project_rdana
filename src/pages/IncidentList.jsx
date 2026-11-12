import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/Modal';
import { useToast } from '../components/Toast';
import RefreshButton from '../components/RefreshButton';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { sortIncidentsLatestFirst } from '../lib/analytics';
import { recordAuditLog } from '../lib/audit';
import { deleteIncident, listIncidents, restoreIncident } from '../lib/db';
import { displayDT, timeAgo } from '../lib/format';
import { FORMS, formTypeOf } from '../lib/forms';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'phase1', label: 'Phase 1' },
  { key: 'phase2', label: 'Phase 2' }
];

export default function IncidentList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pending, setPending] = useState(null);
  const signatureRef = useRef('');
  const notify = useToast();

  const { refresh, lastRefreshed, isRefreshing } = useAutoRefresh(
    async ({ silent } = {}) => {
      const rows = await listIncidents();
      const filtered = rows.filter((r) => {
        const type = formTypeOf(r);
        return type === 'phase1' || type === 'phase2';
      });
      const sorted = sortIncidentsLatestFirst(filtered);
      const sig = sorted.map((r) => `${r.id}:${r.updatedAt || ''}`).join(',');
      if (silent && signatureRef.current === sig) {
        return false;
      }
      signatureRef.current = sig;
      setItems(sorted);
      setLoading(false);
      return true;
    },
    { intervalMs: 5000 }
  );

  const handleRefresh = async () => {
    await refresh();
    notify.info('Assessments list refreshed.');
  };

  const shown = useMemo(() => {
    if (filter === null) return [];
    return filter === 'all' ? items : items.filter((it) => formTypeOf(it) === filter);
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      phase1: items.filter((i) => formTypeOf(i) === 'phase1').length,
      phase2: items.filter((i) => formTypeOf(i) === 'phase2').length
    }),
    [items]
  );

  const confirmDelete = async () => {
    const target = pending;
    setPending(null);
    if (!target) return;
    await deleteIncident(target.id);
    recordAuditLog({
      action: 'Deleted assessment record',
      category: 'Assessments',
      severity: 'warning',
      target: target.title,
      details: `Assessment "${target.title}" moved to Archive (Deleted).`
    });
    refresh();
    notify.undo(`Deleted “${target.title}” — now in Archive as Deleted (latest Deleted on top)`, async () => {
      await restoreIncident(target.id);
      recordAuditLog({
        action: 'Restored assessment record',
        category: 'Assessments',
        severity: 'success',
        target: target.title,
        details: `Assessment "${target.title}" restored from Deleted archive.`
      });
      refresh();
    });
  };

  return (
    <div>
      <h1 className="page-title">RDANA Assessments</h1>
      <p className="page-sub">
        Digital Form 1 (Phase 1, within 72 hours) and Form 2 (Phase 2, 3-15 days). Everything is saved
        locally on this device and works without internet. Latest saved assessment is always on top.
      </p>

       <div className="toolbar" style={{ marginTop: 14 }}>
         <div className="row">
           {(() => {
             const activeType = filter === 'phase2' ? 'phase2' : 'phase1';
             const form = FORMS[activeType];
             return (
               <Link
                 to={`/incident/new?type=${activeType}`}
                 className="btn btn-primary"
               >
                 + New {form.label} Assessment
               </Link>
             );
           })()}
         </div>
         <RefreshButton
           onRefresh={handleRefresh}
           lastRefreshed={lastRefreshed}
           isRefreshing={isRefreshing}
           label="Refresh"
         />
       </div>

      <div className="summary-strip" style={{ marginTop: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`chip chip-btn ${filter === f.key ? 'chip-active' : ''} chip-ok`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== 'all' ? ` · ${counts[f.key]}` : ` · ${items.length}`}
          </button>
        ))}

      </div>

      {loading && <div className="empty">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="card empty">
          <div className="big">🗒️</div>
          <p>No assessments yet.</p>
          <p>Start a Phase 1 (Form 1) assessment right after deployment, or a Phase 2 (Form 2) follow-up.</p>
        </div>
      )}



      {!loading && items.length > 0 && filter !== null && shown.length === 0 && (
        <div className="card empty">
          <p>No {filter === 'phase1' ? 'Phase 1' : 'Phase 2'} assessments.</p>
        </div>
      )}

      {shown.map((it, idx) => {
        const type = formTypeOf(it);
        const form = FORMS[type];
        const line = form.listLine(it);
        return (
          <div className="card" key={it.id} style={{ padding: 14, marginBottom: 12 }}>
            <div className="incident-card">
              <div className="row spread">
                <div className="incident-title">
                  {line.title}
                  {idx === 0 && items.length > 1 && (
                    <span className="badge badge-success" style={{ marginLeft: 8 }}>
                      Latest
                    </span>
                  )}
                </div>
                <span className={`badge ${type === 'phase2' ? 'badge-warning' : 'badge-navy'}`}>
                  {form.formName} · {form.label}
                </span>
              </div>
              <div className="incident-meta">
                <b>{line.sub}</b>
                {line.occurrence && <> · Occurred {displayDT(line.occurrence)}</>}
                <div className="muted" style={{ marginTop: 2 }}>
                  Updated {timeAgo(it.updatedAt)}
                </div>
              </div>
              <div className="row">
                <Link to={`/incident/${it.id}`} className="btn btn-outline btn-sm">
                  Open / Edit
                </Link>
                <Link to={`/incident/${it.id}/report`} className="btn btn-outline btn-sm">
                  Report
                </Link>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setPending({ id: it.id, title: line.title })}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={!!pending}
        title="Delete this assessment?"
        message={
          pending
            ? `“${pending.title}” will be moved to Archive as Deleted (recent Deleted on top) and excluded from Assessments and totals. You can Restore it from Archive, or Undo now.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}