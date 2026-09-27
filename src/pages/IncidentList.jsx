import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteIncident, listIncidents } from '../lib/db';
import { displayDT, timeAgo, composeSitePlace } from '../lib/format';

export default function IncidentList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const rows = await listIncidents();
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this assessment permanently? This cannot be undone.')) return;
    await deleteIncident(id);
    refresh();
  };

  return (
    <div>
      <h1 className="page-title">RDANA Assessments</h1>
      <p className="page-sub">
        Digital Form 1 — Phase 1 (within 72 hours). Everything is saved locally on this device and works without
        internet.
      </p>

      <div className="toolbar" style={{ marginTop: 14 }}>
        <Link to="/incident/new" className="btn btn-primary">
          + New Assessment
        </Link>
      </div>

      {loading && <div className="empty">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="card empty">
          <div className="big">🗒️</div>
          <p>No assessments yet.</p>
          <p>Tap “New Assessment” to begin a RDANA Form 1 for a disaster incident.</p>
        </div>
      )}

      {items.map((it) => {
        const title = composeSitePlace(it.profile) || it.profile?.siteLocation || 'Untitled assessment';
        const type = it.profile?.disasterType || 'Type not set';
        const occurrence = it.profile?.occurrenceTime;
        return (
          <div className="card" key={it.id} style={{ padding: 14, marginBottom: 12 }}>
            <div className="incident-card">
              <div className="incident-title">{title}</div>
              <div className="incident-meta">
                <b>{type}</b>
                {occurrence && <> · Occurred {displayDT(occurrence)}</>}
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
                <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(it.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}