import { fmtNum } from '../../lib/format';

export function Letterhead() {
  return (
    <div className="rep-head">
      Republic of the Philippines
      <br />
      Municipality of Tagbina
      <br />
      Provincial DRRM Office — Surigao del Sur
      <br />
      Office of the Municipal Disaster Risk Reduction and Management Office
    </div>
  );
}

export function RepRow({ label, value }) {
  return (
    <div className="rep-row">
      <span className="lbl">{label}</span>
      <span className="val">{value || '—'}</span>
    </div>
  );
}

/* Generic bordered table. `empty` renders a note instead of the table so
   a blank report never shows a grid of dashes. Row identity and label
   keys are excluded from the "is anything filled in" check. */
const META_KEYS = new Set(['id', 'key', 'label', 'crop', 'facility', 'animal']);

export function RepTable({ head, rows, empty = 'Nothing recorded.', renderRow, className = '' }) {
  const body = rows || [];
  const anyFilled = body.some((r) =>
    Array.isArray(r)
      ? r.some((c) => c !== '' && c != null)
      : Object.entries(r || {}).some(([k, v]) => !META_KEYS.has(k) && v !== '' && v != null)
  );
  if (!body.length || !anyFilled) {
    return <p className="rep-empty">{empty}</p>;
  }
  return (
    <div className="table-wrap rep-table">
      <table className={className}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{body.map((r, i) => renderRow(r, i))}</tbody>
      </table>
    </div>
  );
}

export function repOr(val, fallback = '—') {
  if (val === '' || val == null) return fallback;
  if (Array.isArray(val)) return val.length ? val.join(', ') : fallback;
  return val;
}

export function repNum(val) {
  return fmtNum(val);
}

/* Ticked boxes print as a visible mark so the grid reads like the form. */
export function repChecks(arr) {
  if (!Array.isArray(arr) || !arr.length) return '—';
  return (
    <span className="rep-checks">
      {arr.map((a) => (
        <span key={a} className="rep-check">
          ☑ {a}
        </span>
      ))}
    </span>
  );
}

/* The recurring Impact / Early Recovery / Observations triad. */
export function RepTriad({ sectorLabel, value }) {
  return (
    <>
      <RepRow label={`Impact on ${sectorLabel}`} value={repOr(value?.impact)} />
      <RepRow label="Early Recovery Issues" value={repOr(value?.earlyRecoveryIssues)} />
      <RepRow label="Observations / Recommendations" value={repOr(value?.observations)} />
    </>
  );
}

export function SignatureBlock() {
  return (
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
  );
}