import { collectProfileRows, collectRegisterRows } from '../../lib/analytics';
import { DISAGG_COLUMNS, METRICS } from '../../lib/constants';
import {
  formatPct,
  formatPeso,
  isFilledRow,
  profileMetrics,
  registerTotals
} from '../../lib/damage';
import { composeSitePlace, displayDT, fmtNum } from '../../lib/format';
import { Letterhead, RepRow, RepTable, SignatureBlock, repOr } from './parts';

export default function Report1({ inc, buildingIncidents = [] }) {
  const p = inc.profile || {};
  const eff = inc.initialEffects || {};
  const types = Array.isArray(p.disasterTypes) ? p.disasterTypes : [];

  /* Damage register + barangay roll-up (digital supplement), automatically
     including filled Building Structure assessments saved on the device. */
  const dmg = inc.damage || {};
  const extraStructureRows = collectRegisterRows(buildingIncidents);
  const extraProfileRows = collectProfileRows(buildingIncidents);
  const structures = [...(dmg.structures || []).filter(isFilledRow), ...extraStructureRows];
  const profiles = [
    ...(dmg.barangays || []).filter((r) =>
      [
        r.barangay,
        r.totalHouses,
        r.damagedHouses,
        r.totallyDamaged,
        r.partiallyDamaged,
        r.affectedFamilies,
        r.estimatedCost,
        r.remarks
      ].some((v) => v !== '' && v != null)
    ),
    ...extraProfileRows
  ];
  const dmgTotals = registerTotals(structures);
  const profileMetricsList = profiles.map((r) => ({ row: r, m: profileMetrics(r) }));
  const housesTotal = profileMetricsList.reduce((a, x) => a + x.m.total, 0);
  const housesDamaged = profileMetricsList.reduce((a, x) => a + x.m.damaged, 0);
  const overallPct = housesTotal > 0 ? (housesDamaged / housesTotal) * 100 : null;

  return (
    <div className="report">
      <Letterhead />

      <h1>Rapid Damage Assessment and Needs Analysis</h1>
      <h2>(Initial Report / Form I — Phase 1, within 72 hours)</h2>

      <h3>I. Profile of the Disaster</h3>
      <RepRow label="Site Location" value={repOr(composeSitePlace(p))} />
      <RepRow label="Specific Address / Site Detail" value={repOr(p.siteLocation)} />
      <RepRow label="Time of RDANA Team Arrival" value={displayDT(p.timeArrival)} />
      <RepRow label="Time of RDANA Team Departure" value={displayDT(p.timeDeparture)} />
      <RepRow
        label="Local Authorities / Persons Interviewed"
        value={(p.interviewees || []).map((x) => x.name).filter(Boolean).join('; ')}
      />
      <RepRow
        label="GPS Coordinates"
        value={
          p.gpsLat && p.gpsLng
            ? `${p.gpsLat}, ${p.gpsLng}${p.gpsAccuracy ? ` (±${p.gpsAccuracy} m)` : ''}`
            : ''
        }
      />
      <RepRow label="Type of Disaster" value={types.join(' · ')} />
      <RepRow label="Date and Time of Occurrence" value={displayDT(p.occurrenceTime)} />
      <RepRow label="Summary of Disaster / Incident" value={repOr(p.summary)} />

      <h3>II. Initial Effects</h3>
      <div className="table-wrap rep-table">
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
      </div>

      <h3>III. Status of Lifelines and Critical Facilities</h3>
      <RepTable
        head={['Lifeline / Facility', 'Status', 'Observation']}
        empty="No lifeline observations recorded."
        rows={(inc.lifelines || []).filter((l) => l.status || l.observation)}
        renderRow={(l) => (
          <tr key={l.id}>
            <td>{l.label || 'Others'}</td>
            <td>{repOr(l.status)}</td>
            <td>{repOr(l.observation)}</td>
          </tr>
        )}
      />

      <h3>IV. Other Health and Non-Health Related Issues</h3>
      <RepTable
        head={['Health Issues', 'Non-Health Issues']}
        empty="No issues recorded."
        rows={inc.issues || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.healthIssue)}</td>
            <td>{repOr(r.nonHealthIssue)}</td>
          </tr>
        )}
      />

      <h3>V. Initial Response Actions</h3>
      <RepTable
        head={['Response Group Involved', 'Assets Deployed', 'Extent of Assistance / Actions Taken', 'No. of Families Served']}
        empty="No response actions recorded."
        rows={inc.responseActions || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.groupInvolved)}</td>
            <td>{repOr(r.assetsDeployed)}</td>
            <td>{repOr(r.assistanceExtent)}</td>
            <td>{fmtNum(r.familiesServed)}</td>
          </tr>
        )}
      />

      <h3>VI. Initial Needs Assessment</h3>
      <RepTable
        head={['Cluster', 'Priority Needs']}
        empty="No needs recorded."
        rows={inc.needs || []}
        renderRow={(n) => (
          <tr key={n.id}>
            <td>{n.label}</td>
            <td>{repOr(n.priorityNeeds)}</td>
          </tr>
        )}
      />

      <h3>VII. Damage Register — Houses and Buildings</h3>
      {structures.length === 0 && profiles.length === 0 ? (
        <p className="rep-empty">No damage register entries recorded.</p>
      ) : (
        <>
          <RepRow label="Units assessed / damaged" value={`${fmtNum(dmgTotals.units)} / ${fmtNum(dmgTotals.damagedUnits)}`} />
          <RepRow label="Percentage of units damaged" value={overallPct === null ? '—' : formatPct(overallPct, 1)} />
          <RepRow label="Weighted damage index" value={formatPct(dmgTotals.damageIndex, 1)} />
          <RepRow label="Estimated damage cost" value={formatPeso(dmgTotals.cost)} />
          <RepTable
            head={[
              'Barangay / Purok',
              'Type of Building',
              'Building / Structure Name',
              'Type of Structure',
              'Damage Level',
              'No. of Units',
              'Est. Cost (₱)',
              'Remarks'
            ]}
            empty="No damaged structures recorded."
            rows={structures}
            renderRow={(s) => (
              <tr key={s.id}>
                <td>
                  {[s.barangay, s.purok].filter(Boolean).join(' / ') || '—'}
                </td>
                <td>{repOr(s.buildingType)}</td>
                <td>{repOr(s.buildingName)}</td>
                <td>{repOr(s.structureType)}</td>
                <td>{repOr(s.damageLevel)}</td>
                <td>{fmtNum(s.units)}</td>
                <td>{formatPeso(s.estimatedCost)}</td>
                <td>{repOr(s.remarks)}</td>
              </tr>
            )}
          />
          {dmg.notes && (
            <>
              <h4>Damage Remarks / Key Notes</h4>
              <p className="rep-note" style={{ margin: '0 0 10px', textAlign: 'left' }}>
                {dmg.notes}
              </p>
            </>
          )}
        </>
      )}

      <h3>VIII. Barangay Damage Profile and Priority</h3>
      <RepTable
        head={[
          'Barangay',
          'Total Houses',
          'Damaged',
          'Totally Damaged',
          'Partially Damaged',
          'Affected Families',
          'Damage %',
          'Category',
          'Priority',
          'Est. Cost (₱)'
        ]}
        empty="No barangay damage profiles recorded."
        rows={profileMetricsList}
        renderRow={(x) => (
          <tr key={x.row.id}>
            <td>{repOr(x.row.barangay)}</td>
            <td>{fmtNum(x.m.total)}</td>
            <td>{fmtNum(x.m.damaged)}</td>
            <td>{fmtNum(x.m.totalLoss)}</td>
            <td>{fmtNum(x.m.partial)}</td>
            <td>{fmtNum(x.row.affectedFamilies)}</td>
            <td>{formatPct(x.m.damagePct, 1)}</td>
            <td>{x.m.severity}</td>
            <td>{x.m.priority}</td>
            <td>{formatPeso(x.row.estimatedCost)}</td>
          </tr>
        )}
      />

      <SignatureBlock />
    </div>
  );
}