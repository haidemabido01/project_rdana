import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getIncident } from '../lib/db';
import { DISAGG_COLUMNS, METRICS } from '../lib/constants';
import { displayDT, fmtNum, composeSitePlace } from '../lib/format';

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inc, setInc] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const found = await getIncident(id);
      if (!mounted) return;
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setInc(found);
    })();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  if (!inc) {
    return <div className="empty">Loading…</div>;
  }

  const p = inc.profile || {};
  const eff = inc.initialEffects || {};

  return (
    <div>
      <div className="toolbar no-print">
        <Link to={`/incident/${inc.id}`} className="btn btn-ghost btn-sm">
          ← Back to edit
        </Link>
        <div className="row">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="report">
        <div className="rep-head">
          Republic of the Philippines
          <br />
          Municipality of Tagbina
          <br />
          Provincial DRRM Office — Surigao del Sur
          <br />
          Office of the Municipal Disaster Risk Reduction and Management Office
        </div>

        <h1>Rapid Damage Assessment and Needs Analysis</h1>
        <h2>(Initial Report / Form I — Phase 1, within 72 hours)</h2>

        <h3>I. Profile of the Disaster</h3>
        <div className="rep-row">
          <span className="lbl">Site Location</span>
          <span className="val">{composeSitePlace(p) || '—'}</span>
        </div>
        <div className="rep-row">
          <span className="lbl">Specific Address / Site Detail</span>
          <span className="val">{p.siteLocation || '—'}</span>
        </div>
        <div className="rep-row">
          <span className="lbl">Time of RDANA Team Arrival</span>
          <span className="val">{displayDT(p.timeArrival)}</span>
        </div>
        <div className="rep-row">
          <span className="lbl">Time of RDANA Team Departure</span>
          <span className="val">{displayDT(p.timeDeparture)}</span>
        </div>
        <div className="rep-row">
          <span className="lbl">Local Authorities / Persons Interviewed</span>
          <span className="val">
            {(p.interviewees || [])
              .map((x) => x.name)
              .filter(Boolean)
              .join('; ') || '—'}
          </span>
        </div>
        <div className="rep-row">
          <span className="lbl">GPS Coordinates</span>
          <span className="val">
            {p.gpsLat && p.gpsLng ? `${p.gpsLat}, ${p.gpsLng}` : '—'}
          </span>
        </div>
        <div className="rep-row">
          <span className="lbl">Type of Disaster</span>
          <span className="val">{p.disasterType || '—'}</span>
        </div>
        <div className="rep-row">
          <span className="lbl">Date and Time of Occurrence</span>
          <span className="val">{displayDT(p.occurrenceTime)}</span>
        </div>
        <div className="rep-row">
          <span className="lbl">Summary of Disaster / Incident</span>
          <span className="val">{p.summary || '—'}</span>
        </div>

        <h3>II. Initial Effects</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              {DISAGG_COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr key={m.key}>
                <td>{m.label}</td>
                {DISAGG_COLUMNS.map((c) => (
                  <td key={c.key}>{fmtNum(eff[m.key]?.[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <h3>III. Status of Lifelines and Critical Facilities</h3>
        {(inc.lifelines || []).filter((l) => l.status || l.observation).length === 0 ? (
          <p style={{ fontSize: '0.8rem' }}>No lifeline observations recorded.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lifeline / Facility</th>
                <th>Status</th>
                <th>Observation</th>
              </tr>
            </thead>
            <tbody>
              {(inc.lifelines || [])
                .filter((l) => l.status || l.observation)
                .map((l) => (
                  <tr key={l.id}>
                    <td>{l.label || 'Others'}</td>
                    <td>{l.status || '—'}</td>
                    <td>{l.observation || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        <h3>IV. Other Health and Non-Health Related Issues</h3>
        {(inc.issues || []).some((r) => r.healthIssue || r.nonHealthIssue) ? (
          <table>
            <thead>
              <tr>
                <th>Health Issues</th>
                <th>Non-Health Issues</th>
              </tr>
            </thead>
            <tbody>
              {(inc.issues || []).map((r) => (
                <tr key={r.id}>
                  <td>{r.healthIssue || '—'}</td>
                  <td>{r.nonHealthIssue || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '0.8rem' }}>No issues recorded.</p>
        )}

        <h3>V. Initial Response Actions</h3>
        {(inc.responseActions || []).some((r) => r.groupInvolved || r.assetsDeployed || r.assistanceExtent) ? (
          <table>
            <thead>
              <tr>
                <th>Response Group Involved</th>
                <th>Assets Deployed</th>
                <th>Extent of Assistance / Actions Taken</th>
                <th>No. of Families Served</th>
              </tr>
            </thead>
            <tbody>
              {(inc.responseActions || []).map((r) => (
                <tr key={r.id}>
                  <td>{r.groupInvolved || '—'}</td>
                  <td>{r.assetsDeployed || '—'}</td>
                  <td>{r.assistanceExtent || '—'}</td>
                  <td>{fmtNum(r.familiesServed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '0.8rem' }}>No response actions recorded.</p>
        )}

        <h3>VI. Initial Needs Assessment</h3>
        {(inc.needs || []).some((n) => n.priorityNeeds) ? (
          <table>
            <thead>
              <tr>
                <th>Cluster</th>
                <th>Priority Needs</th>
              </tr>
            </thead>
            <tbody>
              {(inc.needs || []).map((n) => (
                <tr key={n.id}>
                  <td>{n.label}</td>
                  <td>{n.priorityNeeds || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '0.8rem' }}>No needs recorded.</p>
        )}

        <div className="sig">
          <div>
            Prepared by:
            <br />
            <br />
            ___________________________
            <br />
            RDANA Team Member
          </div>
          <div>
            Noted by:
            <br />
            <br />
            ___________________________
            <br />
            Team Leader / MDRRMO
          </div>
        </div>
      </div>
    </div>
  );
}