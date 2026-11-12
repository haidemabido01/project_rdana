import { DISASTER_TYPES, LIFELINE_STATUSES, DISAGG_COLUMNS, METRICS, TAGBINA_BARANGAYS } from '../lib/constants';
import {
  BUILDING_TYPES,
  DAMAGE_LEVEL_KEYS,
  PRIORITY_COLORS,
  SEVERITY_COLORS,
  STRUCTURE_TYPES,
  formatPct,
  formatPeso,
  profileMetrics,
  registerTotals
} from '../lib/damage';
import { composeSitePlace } from '../lib/format';
import { uid } from '../lib/model';
import {
  Field,
  MilitaryDateTimeInput,
  NumberInput,
  RepeatTable,
  Select,
  TextArea,
  TextInput
} from './ui';

export function ProfileSection({
  profile,
  onChange,
  onNow,
  onGps,
  gpsBusy,
  gpsError,
  gpsAccuracy,
  gpsWeak,
  locationRegions
}) {
  const set = (field) => (e) => onChange(field, e.target.value);
  const interviewees = profile.interviewees || [];

  const region = (locationRegions || []).find((r) => r.name === profile.region);
  const province = region?.provinces.find((x) => x.name === profile.province);
  const municipality = province?.municities.find((x) => x.name === profile.municipality);

  const onRegion = (e) => {
    onChange('region', e.target.value);
    onChange('province', '');
    onChange('municipality', '');
    onChange('barangay', '');
  };

  const onProvince = (e) => {
    onChange('province', e.target.value);
    onChange('municipality', '');
    onChange('barangay', '');
  };

  const onMunicipality = (e) => {
    onChange('municipality', e.target.value);
    onChange('barangay', '');
  };

  const composed = composeSitePlace(profile);

  const sameTeamTimes =
    Boolean(profile.timeArrival) && profile.timeArrival === profile.timeDeparture;
  const sameTeamTimesError = 'Arrival and departure cannot be at the same time.';

  const updatePerson = (i, val) =>
    onChange('interviewees', interviewees.map((x, j) => (j === i ? { ...x, name: val } : x)));
  const addPerson = () => onChange('interviewees', [...interviewees, { id: uid(), name: '' }]);
  const removePerson = (i) => onChange('interviewees', interviewees.filter((_, j) => j !== i));

  return (
    <div>
      <Field label="Country" hint="Fixed to the Philippines — pick the location from dropdowns.">
        <TextInput value={profile.country || 'Philippines'} readOnly />
      </Field>

      <div className="grid-2">
        <Field
          label="Region"
          required
          hint={locationRegions ? 'From the official Philippine (PSGC) list.' : 'Loading Philippine locations…'}
        >
          <Select value={profile.region || ''} onChange={onRegion} disabled={!locationRegions}>
            <option value="">Select region…</option>
            {locationRegions
              ? locationRegions.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))
              : null}
          </Select>
        </Field>
        <Field label="Province">
          <Select value={profile.province || ''} onChange={onProvince} disabled={!region}>
            <option value="">Select province…</option>
            {region
              ? region.provinces.map((x) => (
                  <option key={x.name} value={x.name}>
                    {x.name}
                  </option>
                ))
              : null}
          </Select>
        </Field>
        <Field label="Municipality / City">
          <Select value={profile.municipality || ''} onChange={onMunicipality} disabled={!province}>
            <option value="">Select municipality / city…</option>
            {province
              ? province.municities.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))
              : null}
          </Select>
        </Field>
        <Field label="Barangay">
          <Select
            value={profile.barangay || ''}
            onChange={set('barangay')}
            disabled={!municipality || municipality.barangays.length === 0}
          >
            <option value="">Select barangay…</option>
            {municipality
              ? municipality.barangays.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))
              : null}
          </Select>
        </Field>
        <Field label="Purok / Sitio" hint="No official national list of puroks yet — type the purok or sitio here.">
          <TextInput
            value={profile.purok || ''}
            onChange={set('purok')}
            placeholder="e.g. Purok 3, Sitio Mahayahay…"
          />
        </Field>
      </div>

      {composed && (
        <p className="composed-bar">
          <b>Location:</b> {composed}
          {profile.siteLocation ? ` — ${profile.siteLocation}` : ''}
        </p>
      )}

      <div className="grid-2">
        <Field label="Specific Address / Site Detail" hint="Optional: landmark, road, building, site name…">
          <TextInput
            value={profile.siteLocation || ''}
            onChange={set('siteLocation')}
            placeholder="e.g. Near Tagbina Public Market, national road…"
          />
        </Field>
        <Field label="Type of Disaster" required hint="Select the hazard type for this incident.">
          <Select
            value={(profile.disasterTypes || [])[0] || ''}
            onChange={(e) => onChange('disasterTypes', e.target.value ? [e.target.value] : [])}
          >
            <option value="">Select disaster type…</option>
            {DISASTER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date and Time of Occurrence" required hint="When the disaster happened · 24-hour clock">
          <MilitaryDateTimeInput value={profile.occurrenceTime || ''} onChange={(v) => onChange('occurrenceTime', v)} />
        </Field>
        <Field
          label="Time of RDANA Team Arrival"
          error={sameTeamTimes ? sameTeamTimesError : undefined}
          hint={
            <span>
              Team arrival
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNow('timeArrival')}>
                Use now
              </button>
            </span>
          }
        >
          <MilitaryDateTimeInput value={profile.timeArrival || ''} onChange={(v) => onChange('timeArrival', v)} />
        </Field>
        <Field
          label="Time of RDANA Team Departure"
          error={sameTeamTimes ? sameTeamTimesError : undefined}
          hint={
            <span>
              Team departure
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNow('timeDeparture')}>
                Use now
              </button>
            </span>
          }
        >
          <MilitaryDateTimeInput value={profile.timeDeparture || ''} onChange={(v) => onChange('timeDeparture', v)} />
        </Field>
      </div>

      <Field
        label="GPS Coordinates"
        error={gpsError}
        hint={
          profile.gpsLat && profile.gpsLng
            ? `${profile.gpsLat}, ${profile.gpsLng}${gpsAccuracy != null ? ` · ±${gpsAccuracy} m` : ''}`
            : 'Tap "Get GPS" while standing at the site being assessed, or enter manually.'
        }
      >
        <div className="row">
          <NumberInput
            value={profile.gpsLat || ''}
            onChange={set('gpsLat')}
            placeholder="Latitude"
            min={-90}
            max={90}
            style={{ flex: 1, minWidth: 120 }}
          />
          <NumberInput
            value={profile.gpsLng || ''}
            onChange={set('gpsLng')}
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

      <Field label="Local Authorities / Persons Interviewed">
        <div className="repeat">
          {interviewees.map((p, i) => (
            <div key={p.id} className="repeat-item">
              <TextInput
                value={p.name || ''}
                onChange={(e) => updatePerson(i, e.target.value)}
                placeholder={`Person ${i + 1} — name / position / agency`}
              />
              {interviewees.length > 1 && (
                <button
                  type="button"
                  title="Remove person"
                  className="btn btn-ghost btn-sm remove"
                  onClick={() => removePerson(i)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={addPerson}>
            + Add person
          </button>
        </div>
      </Field>

      <Field label="Summary of Disaster / Incident">
        <TextArea
          value={profile.summary || ''}
          onChange={set('summary')}
          placeholder="Brief narrative of what happened, secondary threats, and current situation…"
          rows={5}
        />
      </Field>
    </div>
  );
}

export function EffectsSection({ effects, onChange, onSetTotalMode }) {
  const cell = (m, c) => effects[m.key][c.key] ?? '';
  const partSum = (m) =>
    DISAGG_COLUMNS.slice(1).reduce((a, c) => a + (Number(effects[m.key][c.key]) || 0), 0);
  const hasParts = (m) => DISAGG_COLUMNS.slice(1).some((c) => cell(m, c) !== '');
  const totalNum = (m) => {
    const v = Number(effects[m.key].total);
    return effects[m.key].total === '' || !Number.isFinite(v) ? null : v;
  };

  return (
    <div>
      <div className="table-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th>Category</th>
              {DISAGG_COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => {
              const row = effects[m.key];
              const manual = !!row.totalManual;
              const s = partSum(m);
              const t = totalNum(m);
              const mismatch = manual && t !== null && s !== t;
              const autoValue = hasParts(m) ? String(s) : '';
              return (
                <tr key={m.key}>
                  <th>{m.label}</th>
                  {DISAGG_COLUMNS.map((c) => (
                    <td key={c.key}>
                      {c.key === 'total' ? (
                        manual ? (
                          <div className="pct">
                            <NumberInput
                              className={mismatch ? 'is-mismatch' : ''}
                              value={cell(m, c)}
                              onChange={(e) => onChange(m.key, c.key, e.target.value)}
                            />
                            <span className={`pct-sum ${mismatch ? 'pct-sum-bad' : ''}`}>Σ {s}</span>
                            <button
                              type="button"
                              className="linkbtn"
                              title="Total back on automatic"
                              onClick={() => onSetTotalMode(m.key, false)}
                            >
                              auto
                            </button>
                          </div>
                        ) : (
                          <div className="pct">
                            <TextInput readOnly className="is-auto" value={autoValue} placeholder="0" />
                            <button
                              type="button"
                              className="linkbtn"
                              title="Type the total yourself"
                              onClick={() => onSetTotalMode(m.key, true)}
                            >
                              manual
                            </button>
                          </div>
                        )
                      ) : (
                        <NumberInput
                          value={cell(m, c)}
                          onChange={(e) => onChange(m.key, c.key, e.target.value)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sum-note">
        <b>Total is automatic</b> — it is always the sum of Men + Women + Children + Elderly + PWDs. Tap{' '}
        <span className="linkbtn">manual</span> on any row to type the total yourself; tap{' '}
        <span className="linkbtn">auto</span> to put it back on automatic. While a row is manual, a mismatch
        against the sum is flagged.
      </p>
    </div>
  );
}

export function LifelinesSection({ lifelines, onChange, onAdd, onRemove }) {
  return (
    <div className="repeat">
      {lifelines.map((ll, i) => (
        <div key={ll.id} className="repeat-item">
          <div className="row" style={{ marginBottom: 8 }}>
            {ll.custom ? (
              <TextInput
                value={ll.label || ''}
                onChange={(e) => onChange(i, 'label', e.target.value)}
                placeholder="Specify lifeline / facility…"
                style={{ flex: 1, minWidth: 160 }}
              />
            ) : (
              <b className="grow">{ll.label}</b>
            )}
            <div className="checks">
              {LIFELINE_STATUSES.map((s) => (
                <label key={s} className="check">
                  <input
                    type="radio"
                    name={`lifeline-status-${ll.id || i}`}
                    checked={ll.status === s}
                    onChange={() => onChange(i, 'status', s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
            <button type="button" title="Remove row" className="btn btn-ghost btn-sm" onClick={() => onRemove(i)}>
              ✕
            </button>
          </div>
          <TextArea
            value={ll.observation || ''}
            onChange={(e) => onChange(i, 'observation', e.target.value)}
            placeholder="Observation / extent of damage"
            rows={2}
          />
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={onAdd}>
        + Add lifeline / facility
      </button>
    </div>
  );
}

export function IssuesSection({ issues, onChange, onAdd, onRemove }) {
  return (
    <div className="repeat">
      {issues.map((row, i) => (
        <div key={row.id} className="repeat-item">
          <div className="grid-2">
            <Field label="Health Issue">
              <TextArea
                value={row.healthIssue || ''}
                onChange={(e) => onChange(i, 'healthIssue', e.target.value)}
                placeholder="e.g. injuries, disease outbreak, lack of medics…"
                rows={2}
              />
            </Field>
            <Field label="Non-Health Issue">
              <TextArea
                value={row.nonHealthIssue || ''}
                onChange={(e) => onChange(i, 'nonHealthIssue', e.target.value)}
                placeholder="e.g. blocked roads, power outage, looting…"
                rows={2}
              />
            </Field>
          </div>
          <button type="button" className="btn btn-ghost btn-sm remove" onClick={() => onRemove(i)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={onAdd}>
        + Add issue row
      </button>
    </div>
  );
}

export function ActionsSection({ actions, onChange, onAdd, onRemove }) {
  return (
    <div className="repeat">
      {actions.map((row, i) => (
        <div key={row.id} className="repeat-item">
          <div className="grid-2">
            <Field label="Response Group Involved">
              <TextInput
                value={row.groupInvolved || ''}
                onChange={(e) => onChange(i, 'groupInvolved', e.target.value)}
                placeholder="e.g. MDRRMO, BFP, PNP…"
              />
            </Field>
            <Field label="Assets Deployed">
              <TextInput
                value={row.assetsDeployed || ''}
                onChange={(e) => onChange(i, 'assetsDeployed', e.target.value)}
                placeholder="e.g. 2 rescue trucks, 1 generator…"
              />
            </Field>
            <Field label="Extent of Assistance / Actions Taken">
              <TextArea
                value={row.assistanceExtent || ''}
                onChange={(e) => onChange(i, 'assistanceExtent', e.target.value)}
                placeholder="Actions performed and coverage…"
                rows={2}
              />
            </Field>
            <Field label="No. of Families Served">
              <NumberInput
                value={row.familiesServed || ''}
                onChange={(e) => onChange(i, 'familiesServed', e.target.value)}
              />
            </Field>
          </div>
          <button type="button" className="btn btn-ghost btn-sm remove" onClick={() => onRemove(i)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={onAdd}>
        + Add response action
      </button>
    </div>
  );
}

export function NeedsSection({ needs, onChange }) {
  return (
    <div className="repeat">
      {needs.map((row, i) => (
        <div key={row.id} className="repeat-item">
          <Field label={`${i + 1}. ${row.label}`}>
            <TextArea
              value={row.priorityNeeds || ''}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder="Priority needs under this cluster…"
              rows={2}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * VII. Damage register — houses and buildings
 * ------------------------------------------------------------------ */

const BARANGAY_OPTIONS = ['', ...TAGBINA_BARANGAYS];

function barangayOptions(current) {
  const value = String(current || '').trim();
  if (value && !TAGBINA_BARANGAYS.includes(value)) {
    return ['', value, ...TAGBINA_BARANGAYS];
  }
  return BARANGAY_OPTIONS;
}

const DAMAGE_COLUMNS = [
  { key: 'barangay', label: 'Barangay', type: 'select', options: BARANGAY_OPTIONS, placeholder: 'Select barangay.' },
  { key: 'purok', label: 'Purok / Sitio', type: 'text', placeholder: 'e.g. Purok 3' },
  { key: 'buildingType', label: 'Type of Building / Facility', type: 'radio', options: BUILDING_TYPES },
  {
    key: 'buildingName',
    label: 'Building / Structure Name',
    type: 'text',
    placeholder: 'e.g. Barangay Principal Office'
  },
  { key: 'structureType', label: 'Type of Structure', type: 'radio', options: STRUCTURE_TYPES },
  { key: 'damageLevel', label: 'Damage Level / Status', type: 'radio', options: DAMAGE_LEVEL_KEYS },
  { key: 'units', label: 'No. of Units Damaged', type: 'num' },
  { key: 'estimatedCost', label: 'Estimated Damage Cost (₱)', type: 'num' },
  { key: 'remarks', label: 'Remarks / Description of Damage', type: 'area', full: true }
];

export function DamageRegisterSection({ damage, onChange, onAdd, onRemove, onChangeNotes }) {
  const rows = damage?.structures || [];
  const totals = registerTotals(rows);
  const filled = rows.filter((r) =>
    [r.buildingType, r.buildingName, r.structureType, r.damageLevel, r.units, r.estimatedCost].some(
      (v) => v !== '' && v != null
    )
  );

  return (
    <div>
      <div className="mini-stats">
        <div className="mini-stat">
          <span className="mini-stat-v">{totals.units.toLocaleString()}</span>
          <span className="mini-stat-l">Units assessed</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{totals.damagedUnits.toLocaleString()}</span>
          <span className="mini-stat-l">Units damaged</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{formatPct(totals.damagedPct, 0)}</span>
          <span className="mini-stat-l">% of units damaged</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{formatPct(totals.damageIndex, 0)}</span>
          <span className="mini-stat-l">Damage index</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{formatPeso(totals.cost)}</span>
          <span className="mini-stat-l">Estimated damage cost</span>
        </div>
      </div>

      <p className="sum-note">
        One row per damaged group of structures — e.g. “12 concrete residential houses, Moderate damage,
        Purok 3”. The damage index is the weighted loss across every unit listed.
      </p>

      <RepeatTable
        rows={rows}
        columns={DAMAGE_COLUMNS}
        onChange={onChange}
        onAdd={onAdd}
        onRemove={onRemove}
        addLabel="+ Add damaged structure row"
        cols={2}
        minRows={1}
      />

      <Field label="Overall Damage Remarks / Key Notes" hint="Free text for anything the table cannot hold.">
        <TextArea
          value={damage?.notes || ''}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="General description of the damage, access constraints, unusual patterns…"
          rows={3}
        />
      </Field>

      {filled.length > 0 && (
        <p className="sum-note">
          {filled.length} row{filled.length === 1 ? '' : 's'} with damage data. The Dashboard rolls these up
          per barangay, per structure type and per damage level.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * VIII. Barangay damage profile and priority
 * ------------------------------------------------------------------ */

function CategoryPill({ value, color, className = 'cat-pill' }) {
  if (!value) return <span className="muted">—</span>;
  return (
    <span className={`${className}`} style={{ background: color, borderColor: color }}>
      {value}
    </span>
  );
}

export function BarangayProfileSection({ damage, onChange, onAdd, onRemove }) {
  const rows = damage?.barangays || [];
  const profiles = rows.map((r) => ({ row: r, m: profileMetrics(r) }));
  const totals = profiles.reduce(
    (acc, p) => ({
      total: acc.total + p.m.total,
      damaged: acc.damaged + p.m.damaged,
      totalLoss: acc.totalLoss + p.m.totalLoss,
      cost: acc.cost + p.m.cost,
      families: acc.families + (Number(p.row.affectedFamilies) || 0)
    }),
    { total: 0, damaged: 0, totalLoss: 0, cost: 0, families: 0 }
  );
  const overallPct = totals.total > 0 ? (totals.damaged / totals.total) * 100 : 0;

  return (
    <div>
      <div className="mini-stats">
        <div className="mini-stat">
          <span className="mini-stat-v">{rows.length}</span>
          <span className="mini-stat-l">Barangays profiled</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{totals.total.toLocaleString()}</span>
          <span className="mini-stat-l">Total houses</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{totals.damaged.toLocaleString()}</span>
          <span className="mini-stat-l">Houses damaged</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{formatPct(overallPct, 0)}</span>
          <span className="mini-stat-l">Overall damage %</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-v">{formatPeso(totals.cost)}</span>
          <span className="mini-stat-l">Estimated damage cost</span>
        </div>
      </div>

      <p className="sum-note">
        Damage % is damaged houses ÷ total houses. The category is set automatically:{' '}
        <b>Low</b> under 10%, <b>Moderate</b> 10–30%, <b>High</b> above 30%. Priority is the tier used to
        rank the Dashboard — a barangay moves up when much of the damage is total loss or the repair bill
        is large.
      </p>

      <div className="table-wrap">
        <table className="grid dmg-profile">
          <thead>
            <tr>
              <th>Barangay</th>
              <th>Purok</th>
              <th>Total Houses</th>
              <th>Damaged</th>
              <th>Totally Damaged</th>
              <th>Partially Damaged</th>
              <th>Affected Families</th>
              <th>Est. Cost (₱)</th>
              <th>Damage %</th>
              <th>Category</th>
              <th>Priority</th>
              <th aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {profiles.map(({ row, m }) => (
              <tr key={row.id} className="dmg-row">
                <td>
                  <Select
                    value={row.barangay || ''}
                    onChange={(e) => onChange(row.id, 'barangay', e.target.value)}
                  >
                    {barangayOptions(row.barangay).map((b) => (
                      <option key={b || 'blank'} value={b}>
                        {b || 'Select barangay.'}
                      </option>
                    ))}
                  </Select>
                </td>
                <td>
                  <TextInput
                    value={row.purok || ''}
                    onChange={(e) => onChange(row.id, 'purok', e.target.value)}
                    placeholder="Purok"
                  />
                </td>
                <td>
                  <NumberInput
                    value={row.totalHouses ?? ''}
                    onChange={(e) => onChange(row.id, 'totalHouses', e.target.value)}
                  />
                </td>
                <td>
                  <NumberInput
                    value={row.damagedHouses ?? ''}
                    onChange={(e) => onChange(row.id, 'damagedHouses', e.target.value)}
                  />
                </td>
                <td>
                  <NumberInput
                    value={row.totallyDamaged ?? ''}
                    onChange={(e) => onChange(row.id, 'totallyDamaged', e.target.value)}
                  />
                </td>
                <td>
                  <NumberInput
                    value={row.partiallyDamaged ?? ''}
                    onChange={(e) => onChange(row.id, 'partiallyDamaged', e.target.value)}
                  />
                </td>
                <td>
                  <NumberInput
                    value={row.affectedFamilies ?? ''}
                    onChange={(e) => onChange(row.id, 'affectedFamilies', e.target.value)}
                  />
                </td>
                <td>
                  <NumberInput
                    value={row.estimatedCost ?? ''}
                    onChange={(e) => onChange(row.id, 'estimatedCost', e.target.value)}
                  />
                </td>
                <td className="dmg-num">{formatPct(m.damagePct, 0)}</td>
                <td>
                  <CategoryPill value={m.severity} color={SEVERITY_COLORS[m.severity]} />
                </td>
                <td>
                  <CategoryPill value={m.priority} color={PRIORITY_COLORS[m.priority]} />
                </td>
                <td>
                  <button
                    type="button"
                    title="Remove barangay"
                    className="btn btn-ghost btn-sm remove"
                    onClick={() => onRemove(row.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={12} className="muted" style={{ textAlign: 'center', padding: 16 }}>
                  No barangay profiles yet — add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {profiles.length > 0 && (
        <div className="repeat" style={{ marginTop: 10 }}>
          {profiles.map(({ row }) => (
            <div key={`${row.id}-notes`} className="cell">
              <span className="cell-lbl">Remarks — {row.barangay || 'barangay'}</span>
              <TextArea
                rows={2}
                value={row.remarks || ''}
                onChange={(e) => onChange(row.id, 'remarks', e.target.value)}
                placeholder="Access constraints, repair priority, occupants displaced…"
              />
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={onAdd}>
          + Add barangay profile
        </button>
      </div>
    </div>
  );
}