import { formatPeso, numOr } from '../../lib/damage';
import { Letterhead, RepRow, SignatureBlock, repOr, repNum } from './parts';

export default function ReportBuilding({ inc }) {
  const d = inc.disaster || {};
  const c = inc.classification || {};
  const b = inc.building || {};
  const s = inc.structure || {};
  const co = inc.condition || {};
  const cost = inc.cost || {};
  const a = inc.assessment || {};

  const damageCost = numOr(cost.damageCost);
  const repairCost = numOr(cost.repairCost);
  const affectedCount = numOr(b.affectedIndividuals) || numOr(b.occupants);

  return (
    <div className="report">
      <Letterhead />

      <h1>Building Structure Assessment Report</h1>
      <h2>Disaster Situation Overview &amp; Physical Structure Evaluation</h2>

      <h3>Situation Overview Summary</h3>
      <div className="table-wrap rep-table">
        <table>
          <thead>
            <tr>
              <th>Building Name</th>
              <th>Barangay / Location</th>
              <th>Calamity Type</th>
              <th>Damage Severity</th>
              <th>Usability Status</th>
              <th>Affected Persons</th>
              <th>Est. Damage Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{repOr(b.buildingName)}</td>
              <td>{[b.barangay, b.purok, b.municipality].filter(Boolean).join(', ') || '—'}</td>
              <td>{repOr(d.calamityType)}</td>
              <td>{repOr(s.severity)}</td>
              <td>{repOr(co.usabilityStatus)}</td>
              <td>{affectedCount ? affectedCount.toLocaleString() : '—'}</td>
              <td>{damageCost > 0 ? formatPeso(damageCost) : repairCost > 0 ? formatPeso(repairCost) : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Section 1: Disaster Information</h3>
      <RepRow label="Calamity Type" value={repOr(d.calamityType)} />
      <RepRow label="Date of Calamity" value={repOr(d.dateOfCalamity)} />
      {d.calamityType === 'Earthquake' && (
        <>
          <RepRow label="Magnitude" value={repOr(d.magnitude)} />
          <RepRow label="Intensity" value={repOr(d.intensity)} />
        </>
      )}
      {d.calamityType === 'Typhoon' && (
        <RepRow label="Wind Signal" value={repOr(d.windSignal ? `Signal #${d.windSignal}` : '')} />
      )}
      {d.calamityType === 'Flood' && <RepRow label="Rainfall Warning" value={repOr(d.rainfallWarning)} />}
      {d.calamityType && !['Earthquake', 'Typhoon', 'Flood'].includes(d.calamityType) && (
        <RepRow label="Intensity / Magnitude" value={repOr(d.intensity)} />
      )}
      <RepRow label="Impact / Description" value={repOr(d.impactDescription)} />

      <h3>Section 2: Building Classification</h3>
      <RepRow label="Building Classification" value={repOr(c.buildingClassification)} />
      <RepRow label="Building Type" value={repOr(c.buildingType)} />

      <h3>Section 3: Building Information</h3>
      <RepRow label="Building Name" value={repOr(b.buildingName)} />
      <RepRow label="Province" value={repOr(b.province)} />
      <RepRow label="Municipality / City" value={repOr(b.municipality)} />
      <RepRow label="Barangay" value={repOr(b.barangay)} />
      <RepRow label="Purok / Sitio" value={repOr(b.purok)} />
      <RepRow label="Number of floors" value={repOr(b.floors)} />
      <RepRow label="Building Type" value={repOr(b.buildingType)} />
      <RepRow label="Number of Occupants / Residents" value={repNum(b.occupants)} />
      <RepRow label="Building Occupancy" value={repOr(b.buildingOccupancy)} />
      <RepRow label="Number of Affected Individuals" value={repNum(b.affectedIndividuals)} />

      <h3>Section 4: Physical Structure Assessment</h3>
      <RepRow label="Affected Structural Components" value={(s.components || []).join(', ')} />
      {s.otherComponent && <RepRow label="Other structural components" value={repOr(s.otherComponent)} />}
      <RepRow label="Observed Findings / Damage" value={repOr(s.findings)} />
      <RepRow label="Damage Severity" value={repOr(s.severity)} />

      <h3>Section 5: Building Conditions &amp; Status</h3>
      <RepRow label="Building Usability / Safety Status" value={repOr(co.usabilityStatus)} />
      <RepRow label="Recommended Actions" value={repOr(co.recommendedActions)} />

      <h3>Section 6: Estimated Damage Cost</h3>
      <RepRow label="Estimated Damage Cost (PHP)" value={damageCost > 0 ? formatPeso(damageCost) : repNum(cost.damageCost)} />
      <RepRow
        label="Estimated Repair / Rehabilitation Cost (PHP)"
        value={repairCost > 0 ? formatPeso(repairCost) : repNum(cost.repairCost)}
      />

      <h3>Section 7: Assessment Details</h3>
      <RepRow label="Date of Assessment" value={repOr(a.date)} />
      <RepRow label="Time of Assessment" value={repOr(a.time)} />
      <RepRow label="Name of Assessor" value={repOr(a.assessorName)} />
      <RepRow label="Office / Agency" value={repOr(a.office)} />
      <RepRow label="Designation" value={repOr(a.designation)} />
      <RepRow label="Upload Photos of the Building" value={repOr(a.photos)} />
      {Array.isArray(a.photoItems) && a.photoItems.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '10px',
            marginBottom: '12px'
          }}
        >
          {a.photoItems.map((photo) => (
            <figure
              key={photo.id || photo.name}
              style={{
                margin: 0,
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#fff'
              }}
            >
              {photo.dataUrl && (
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  style={{
                    width: '100%',
                    height: '130px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              )}
              <figcaption
                style={{
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0f172a',
                  wordBreak: 'break-word'
                }}
              >
                {photo.name}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <SignatureBlock />
    </div>
  );
}