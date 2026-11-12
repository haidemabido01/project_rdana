import { uid } from '../lib/model';
import {
  ACCESS_MODES,
  ALT_WATER_COLUMNS,
  BRIDGE_COLUMNS,
  COORD_CLUSTERS,
  COORD_LEVELS,
  EDUCATION_NEEDS_COLUMNS,
  FACILITY_COLUMNS,
  FOOD_NEEDS_COLUMNS,
  INTERVENTION_COLUMNS,
  LIVELIHOOD_NEEDS_COLUMNS,
  LIVELIHOOD_SECTOR_COLUMNS,
  POWER_STATUSES,
  PREPARE_ITEMS,
  PROTECTION_NEEDS_COLUMNS,
  ROAD_CLASS_LABELS,
  ROAD_COLUMNS,
  SANITATION_NEEDS_COLUMNS,
  SANITATION_ROWS,
  SHELTER_NEEDS_COLUMNS
} from '../lib/constants2';
import {
  blankBridge,
  blankFacility,
  blankFoodNeed,
  blankIntervention,
  blankNeedsRow,
  blankRoad
} from '../lib/model2';
import {
  DatePicker,
  Field,
  ImpactScale,
  MatrixRows,
  MilitaryDateTimeInput,
  NumberInput,
  RepeatTable,
  SubSection,
  TextArea,
  TextInput
} from './ui';

/* ================================================================== *
 * Shared building blocks
 * ================================================================== */

/* Standalone Yes / No picker. The official form only offers Y and N, so
   there is no explicit N/A — leaving it blank means "not assessed". */
export function YesNoPick({ value, onChange }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
  );
}

/* The "Impact on X / Early Recovery Issues / Observations" triad that
   closes nearly every sector on the official Form 2. */
export function SectorTriad({ path, sector, value = {}, onChange }) {
  return (
    <SubSection title="Impact & recovery" subtitle={`Impact on ${sector.toLowerCase()}`}>
      <Field label={`Impact on ${sector}`} hint="High / Medium / Low / None">
        <ImpactScale value={value.impact} onChange={(v) => onChange(path + '.impact', v)} />
      </Field>
      <Field label="Early Recovery Issues">
        <TextArea
          rows={2}
          value={value.earlyRecoveryIssues}
          onChange={(e) => onChange(path + '.earlyRecoveryIssues', e.target.value)}
          placeholder="What has to be restored first, and by whom…"
        />
      </Field>
      <Field label="Observations / Recommendations">
        <TextArea
          rows={3}
          value={value.observations}
          onChange={(e) => onChange(path + '.observations', e.target.value)}
        />
      </Field>
    </SubSection>
  );
}

/* Province / Municipality pickers backed by the bundled PSGC data. Falls
   back to showing whatever is already stored if it is not in the list. */
function PsgcField({ label, options = [], value = '', onChange, disabled, placeholder, required }) {
  const known = !value || options.includes(value);
  return (
    <Field label={label} required={required}>
      <SelectWrap value={value} disabled={disabled} onChange={onChange} placeholder={placeholder}>
        {!known && <option value={value}>{value} (not in PSGC list)</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </SelectWrap>
    </Field>
  );
}

// Small indirection so the <Select> keeps its own first (empty) option.
function SelectWrap({ value, onChange, children, disabled, placeholder }) {
  return (
    <select value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder || 'Select…'}</option>
      {children}
    </select>
  );
}

const num = (v) => {
  const n = Number(v);
  return v === '' || v == null || !Number.isFinite(n) ? null : n;
};

/* ================================================================== *
 * Page 1 — Assessment Profile (header + General Situation Before)
 * ================================================================== */
export function F2Profile({
  inc,
  onChange,
  onGps,
  gpsBusy,
  gpsError,
  gpsAccuracy,
  gpsWeak,
  removeRow,
  notify,
  provinces,
  municipalities
}) {
  const h = inc.header || {};
  const s1 = inc.s1 || {};
  const agencies = h.participatingAgencies || [];

  const setH = (f, v) => onChange('header.' + f, v);
  const setS1 = (f, v) => onChange('s1.' + f, v);

  const addAgency = () => onChange('header.participatingAgencies', [...agencies, { id: uid(), name: '' }]);
  const setAgency = (i, v) =>
    onChange('header.participatingAgencies', agencies.map((a, j) => (j === i ? { ...a, name: v } : a)));
  const delAgency = (i) => removeRow('header.participatingAgencies', agencies, i, 'agency');

  return (
    <div>
      <SubSection title="Assessment identification">
        <div className="grid-2">
          <PsgcField
            label="Province"
            required
            options={provinces}
            value={h.province}
            onChange={(v) => setH('province', v)}
            placeholder="Select province…"
          />
          <PsgcField
            label="Affected Municipality / City"
            required
            options={municipalities}
            value={h.affectedMunicipality}
            disabled={!h.province}
            onChange={(v) => setH('affectedMunicipality', v)}
            placeholder={h.province ? 'Select municipality / city…' : 'Pick a province first…'}
          />
          <Field label="Name of Incident" required>
            <TextInput
              value={h.incidentName}
              onChange={(e) => setH('incidentName', e.target.value)}
              placeholder="e.g. Typhoon Kristine"
            />
          </Field>
          <Field label="Assessment / Report Date" required>
            <DatePicker value={h.reportDate || ''} onChange={(v) => setH('reportDate', v)} />
          </Field>
          <Field label="Date and Time of Event" required hint="24-hour clock">
            <MilitaryDateTimeInput
              value={h.eventDateTime}
              onChange={(v) => setH('eventDateTime', v)}
            />
          </Field>
          <Field label="Area assessed" hint="Barangays / sitios / zones covered by this assessment">
            <TextInput
              value={h.areaAssessed}
              onChange={(e) => setH('areaAssessed', e.target.value)}
              placeholder="e.g. Poblacion, Barangay Maya…"
            />
          </Field>
        </div>

        <Field
          label="GPS Coordinates of area being assessed"
          error={gpsError}
          hint={
            h.gpsLat && h.gpsLng
              ? `${h.gpsLat}, ${h.gpsLng}${gpsAccuracy != null ? ` · ±${gpsAccuracy} m` : ''}`
              : 'Tap “Get GPS” while standing at the site being assessed, or enter manually.'
          }
        >
          <div className="row">
            <NumberInput
              value={h.gpsLat}
              onChange={(e) => setH('gpsLat', e.target.value)}
              placeholder="Latitude"
              min={-90}
              max={90}
              style={{ flex: 1, minWidth: 120 }}
            />
            <NumberInput
              value={h.gpsLng}
              onChange={(e) => setH('gpsLng', e.target.value)}
              placeholder="Longitude"
              min={-180}
              max={180}
              style={{ flex: 1, minWidth: 120 }}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={onGps} disabled={gpsBusy}>
              {gpsBusy ? 'Locating…' : 'Get GPS'}
            </button>
          </div>
          {gpsWeak && (
            <p className="gps-weak">
              Weak fix — this pin is only accurate to about ±{gpsAccuracy} m. Stand in the open, away from
              trees and buildings, and tap Get GPS again if you need an exact location.
            </p>
          )}
        </Field>

        <Field label="Participating Agency / Organization">
          <div className="repeat">
            {agencies.map((a, i) => (
              <div key={a.id} className="repeat-item">
                <TextInput
                  value={a.name}
                  onChange={(e) => setAgency(i, e.target.value)}
                  placeholder={`Agency ${i + 1} — name / office`}
                />
                {agencies.length > 1 && (
                  <button type="button" title="Remove" className="btn btn-ghost btn-sm remove" onClick={() => delAgency(i)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={addAgency}>
              + Add agency
            </button>
          </div>
        </Field>
      </SubSection>

      <SubSection title="General situation before the disaster" subtitle="baseline">
        <div className="grid-2">
          <Field label="Total Population">
            <NumberInput value={s1.totalPopulation} onChange={(e) => setS1('totalPopulation', e.target.value)} />
          </Field>
          <Field label="No. of handicapped or PWDs">
            <NumberInput value={s1.pwdCount} onChange={(e) => setS1('pwdCount', e.target.value)} />
          </Field>
          <Field label="Men">
            <NumberInput value={s1.men} onChange={(e) => setS1('men', e.target.value)} />
          </Field>
          <Field label="Women">
            <NumberInput value={s1.women} onChange={(e) => setS1('women', e.target.value)} />
          </Field>
          <Field label="Ave. no. of persons / family">
            <NumberInput
              step="1"
              value={s1.avgPersonsPerFamily}
              onChange={(e) => setS1('avgPersonsPerFamily', e.target.value)}
            />
          </Field>
          <Field label="Poverty Rate (%)" hint="Share of poor households in the area before the event.">
            <div className="pct">
              <NumberInput
                max="100"
                step="1"
                value={s1.povertyRate}
                onChange={(e) => setS1('povertyRate', e.target.value)}
              />
              <span className="pct-sum">%</span>
            </div>
          </Field>
        </div>
        <p className="sum-note">
          Men + Women should reconcile against Total Population. This baseline is what the after-disaster
          figures on the next page are compared against.
        </p>
      </SubSection>
    </div>
  );
}

/* ================================================================== *
 * Page 2 — General Situation After the Disaster
 * ================================================================== */
export function F2After({ inc, onChange }) {
  const s = inc.s2 || {};
  const set = (f, v) => onChange('s2.' + f, v);

  return (
    <div>
      <SubSection title="People affected" subtitle="persons and families">
        <div className="grid-2">
          <Field label="Affected Barangays" hint="Number of barangays affected">
            <NumberInput value={s.affectedBarangays} onChange={(e) => set('affectedBarangays', e.target.value)} />
          </Field>
          <Field label="Persons affected">
            <NumberInput value={s.personsAffected} onChange={(e) => set('personsAffected', e.target.value)} />
          </Field>
          <Field label="Families affected">
            <NumberInput value={s.familiesAffected} onChange={(e) => set('familiesAffected', e.target.value)} />
          </Field>
          <Field label="Persons displaced">
            <NumberInput value={s.personsDisplaced} onChange={(e) => set('personsDisplaced', e.target.value)} />
          </Field>
          <Field label="Families displaced">
            <NumberInput value={s.familiesDisplaced} onChange={(e) => set('familiesDisplaced', e.target.value)} />
          </Field>
        </div>
      </SubSection>

      <SubSection title="Groups requiring specific attention">
        <div className="grid-2">
          <Field label="Children under 2">
            <NumberInput value={s.childrenUnder2} onChange={(e) => set('childrenUnder2', e.target.value)} />
          </Field>
          <Field label="Pregnant Women">
            <NumberInput value={s.pregnantWomen} onChange={(e) => set('pregnantWomen', e.target.value)} />
          </Field>
          <Field label="Elderly (>60)">
            <NumberInput value={s.elderly60} onChange={(e) => set('elderly60', e.target.value)} />
          </Field>
          <Field label="IPs" hint="Indigenous Peoples">
            <NumberInput value={s.ips} onChange={(e) => set('ips', e.target.value)} />
          </Field>
          <Field label="PWDs">
            <NumberInput value={s.pwds} onChange={(e) => set('pwds', e.target.value)} />
          </Field>
        </div>
      </SubSection>

      <SubSection title="Casualties">
        <div className="grid-2">
          <Field label="Deaths">
            <NumberInput value={s.deaths} onChange={(e) => set('deaths', e.target.value)} />
          </Field>
          <Field label="Injured">
            <NumberInput value={s.injured} onChange={(e) => set('injured', e.target.value)} />
          </Field>
          <Field label="Missing">
            <NumberInput value={s.missing} onChange={(e) => set('missing', e.target.value)} />
          </Field>
        </div>
        <p className="sum-note">
          Deaths, injured and missing should not exceed the number of persons affected.
        </p>
      </SubSection>
    </div>
  );
}

/* ================================================================== *
 * Page 3 — Affected Roads and Bridges + Accessibility
 * ================================================================== */
export function F2Access({ inc, onChange, removeRow }) {
  const s3 = inc.s3 || {};
  const s4 = inc.s4 || {};
  const roads = s3.roads || [];
  const bridges = s3.bridges || [];
  const routes = s4.routes || [];

  return (
    <div>
      <SubSection title="Affected roads" subtitle="classification · damage · passability">
        <RepeatTable
          rows={roads}
          columns={ROAD_COLUMNS}
          onChange={(i, f, v) => onChange(`s3.roads.${i}.${f}`, v)}
          onAdd={() => onChange('s3.roads', [...roads, blankRoad()])}
          onRemove={(i) => removeRow('s3.roads', roads, i, 'affected road')}
          addLabel="+ Add affected road"
          note={
            'Classification codes: ' +
            Object.entries(ROAD_CLASS_LABELS)
              .map(([k, v]) => `${k} = ${v}`)
              .join(' · ')
          }
        />
      </SubSection>

      <SubSection title="Affected bridges">
        <RepeatTable
          rows={bridges}
          columns={BRIDGE_COLUMNS}
          onChange={(i, f, v) => onChange(`s3.bridges.${i}.${f}`, v)}
          onAdd={() => onChange('s3.bridges', [...bridges, blankBridge()])}
          onRemove={(i) => removeRow('s3.bridges', bridges, i, 'bridge')}
          addLabel="+ Add affected bridge"
        />
      </SubSection>

      <SubSection title="Accessibility to affected municipalities and disaster zones">
        <div className="repeat">
          {routes.map((r, i) => (
            <div key={r.id} className="repeat-item">
              <b>{r.label}</b>
              <div className="grid-2" style={{ marginTop: 8 }}>
                {ACCESS_MODES.map((m) => (
                  <Field key={m.key} label={m.label} hint={m.hint}>
                    <TextInput
                      value={r[m.key]}
                      onChange={(e) => onChange(`s4.routes.${i}.${m.key}`, e.target.value)}
                      placeholder="e.g. 2 hrs / motorcycle"
                    />
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Field label="Observations / Recommendations">
          <TextArea
            rows={3}
            value={s4.observations}
            onChange={(e) => onChange('s4.observations', e.target.value)}
          />
        </Field>
      </SubSection>
    </div>
  );
}

/* ================================================================== *
 * Page 4 — Electricity, Communication and Fuel in Disaster Zones
 * ================================================================== */
export function F2Utilities({ inc, onChange }) {
  const s5 = inc.s5 || {};
  const services = s5.services || [];

  return (
    <div>
      <SubSection
        title="Electricity, communication and fuel"
        subtitle="tick every status that applies"
      >
        <MatrixRows
          rows={services}
          labelKey="label"
          labelHead="Service"
          minWidth={720}
          columns={[
            { key: 'status', label: 'Status', type: 'checks', options: POWER_STATUSES, width: 300 },
            { key: 'why', label: 'Why?', type: 'text', width: 260 }
          ]}
          onChange={(i, f, v) => onChange(`s5.services.${i}.${f}`, v)}
        />
        <p className="sum-note">
          More than one box may be ticked — a service can be partly working and partly down. “Why?” records the
          cause (e.g. downed pole, no fuel supply, damaged BTS).
        </p>
      </SubSection>

      <Field label="Observations / Recommendations">
        <TextArea rows={3} value={s5.observations} onChange={(e) => onChange('s5.observations', e.target.value)} />
      </Field>
    </div>
  );
}

/* ================================================================== *
 * Page 5 — Health
 * ================================================================== */
export function F2Health({ inc, onChange, removeRow }) {
  const s6 = inc.s6 || {};
  const d = s6.disposal || {};
  const facilities = s6.facilities || [];

  return (
    <div>
      <SubSection title="Availability of medical personnel, medicines and supplies">
         <MatrixRows
           rows={(s6.supplies || []).filter((r) => r.label !== 'Others')}
           labelKey="label"
           labelHead="Item"
           minWidth={640}
          columns={[
            { key: 'available', label: 'Available Provisions', type: 'yn', width: 150 },
            { key: 'extra', label: 'With Extra Provisions', type: 'yn', width: 155 },
            { key: 'satisfies', label: 'Satisfy the Needs', type: 'yn', width: 145 }
          ]}
           onChange={(i, f, v) => onChange(`s6.supplies.${i}.${f}`, v)}
         />
         <Field label="Others (specify)">
           <TextInput
             value={s6.suppliesOthers || ''}
             onChange={(e) => onChange('s6.suppliesOthers', e.target.value)}
             placeholder="Manual entry..."
           />
         </Field>
       </SubSection>

      <SubSection title="Health establishments in the disaster zone">
        <RepeatTable
          rows={facilities}
          cols={3}
          columns={FACILITY_COLUMNS}
          onChange={(i, f, v) => onChange(`s6.facilities.${i}.${f}`, v)}
          onAdd={() => onChange('s6.facilities', [...facilities, blankFacility()])}
          onRemove={(i) => removeRow('s6.facilities', facilities, i, 'health facility')}
          addLabel="+ Add health facility"
        />
      </SubSection>

      <SubSection title="Disposal of corpses">
        <div className="grid-2">
          <Field label="Are corpses being disposed of?">
            <YesNoPick
              value={d.corpsesYN}
              onChange={(v) => onChange('s6.disposal.corpsesYN', v)}
            />
          </Field>
          <Field label="Problems disposing human corpses?">
            <YesNoPick value={d.humanCorpseProblem} onChange={(v) => onChange('s6.disposal.humanCorpseProblem', v)} />
          </Field>
          <Field label="Problems disposing animal corpses?">
            <YesNoPick value={d.animalCorpseProblem} onChange={(v) => onChange('s6.disposal.animalCorpseProblem', v)} />
          </Field>
        </div>
      </SubSection>

      <SectorTriad path="s6" sector="Health" value={s6} onChange={onChange} />
    </div>
  );
}

/* ================================================================== *
 * Page 6 — WASH
 * ================================================================== */
export function F2Wash({ inc, onChange, removeRow }) {
  const s7 = inc.s7 || {};
  const pctSum = (num(s7.sufficientPct) || 0) + (num(s7.poorPct) || 0) + (num(s7.nonePct) || 0);
  const needs = s7.sanitationNeeds || [];
  const altWater = s7.altWater || [];

  const sanitationRows = SANITATION_ROWS.map((r) => ({ id: r.key, label: r.label, ...(s7[r.key] || {}) }));
  const needOp = (i, f, v) => onChange(`s7.sanitationNeeds.${i}.${f}`, v);
  const altOp = (i, f, v) => onChange(`s7.altWater.${i}.${f}`, v);

  return (
    <div>
      <SubSection title="Water supply">
        <div className="grid-2">
          <Field label="Was there water supply before the event?">
            <YesNoPick value={s7.waterBeforeYN} onChange={(v) => onChange('s7.waterBeforeYN', v)} />
          </Field>
          <Field label="Sufficient (%)">
            <div className="pct">
              <NumberInput max="100" step="1" value={s7.sufficientPct} onChange={(e) => onChange('s7.sufficientPct', e.target.value)} />
              <span className={`pct-sum ${Math.round(pctSum) !== 100 && pctSum > 0 ? 'pct-sum-bad' : ''}`}>Σ {Math.round(pctSum)}%</span>
            </div>
          </Field>
          <Field label="Poor (%)">
            <NumberInput max="100" step="1" value={s7.poorPct} onChange={(e) => onChange('s7.poorPct', e.target.value)} />
          </Field>
          <Field label="None (%)">
            <NumberInput max="100" step="1" value={s7.nonePct} onChange={(e) => onChange('s7.nonePct', e.target.value)} />
          </Field>
          <Field label="Estimated dwellings / shelters with water (%)">
            <NumberInput
              max="100"
              step="1"
              value={s7.dwellingsWithWaterPct}
              onChange={(e) => onChange('s7.dwellingsWithWaterPct', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Observations">
          <TextArea rows={2} value={s7.waterObservations} onChange={(e) => onChange('s7.waterObservations', e.target.value)} />
        </Field>
      </SubSection>

      <SubSection title="Alternative sources of water supply">
        <div className="grid-2">
          <Field label="Surface source">
            <YesNoPick value={s7.altSurfaceYN} onChange={(v) => onChange('s7.altSurfaceYN', v)} />
          </Field>
          <Field label="Subterranean source">
            <YesNoPick value={s7.altSubterraneanYN} onChange={(v) => onChange('s7.altSubterraneanYN', v)} />
          </Field>
        </div>
        <MatrixRows
          rows={altWater}
          labelKey="label"
          labelHead="Water source"
          minWidth={640}
          columns={ALT_WATER_COLUMNS}
          onChange={altOp}
        />
        <Field label="Observations" >
          <TextArea rows={2} value={s7.altObservations} onChange={(e) => onChange('s7.altObservations', e.target.value)} />
        </Field>
      </SubSection>

      <SubSection title="Impact on water supply">
        <ImpactScale value={s7.impactWater} onChange={(v) => onChange('s7.impactWater', v)} />
      </SubSection>

      <SubSection title="Sanitation system" subtitle="functional? signs of contamination?">
        <MatrixRows
          rows={sanitationRows}
          labelKey="label"
          labelHead="System"
          minWidth={560}
          columns={[
            { key: 'functionalYN', label: 'Functional', type: 'yn', width: 120 },
            { key: 'observations', label: 'Observations (signs of contamination?)', type: 'area', width: 300 }
          ]}
          onChange={(i, f, v) =>
            onChange(`s7.${SANITATION_ROWS[i].key}.${f}`, v)
          }
        />
        <Field label="Latrines — no. of units damaged">
          <NumberInput value={(s7.latrines || {}).unitsDamaged} onChange={(e) => onChange('s7.latrines.unitsDamaged', e.target.value)} />
        </Field>
      </SubSection>

      <SubSection title="Main sanitation needs">
        <RepeatTable
          rows={needs}
          columns={SANITATION_NEEDS_COLUMNS}
          onChange={needOp}
          onAdd={() => onChange('s7.sanitationNeeds', [...needs, blankNeedsRow()])}
          onRemove={(i) => removeRow('s7.sanitationNeeds', needs, i, 'sanitation need')}
          addLabel="+ Add sanitation need"
        />
      </SubSection>

      <SubSection title="Impact on sanitation">
        <ImpactScale value={s7.impactSanitation} onChange={(v) => onChange('s7.impactSanitation', v)} />
      </SubSection>

      <SubSection title="Early recovery & observations" subtitle="WASH">
        <Field label="Early Recovery Issues">
          <TextArea rows={2} value={s7.earlyRecoveryIssues} onChange={(e) => onChange('s7.earlyRecoveryIssues', e.target.value)} />
        </Field>
        <Field label="Observations / Recommendations">
          <TextArea rows={3} value={s7.observations} onChange={(e) => onChange('s7.observations', e.target.value)} />
        </Field>
      </SubSection>
    </div>
  );
}

/* ================================================================== *
 * Page 7 — Food and Nutrition
 * ================================================================== */
export function F2Food({ inc, onChange, removeRow }) {
  const s8 = inc.s8 || {};
  const prep = s8.prepare || {};
  const res = s8.reserves || {};
  const sources = s8.sources || [];
  const interventions = s8.interventions || [];
  const foodNeeds = s8.foodNeeds || [];

  return (
    <div>
      <SubSection title="Main source of food for displaced families">
        <MatrixRows
          rows={sources}
          labelKey="label"
          labelHead="Source"
          minWidth={600}
          columns={[
            { key: 'before', label: 'Before the disaster', type: 'yn', width: 160 },
            { key: 'after', label: 'After the disaster', type: 'yn', width: 155 },
            { key: 'observations', label: 'Observations', type: 'area', width: 240 }
          ]}
          onChange={(i, f, v) => onChange(`s8.sources.${i}.${f}`, v)}
        />
        <p className="sum-note">Tick the sources that displaced families actually used, before and after the event.</p>
      </SubSection>

      <SubSection title="Means for affected families to prepare food">
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Item</th>
                <th style={{ width: '22%' }}>Yes / No</th>
                <th>Observations</th>
              </tr>
            </thead>
            <tbody>
              {PREPARE_ITEMS.map((it) => (
                <tr key={it.key}>
                  <td className="rowlabel">{it.label}</td>
                  <td>
                    <YesNoPick value={prep[it.yn]} onChange={(v) => onChange('s8.prepare.' + it.yn, v)} />
                  </td>
                  <td>
                    <TextArea
                      rows={1}
                      value={prep[it.obs]}
                      onChange={(e) => onChange('s8.prepare.' + it.obs, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>

      <SubSection title="Food reserves">
        <div className="grid-2">
          <Field label="Do the affected families have food?">
            <YesNoPick value={res.affectedYN} onChange={(v) => onChange('s8.reserves.affectedYN', v)} />
          </Field>
          <Field label="Do the displaced families have food?">
            <YesNoPick value={res.displacedYN} onChange={(v) => onChange('s8.reserves.displacedYN', v)} />
          </Field>
          <Field label="How long would the reserves last, if any?">
            <TextInput
              value={res.duration}
              onChange={(e) => onChange('s8.reserves.duration', e.target.value)}
              placeholder="e.g. 3 days"
            />
          </Field>
          <Field label="Can affected families access / buy food?">
            <YesNoPick value={res.capacityYN} onChange={(v) => onChange('s8.reserves.capacityYN', v)} />
          </Field>
        </div>
        <Field label="Observations">
          <TextArea rows={2} value={res.observations} onChange={(e) => onChange('s8.reserves.observations', e.target.value)} />
        </Field>
      </SubSection>

      <SubSection title="Food interventions">
        <RepeatTable
          rows={interventions}
          columns={INTERVENTION_COLUMNS}
          onChange={(i, f, v) => onChange(`s8.interventions.${i}.${f}`, v)}
          onAdd={() => onChange('s8.interventions', [...interventions, blankIntervention()])}
          onRemove={(i) => removeRow('s8.interventions', interventions, i, 'food intervention')}
          addLabel="+ Add intervention"
        />
      </SubSection>

      <SubSection title="Main needs in food and nutrition">
        <RepeatTable
          rows={foodNeeds}
          columns={FOOD_NEEDS_COLUMNS}
          onChange={(i, f, v) => onChange(`s8.foodNeeds.${i}.${f}`, v)}
          onAdd={() => onChange('s8.foodNeeds', [...foodNeeds, blankFoodNeed()])}
          onRemove={(i) => removeRow('s8.foodNeeds', foodNeeds, i, 'food need')}
          addLabel="+ Add food / nutrition need"
        />
      </SubSection>

      <SectorTriad path="s8" sector="Food and Nutrition" value={s8} onChange={onChange} />
    </div>
  );
}

/* ================================================================== *
 * Page 8 — Shelter and Livelihood
 * ================================================================== */
export function F2ShelterLivelihood({ inc, onChange, removeRow }) {
  const s9 = inc.s9 || {};
  const s10 = inc.s10 || {};
  const shelterNeeds = s9.shelterNeeds || [];
  const liveNeeds = s10.livelihoodNeeds || [];

  return (
    <div>
      <SubSection title="Shelter damage and hosting">
        <div className="grid-2">
          <Field label="Totally damaged shelters">
            <NumberInput value={s9.totallyDamaged} onChange={(e) => onChange('s9.totallyDamaged', e.target.value)} />
          </Field>
          <Field label="Partially damaged shelters">
            <NumberInput value={s9.partiallyDamaged} onChange={(e) => onChange('s9.partiallyDamaged', e.target.value)} />
          </Field>
          <Field label="Families in evacuation centers w/ destroyed shelters">
            <NumberInput
              value={s9.familiesEvacDestroyed}
              onChange={(e) => onChange('s9.familiesEvacDestroyed', e.target.value)}
            />
          </Field>
          <Field label="Families staying with host families">
            <NumberInput value={s9.familiesWithHosts} onChange={(e) => onChange('s9.familiesWithHosts', e.target.value)} />
          </Field>
        </div>
      </SubSection>

      <SubSection title="Main needs in shelters">
        <RepeatTable
          rows={shelterNeeds}
          columns={SHELTER_NEEDS_COLUMNS}
          onChange={(i, f, v) => onChange(`s9.shelterNeeds.${i}.${f}`, v)}
          onAdd={() => onChange('s9.shelterNeeds', [...shelterNeeds, blankNeedsRow()])}
          onRemove={(i) => removeRow('s9.shelterNeeds', shelterNeeds, i, 'shelter need')}
          addLabel="+ Add shelter need"
        />
      </SubSection>

      <SectorTriad path="s9" sector="Shelter" value={s9} onChange={onChange} />

      <SubSection title="Impact on livelihood sectors">
        <MatrixRows
          rows={s10.sectors || []}
          labelKey="label"
          labelHead="Activity / Sector"
          minWidth={620}
          columns={LIVELIHOOD_SECTOR_COLUMNS}
          onChange={(i, f, v) => onChange(`s10.sectors.${i}.${f}`, v)}
        />
      </SubSection>

      <SubSection title="Main needs in livelihood">
        <RepeatTable
          rows={liveNeeds}
          columns={LIVELIHOOD_NEEDS_COLUMNS}
          onChange={(i, f, v) => onChange(`s10.livelihoodNeeds.${i}.${f}`, v)}
          onAdd={() => onChange('s10.livelihoodNeeds', [...liveNeeds, blankNeedsRow()])}
          onRemove={(i) => removeRow('s10.livelihoodNeeds', liveNeeds, i, 'livelihood need')}
          addLabel="+ Add livelihood need"
        />
      </SubSection>

      <SectorTriad path="s10" sector="Livelihood" value={s10} onChange={onChange} />
    </div>
  );
}

/* ================================================================== *
 * Page 9 — Protection and Education
 * ================================================================== */
export function F2ProtectionEducation({ inc, onChange, removeRow }) {
  const s11 = inc.s11 || {};
  const s12 = inc.s12 || {};
  const protNeeds = s11.protectionNeeds || [];
  const eduNeeds = s12.educationNeeds || [];

  return (
    <div>
      <SubSection title="Situation of children">
        <MatrixRows
          rows={s11.children || []}
          labelKey="label"
          labelHead="Category"
          minWidth={520}
          columns={[
            { key: 'total', label: 'Total Number', type: 'num', width: 130 },
            { key: 'boys', label: 'Boys', type: 'num', width: 110 },
            { key: 'girls', label: 'Girls', type: 'num', width: 110 }
          ]}
          onChange={(i, f, v) => onChange(`s11.children.${i}.${f}`, v)}
        />
      </SubSection>

      <SubSection title="Protection concerns and services">
        <div className="grid-2">
          <Field label="Instances / registration / monitoring of mistreatment, rape or sexual abuse?">
            <YesNoPick
              value={s11.mistreatmentAbuseYN}
              onChange={(v) => onChange('s11.mistreatmentAbuseYN', v)}
            />
          </Field>
          <Field label="Organisations working in psychosocial support?">
            <YesNoPick
              value={s11.psychosocialOrgsYN}
              onChange={(v) => onChange('s11.psychosocialOrgsYN', v)}
            />
          </Field>
          <Field label="Organisations working for the protection of rights?">
            <YesNoPick value={s11.rightsOrgsYN} onChange={(v) => onChange('s11.rightsOrgsYN', v)} />
          </Field>
        </div>
        <Field label="Barriers" hint="Main barriers to fulfilling basic protection principles and actions">
          <TextArea rows={2} value={s11.barriers} onChange={(e) => onChange('s11.barriers', e.target.value)} />
        </Field>
      </SubSection>

      <SubSection title="Main needs in protection">
        <RepeatTable
          rows={protNeeds}
          columns={PROTECTION_NEEDS_COLUMNS}
          onChange={(i, f, v) => onChange(`s11.protectionNeeds.${i}.${f}`, v)}
          onAdd={() => onChange('s11.protectionNeeds', [...protNeeds, blankNeedsRow()])}
          onRemove={(i) => removeRow('s11.protectionNeeds', protNeeds, i, 'protection need')}
          addLabel="+ Add protection need"
        />
      </SubSection>

      <SectorTriad path="s11" sector="Protection" value={s11} onChange={onChange} />

      <SubSection title="Impact on schools">
        <MatrixRows
          rows={s12.schools || []}
          labelKey="label"
          labelHead="Item"
          minWidth={560}
          columns={[
            { key: 'totalExisting', label: 'Total Existing', type: 'num', width: 130 },
            { key: 'partiallyDamaged', label: 'Partially Damaged', type: 'num', width: 145 },
            { key: 'totallyDamaged', label: 'Totally Damaged', type: 'num', width: 140 }
          ]}
          onChange={(i, f, v) => onChange(`s12.schools.${i}.${f}`, v)}
        />
        <p className="sum-note">
          “Furnishings Affected” and “Materials Affected” are estimated percentages — enter 0–100 on those rows.
        </p>
      </SubSection>

      <SubSection title="Main needs in education">
        <RepeatTable
          rows={eduNeeds}
          columns={EDUCATION_NEEDS_COLUMNS}
          onChange={(i, f, v) => onChange(`s12.educationNeeds.${i}.${f}`, v)}
          onAdd={() => onChange('s12.educationNeeds', [...eduNeeds, blankNeedsRow()])}
          onRemove={(i) => removeRow('s12.educationNeeds', eduNeeds, i, 'education need')}
          addLabel="+ Add education need"
        />
      </SubSection>

      <SectorTriad path="s12" sector="Education" value={s12} onChange={onChange} />
    </div>
  );
}

/* ================================================================== *
 * Page 10 — Organization and Coordination
 * ================================================================== */
export function F2Coordination({ inc, onChange }) {
  const s13 = inc.s13 || {};
  const grid = s13.grid || {};
  const info = s13.infoFlow || [];

  return (
    <div>
      <SubSection
        title="Cluster activation by administrative level"
        subtitle="who is present at each level"
      >
        <div className="table-wrap">
          <table className="grid coord-grid">
            <thead>
              <tr>
                <th className="rowlabel">Cluster</th>
                {COORD_LEVELS.map((l) => (
                  <th key={l.key}>{l.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COORD_CLUSTERS.map((c) => (
                <tr key={c.key}>
                  <th className="rowlabel">{c.label}</th>
                  {COORD_LEVELS.map((l) => (
                    <td key={l.key}>
                      <TextInput
                        value={(grid[c.key] || {})[l.key] || ''}
                        onChange={(e) => onChange(`s13.grid.${c.key}.${l.key}`, e.target.value)}
                        placeholder="—"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sum-note">
          Leave a cell blank if that cluster is not activated at that level. Names can be short (“DSWD”, “RHU”,
          “NGO”).
        </p>
      </SubSection>

      <SubSection title="Information flow" subtitle="is it existing?">
        <MatrixRows
          rows={info}
          labelKey="label"
          labelHead="Body"
          minWidth={380}
          columns={[{ key: 'existsYN', label: 'Existing?', type: 'yn', width: 140 }]}
          onChange={(i, f, v) => onChange(`s13.infoFlow.${i}.${f}`, v)}
        />
      </SubSection>

      <SubSection title="Main needs in coordination">
        <Field label="Main Needs in Coordination">
          <TextArea rows={3} value={s13.mainNeeds} onChange={(e) => onChange('s13.mainNeeds', e.target.value)} />
        </Field>
      </SubSection>

      <SectorTriad path="s13" sector="Coordination" value={s13} onChange={onChange} />
    </div>
  );
}