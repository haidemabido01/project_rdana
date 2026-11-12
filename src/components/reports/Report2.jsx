import {
  ACCESS_MODES,
  COORD_CLUSTERS,
  COORD_LEVELS,
  FORM2_SUBTITLE,
  FORM2_TITLE,
  PREPARE_ITEMS,
  SANITATION_ROWS
} from '../../lib/constants2';
import { displayDT } from '../../lib/format';
import { Letterhead, RepRow, RepTable, RepTriad, SignatureBlock, repChecks, repNum, repOr } from './parts';

const pct = (v) => (v === '' || v == null ? '—' : `${v}%`);

export default function Report2({ inc }) {
  const h = inc.header || {};
  const s1 = inc.s1 || {};
  const s2 = inc.s2 || {};
  const s3 = inc.s3 || {};
  const s4 = inc.s4 || {};
  const s5 = inc.s5 || {};
  const s6 = inc.s6 || {};
  const s7 = inc.s7 || {};
  const s8 = inc.s8 || {};
  const s9 = inc.s9 || {};
  const s10 = inc.s10 || {};
  const s11 = inc.s11 || {};
  const s12 = inc.s12 || {};
  const s13 = inc.s13 || {};

  const waterPct = (Number(s7.sufficientPct) || 0) + (Number(s7.poorPct) || 0) + (Number(s7.nonePct) || 0);

  return (
    <div className="report report-wide">
      <Letterhead />

      <h1>{FORM2_TITLE}</h1>
      <h2>{FORM2_SUBTITLE}</h2>
      <p className="rep-note">To be accomplished in the 2nd Phase of Response — OCD CARAGA Version 2015</p>

      {/* ---------------- Assessment identification ---------------- */}
      <h3>Assessment Identification</h3>
      <RepRow label="Province" value={repOr(h.province)} />
      <RepRow label="Name of Incident" value={repOr(h.incidentName)} />
      <RepRow label="Assessment / Report Date" value={repOr(h.reportDate)} />
      <RepRow label="Date and Time of Event" value={displayDT(h.eventDateTime)} />
      <RepRow
        label="Participating Agency / Organization"
        value={(h.participatingAgencies || []).map((a) => a.name).filter(Boolean).join('; ')}
      />
      <RepRow
        label="GPS Coordinates of area being assessed"
        value={
          h.gpsLat && h.gpsLng
            ? `${h.gpsLat}, ${h.gpsLng}${h.gpsAccuracy ? ` (±${h.gpsAccuracy} m)` : ''}`
            : ''
        }
      />
      <RepRow label="Affected Municipality / City" value={repOr(h.affectedMunicipality)} />
      <RepRow label="Area assessed" value={repOr(h.areaAssessed)} />

      {/* ---------------- 1. Situation before ---------------- */}
      <h3>General Situation Before Disaster</h3>
      <div className="table-wrap rep-table">
        <table className="kv-table">
          <tbody>
            <tr>
              <th>Total Population</th>
              <td>{repNum(s1.totalPopulation)}</td>
              <th>Men</th>
              <td>{repNum(s1.men)}</td>
            </tr>
            <tr>
              <th>Women</th>
              <td>{repNum(s1.women)}</td>
              <th>No. of handicapped or PWDs</th>
              <td>{repNum(s1.pwdCount)}</td>
            </tr>
            <tr>
              <th>Ave. no. of persons / family</th>
              <td>{repNum(s1.avgPersonsPerFamily)}</td>
              <th>Poverty Rate</th>
              <td>{pct(s1.povertyRate)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---------------- 2. Situation after ---------------- */}
      <h3>General Situation After Disaster</h3>
      <div className="table-wrap rep-table">
        <table className="kv-table">
          <tbody>
            <tr>
              <th>Affected Barangays</th>
              <td>{repNum(s2.affectedBarangays)}</td>
              <th>Persons affected</th>
              <td>{repNum(s2.personsAffected)}</td>
              <th>Families affected</th>
              <td>{repNum(s2.familiesAffected)}</td>
            </tr>
            <tr>
              <th>Persons displaced</th>
              <td>{repNum(s2.personsDisplaced)}</td>
              <th>Families displaced</th>
              <td>{repNum(s2.familiesDisplaced)}</td>
              <th>Children under 2</th>
              <td>{repNum(s2.childrenUnder2)}</td>
            </tr>
            <tr>
              <th>Pregnant Women</th>
              <td>{repNum(s2.pregnantWomen)}</td>
              <th>Elderly (&gt;60)</th>
              <td>{repNum(s2.elderly60)}</td>
              <th>IPs</th>
              <td>{repNum(s2.ips)}</td>
            </tr>
            <tr>
              <th>PWDs</th>
              <td>{repNum(s2.pwds)}</td>
              <th>Deaths</th>
              <td>{repNum(s2.deaths)}</td>
              <th>Injured</th>
              <td>{repNum(s2.injured)}</td>
            </tr>
            <tr>
              <th>Missing</th>
              <td>{repNum(s2.missing)}</td>
              <th />
              <td />
              <th />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---------------- 3. Roads and bridges ---------------- */}
      <h3>Affected Roads and Bridges</h3>
      <h4>Roads</h4>
      <RepTable
        head={['Classification', 'Area / Location', 'Damage Description', 'Status']}
        empty="No affected roads recorded."
        rows={s3.roads || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.classification)}</td>
            <td>{repOr(r.areaLocation)}</td>
            <td>{repOr(r.damageDescription)}</td>
            <td>{repOr(r.status)}</td>
          </tr>
        )}
      />
      <h4>Bridges</h4>
      <RepTable
        head={['Area / Location', 'Name of Bridge', 'Damage Description', 'Status']}
        empty="No affected bridges recorded."
        rows={s3.bridges || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.areaLocation)}</td>
            <td>{repOr(r.bridgeName)}</td>
            <td>{repOr(r.damageDescription)}</td>
            <td>{repOr(r.status)}</td>
          </tr>
        )}
      />

      {/* ---------------- 4. Accessibility ---------------- */}
      <h3>Accessibility to Affected Municipalities and Disaster Zones</h3>
      <RepTable
        head={['Destination', ...ACCESS_MODES.map((m) => `${m.label} (${m.hint})`), 'Observations']}
        empty="No accessibility data recorded."
        rows={s4.routes || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repOr(r.byLand)}</td>
            <td>{repOr(r.byAir)}</td>
            <td>{repOr(r.byWater)}</td>
            <td>{repOr(s4.observations)}</td>
          </tr>
        )}
      />

      {/* ---------------- 5. Utilities ---------------- */}
      <h3>Electricity, Communication and Fuel in Disaster Zones</h3>
      <RepTable
        head={['Service', 'Status', 'Why?']}
        empty="No service status recorded."
        rows={s5.services || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repChecks(r.status)}</td>
            <td>{repOr(r.why)}</td>
          </tr>
        )}
      />
      <RepRow label="Observations / Recommendations" value={repOr(s5.observations)} />

      {/* ---------------- 6. Health ---------------- */}
      <h3>Health</h3>
      <h4>Availability of Medical Personnel, Medicines and Medical Supplies</h4>
      <RepTable
        head={['Item', 'Available Provisions', 'With Extra Provisions', 'Satisfy the Needs']}
        empty="No availability data recorded."
         rows={(s6.supplies || []).filter((r) => r.label !== 'Others')}
         renderRow={(r) => (
           <tr key={r.id}>
             <td>{r.label}</td>
             <td>{repOr(r.available)}</td>
             <td>{repOr(r.extra)}</td>
             <td>{repOr(r.satisfies)}</td>
           </tr>
         )}
       />
       {s6.suppliesOthers && <RepRow label="Others (specify)" value={repOr(s6.suppliesOthers)} />}
      <h4>Health Establishments in the Disaster Zone</h4>
      <RepTable
        head={['Name of Health Facility', 'Category', 'Operational (No.)', 'Non-operational', 'Type of Damage', 'No. Beds Available', 'Water', 'Electricity', 'Back-up Power']}
        empty="No health facilities recorded."
        rows={s6.facilities || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.facilityName)}</td>
            <td>{repOr(r.category)}</td>
            <td>{repNum(r.operationalNo)}</td>
            <td>{repNum(r.nonOperationalNo)}</td>
            <td>{repOr(r.damageType)}</td>
            <td>{repNum(r.bedsAvailable)}</td>
            <td>{repOr(r.water)}</td>
            <td>{repOr(r.electricity)}</td>
            <td>{repOr(r.backupPower)}</td>
          </tr>
        )}
      />
      <h4>Disposal of Corpses</h4>
      <RepRow label="Are corpses being disposed of?" value={repOr((s6.disposal || {}).corpsesYN)} />
      <RepRow label="Problems for disposal of human corpses?" value={repOr((s6.disposal || {}).humanCorpseProblem)} />
      <RepRow label="Problems for disposal of animal corpses?" value={repOr((s6.disposal || {}).animalCorpseProblem)} />
      <RepTriad sectorLabel="Health" value={s6} />

      {/* ---------------- 7. WASH ---------------- */}
      <h3>WASH</h3>
      <h4>Water Supply</h4>
      <RepRow label="Was there water supply before the event?" value={repOr(s7.waterBeforeYN)} />
      <div className="table-wrap rep-table">
        <table>
          <thead>
            <tr>
              <th>Sufficient (%)</th>
              <th>Poor (%)</th>
              <th>None (%)</th>
              <th>Total</th>
              <th>Estimated dwellings / shelters with water (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{pct(s7.sufficientPct)}</td>
              <td>{pct(s7.poorPct)}</td>
              <td>{pct(s7.nonePct)}</td>
              <td>{waterPct ? `${Math.round(waterPct)}%` : '—'}</td>
              <td>{pct(s7.dwellingsWithWaterPct)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <RepRow label="Observations" value={repOr(s7.waterObservations)} />
      <RepRow label="Alternative source — Surface" value={repOr(s7.altSurfaceYN)} />
      <RepRow label="Alternative source — Subterranean" value={repOr(s7.altSubterraneanYN)} />
      <RepTable
        head={['Water source', 'Damaged', 'Contaminated', 'Destroyed', 'Remarks']}
        empty="No alternative water sources recorded."
        rows={s7.altWater || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repOr(r.damaged)}</td>
            <td>{repOr(r.contaminated)}</td>
            <td>{repOr(r.destroyed)}</td>
            <td>{repOr(r.remarks)}</td>
          </tr>
        )}
      />
      <RepRow label="Observations" value={repOr(s7.altObservations)} />
      <RepRow label="Impact on Water Supply" value={repOr(s7.impactWater)} />

      <h4>Sanitation System</h4>
      <RepTable
        head={['System', 'Functional', 'Observations (signs of contamination?)']}
        empty="No sanitation data recorded."
        rows={SANITATION_ROWS.map((r) => ({ id: r.key, label: r.label, ...(s7[r.key] || {}) }))}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repOr(r.functionalYN)}</td>
            <td>{repOr(r.observations)}</td>
          </tr>
        )}
      />
      <RepRow label="Latrines — no. of units damaged" value={repNum((s7.latrines || {}).unitsDamaged)} />
      <RepTable
        head={['Needs', 'Estimated Quantity', 'Estimated No. of Families', 'Observations']}
        empty="No main sanitation needs recorded."
        rows={s7.sanitationNeeds || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.needs)}</td>
            <td>{repNum(r.quantity)}</td>
            <td>{repNum(r.families)}</td>
            <td>{repOr(r.observations)}</td>
          </tr>
        )}
      />
      <RepRow label="Impact on Sanitation" value={repOr(s7.impactSanitation)} />
      <RepRow label="Early Recovery Issues" value={repOr(s7.earlyRecoveryIssues)} />
      <RepRow label="Observations / Recommendations" value={repOr(s7.observations)} />

      {/* ---------------- 8. Food and nutrition ---------------- */}
      <h3>Food and Nutrition</h3>
      <h4>Food Sources</h4>
      <RepTable
        head={['Main source of food for displaced families', 'Before the disaster', 'After the disaster', 'Observations']}
        empty="No food sources recorded."
        rows={s8.sources || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repOr(r.before)}</td>
            <td>{repOr(r.after)}</td>
            <td>{repOr(r.observations)}</td>
          </tr>
        )}
      />
      <h4>Means for Affected Families to Prepare Food</h4>
      <RepTable
        head={['Item', 'Yes', 'No', 'Observations']}
        empty="No cooking-facility data recorded."
        rows={PREPARE_ITEMS.map((it) => ({
          id: it.key,
          label: it.label,
          yn: (s8.prepare || {})[it.yn],
          obs: (s8.prepare || {})[it.obs]
        }))}
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="rowlabel">{r.label}</td>
            <td style={{ textAlign: 'center' }}>{r.yn === 'Yes' ? '✓' : ''}</td>
            <td style={{ textAlign: 'center' }}>{r.yn === 'No' ? '✓' : ''}</td>
            <td>{repOr(r.obs)}</td>
          </tr>
        )}
      />
      <h4>Food Reserves</h4>
      <RepRow label="Do the affected families have food?" value={repOr((s8.reserves || {}).affectedYN)} />
      <RepRow label="Do the displaced families have food?" value={repOr((s8.reserves || {}).displacedYN)} />
      <RepRow label="How long would the reserves last, if any?" value={repOr((s8.reserves || {}).duration)} />
      <RepRow label="Can affected / displaced families access or buy food?" value={repOr((s8.reserves || {}).capacityYN)} />
      <RepRow label="Observations" value={repOr((s8.reserves || {}).observations)} />
      <h4>Food Interventions</h4>
      <RepTable
        head={['Donor / Source', 'Products distributed', 'Available inventory', 'Existing program?']}
        empty="No food interventions recorded."
        rows={s8.interventions || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.donorSource)}</td>
            <td>{repOr(r.productsDistributed)}</td>
            <td>{repOr(r.availableInventory)}</td>
            <td>{repOr(r.existingProgramYN)}</td>
          </tr>
        )}
      />
      <RepTable
        head={['Assessed Needs', 'Estimated Quantity', 'Estimated No. of Recipient Families', 'Observations']}
        empty="No main food and nutrition needs recorded."
        rows={s8.foodNeeds || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.assessedNeeds)}</td>
            <td>{repNum(r.quantity)}</td>
            <td>{repNum(r.families)}</td>
            <td>{repOr(r.observations)}</td>
          </tr>
        )}
      />
      <RepTriad sectorLabel="Food and Nutrition" value={s8} />

      {/* ---------------- 9. Shelter ---------------- */}
      <h3>Shelter</h3>
      <RepRow label="Estimated no. of totally damaged shelters" value={repNum(s9.totallyDamaged)} />
      <RepRow label="Estimated no. of partially damaged shelters" value={repNum(s9.partiallyDamaged)} />
      <RepRow label="Est. no. of families in evacuation centers w/ destroyed shelters" value={repNum(s9.familiesEvacDestroyed)} />
      <RepRow label="Est. no. of families staying with host families" value={repNum(s9.familiesWithHosts)} />
      <RepTable
        head={['Needs', 'Estimated Quantity', 'Estimated No. of Families']}
        empty="No main shelter needs recorded."
        rows={s9.shelterNeeds || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.needs)}</td>
            <td>{repNum(r.quantity)}</td>
            <td>{repNum(r.families)}</td>
          </tr>
        )}
      />
      <RepTriad sectorLabel="Shelter" value={s9} />

      {/* ---------------- 10. Livelihood ---------------- */}
      <h3>Livelihood</h3>
      <RepTable
        head={['Activity / Sector', 'Impact', 'Sectors Mainly Female or Male', 'Est. No. of Families Affected']}
        empty="No livelihood sector data recorded."
        rows={s10.sectors || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repOr(r.impact)}</td>
            <td>{repOr(r.mainly)}</td>
            <td>{repNum(r.familiesAffected)}</td>
          </tr>
        )}
      />
      <RepTable
        head={['Needs', 'Estimated Quantity', 'Est. No. of Families to Benefit', 'Observations']}
        empty="No main livelihood needs recorded."
        rows={s10.livelihoodNeeds || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.needs)}</td>
            <td>{repNum(r.quantity)}</td>
            <td>{repNum(r.families)}</td>
            <td>{repOr(r.observations)}</td>
          </tr>
        )}
      />
      <RepTriad sectorLabel="Livelihood" value={s10} />

      {/* ---------------- 11. Protection ---------------- */}
      <h3>Protection</h3>
      <RepTable
        head={['Situation of Children', 'Total Number', 'Boys', 'Girls']}
        empty="No child protection data recorded."
        rows={s11.children || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repNum(r.total)}</td>
            <td>{repNum(r.boys)}</td>
            <td>{repNum(r.girls)}</td>
          </tr>
        )}
      />
      <RepRow label="Instances / registration / monitoring of mistreatment, rape and sexual abuse?" value={repOr(s11.mistreatmentAbuseYN)} />
      <RepRow label="Organisations that work in psychosocial support?" value={repOr(s11.psychosocialOrgsYN)} />
      <RepRow label="Organisations that work for the protection of rights?" value={repOr(s11.rightsOrgsYN)} />
      <RepRow label="Barriers" value={repOr(s11.barriers)} />
      <RepTable
        head={['Needs', 'Quantity', 'No. of Families', 'Observations']}
        empty="No main protection needs recorded."
        rows={s11.protectionNeeds || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.needs)}</td>
            <td>{repNum(r.quantity)}</td>
            <td>{repNum(r.families)}</td>
            <td>{repOr(r.observations)}</td>
          </tr>
        )}
      />
      <RepTriad sectorLabel="Protection" value={s11} />

      {/* ---------------- 12. Education ---------------- */}
      <h3>Education</h3>
      <RepTable
        head={['Impact on Schools', 'Total Existing', 'Partially Damaged', 'Totally Damaged']}
        empty="No school data recorded."
        rows={s12.schools || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repNum(r.totalExisting)}</td>
            <td>{repNum(r.partiallyDamaged)}</td>
            <td>{repNum(r.totallyDamaged)}</td>
          </tr>
        )}
      />
      <RepTable
        head={['Needs', 'Quantity', 'No. of Families', 'Observations']}
        empty="No main education needs recorded."
        rows={s12.educationNeeds || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{repOr(r.needs)}</td>
            <td>{repNum(r.quantity)}</td>
            <td>{repNum(r.families)}</td>
            <td>{repOr(r.observations)}</td>
          </tr>
        )}
      />
      <RepTriad sectorLabel="Education" value={s12} />

      {/* ---------------- 13. Organization and coordination ---------------- */}
      <h3>Organization and Coordination</h3>
      <RepTable
        head={['Cluster', ...COORD_LEVELS.map((l) => l.label)]}
        empty="No cluster activation recorded."
        rows={COORD_CLUSTERS.map((c) => {
          const row = { id: c.key, label: c.label };
          COORD_LEVELS.forEach((l) => {
            row[l.key] = ((s13.grid || {})[c.key] || {})[l.key] || '';
          });
          return row;
        })}
        className="coord-print"
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            {COORD_LEVELS.map((l) => (
              <td key={l.key}>{repOr(r[l.key])}</td>
            ))}
          </tr>
        )}
      />
      <h4>Information Flow</h4>
      <RepTable
        head={['Body', 'Existing?']}
        empty="No information flow data recorded."
        rows={s13.infoFlow || []}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>{repOr(r.existsYN)}</td>
          </tr>
        )}
      />
      <RepRow label="Main Needs in Coordination" value={repOr(s13.mainNeeds)} />
      <RepTriad sectorLabel="Coordination" value={s13} />

      <SignatureBlock />
    </div>
  );
}