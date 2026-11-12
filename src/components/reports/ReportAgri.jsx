import { displayDT } from '../../lib/format';
import { RepRow, RepTable, repChecks, repNum, repOr } from './parts';

export default function ReportAgri({ inc }) {
  const h = inc.header || {};
  const infra = inc.infrastructure || [];
  const crops = inc.crops || [];
  const animals = inc.animals || [];

  return (
    <div className="report">
      <h1>Rapid Damage Assessment and Needs Analysis (RDANA)</h1>
      <h2>Agriculture Office</h2>

      <h3>Assessment Profile</h3>
      <RepRow label="Type of Disaster" value={repOr(h.typeOfDisaster)} />
      <RepRow label="Date and Time of Occurrence" value={displayDT(h.occurrenceDateTime)} />
      <RepRow label="Location" value={repOr(h.location)} />
      <RepRow label="Affected No. of Farmers/Fisherfolks" value={repNum(h.affectedFarmers)} />
      <RepRow label="Sector" value={repOr(h.sector)} />

      <h3>A. Infrastructure Issues</h3>
      <RepTable
        head={['Facility or Property', 'Degree of Damage', 'Description of Damage/Remarks']}
        empty="No infrastructure damage recorded."
        rows={infra}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.facility}</td>
            <td>{repChecks(r.degree)}</td>
            <td>{repOr(r.remarks)}</td>
          </tr>
        )}
      />

      <h3>B. Crop Issues</h3>
      <RepTable
        head={['Crops Affected', 'Totally Damaged', 'Partially Damaged', 'Farmers Affected', 'Description of Damage/Remarks']}
        empty="No crop damage recorded."
        rows={crops}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.crop}</td>
            <td>{repNum(r.totallyDamaged)}</td>
            <td>{repNum(r.partiallyDamaged)}</td>
            <td>{repNum(r.farmersAffected)}</td>
            <td>{repOr(r.remarks)}</td>
          </tr>
        )}
      />

      <h3>C. Animal Issues</h3>
      <RepTable
        head={['Animals Affected', 'Dead', 'Partially Damaged', 'Missing', 'Injured', 'Description of Damage/Remarks']}
        empty="No animal damage recorded."
        rows={animals}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.animal)}</td>
            <td>{repNum(r.dead)}</td>
            <td>{repNum(r.partiallyDamaged)}</td>
            <td>{repNum(r.missing)}</td>
            <td>{repNum(r.injured)}</td>
            <td>{repOr(r.remarks)}</td>
          </tr>
        )}
      />

      <h3>D. Fisheries / Resources</h3>
      <RepTable
        head={['Resource Used', 'Partially Damaged', 'Totally Damaged', 'Units', 'Farmers/Fisherfolks Affected', 'Description of Damage/Remarks']}
        empty="No fishery resources recorded."
        rows={inc.fisheries || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.resource)}</td>
            <td>{repNum(r.partiallyDamaged)}</td>
            <td>{repNum(r.totallyDamaged)}</td>
            <td>{repOr(r.units)}</td>
            <td>{repNum(r.farmersAffected)}</td>
            <td>{repOr(r.remarks)}</td>
          </tr>
        )}
      />

      <h3>E. Agricultural Implements and Machineries</h3>
      <RepTable
        head={['Machinery / Implement', 'Description of Damage', 'Partially Damaged', 'Totally Damaged', 'Remarks']}
        empty="No machineries recorded."
        rows={inc.machineries || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.machinery)}</td>
            <td>{repOr(r.description)}</td>
            <td>{repNum(r.partiallyDamaged)}</td>
            <td>{repNum(r.totallyDamaged)}</td>
            <td>{repOr(r.remarks)}</td>
          </tr>
        )}
      />

      <h3>F. Costing / Cost of Production Damages</h3>
      <RepRow label="Cost of Production Damages" value={repNum((inc.costing || {}).productionDamages)} />
      <RepRow label="Estimated Amount of Damages (PHP)" value={repNum((inc.costing || {}).estimatedAmount)} />
      <RepRow label="Remarks" value={repOr((inc.costing || {}).remarks)} />

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
  );
}
