import { DISASTER_TYPES, LIFELINE_STATUSES, DISAGG_COLUMNS, METRICS } from '../lib/constants';
import { composeSitePlace } from '../lib/format';
import { uid } from '../lib/model';
import { Field, NumberInput, Select, TextArea, TextInput } from './ui';

export function ProfileSection({ profile, onChange, onNow, onGps, gpsBusy, locationRegions }) {
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
        <Field label="Type of Disaster" required>
          <Select value={profile.disasterType || ''} onChange={set('disasterType')}>
            <option value="">Select disaster type…</option>
            {DISASTER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date and Time of Occurrence" required hint="When the disaster happened">
          <input type="datetime-local" value={profile.occurrenceTime || ''} onChange={set('occurrenceTime')} />
        </Field>
        <Field
          label="Time of RDANA Team Arrival"
          hint={
            <span>
              Team arrival
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNow('timeArrival')}>
                Use now
              </button>
            </span>
          }
        >
          <input type="datetime-local" value={profile.timeArrival || ''} onChange={set('timeArrival')} />
        </Field>
        <Field
          label="Time of RDANA Team Departure"
          hint={
            <span>
              Team departure
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNow('timeDeparture')}>
                Use now
              </button>
            </span>
          }
        >
          <input type="datetime-local" value={profile.timeDeparture || ''} onChange={set('timeDeparture')} />
        </Field>
      </div>

      <Field
        label="GPS Coordinates"
        hint={
          profile.gpsLat && profile.gpsLng
            ? `${profile.gpsLat}, ${profile.gpsLng}`
            : 'Tap "Get GPS" to capture from the device, or enter manually.'
        }
      >
        <div className="row">
          <NumberInput
            value={profile.gpsLat || ''}
            onChange={set('gpsLat')}
            placeholder="Latitude"
            style={{ flex: 1, minWidth: 120 }}
          />
          <NumberInput
            value={profile.gpsLng || ''}
            onChange={set('gpsLng')}
            placeholder="Longitude"
            style={{ flex: 1, minWidth: 120 }}
          />
          <button type="button" className="btn btn-outline btn-sm" onClick={onGps} disabled={gpsBusy}>
            {gpsBusy ? 'Locating…' : 'Get GPS'}
          </button>
        </div>
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

export function EffectsSection({ effects, onChange }) {
  const cell = (m, c) => effects[m.key][c.key] ?? '';
  const partSum = (m) =>
    DISAGG_COLUMNS.slice(1).reduce((a, c) => a + (Number(effects[m.key][c.key]) || 0), 0);
  const total = (m) => {
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
              const t = total(m);
              const s = partSum(m);
              const mismatch = t !== null && s !== t;
              return (
                <tr key={m.key}>
                  <th>{m.label}</th>
                  {DISAGG_COLUMNS.map((c) => (
                    <td key={c.key}>
                      <NumberInput
                        className={c.key === 'total' && mismatch ? 'is-mismatch' : ''}
                        value={cell(m, c)}
                        onChange={(e) => onChange(m.key, c.key, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sum-note">
        The sum of Men + Women + Children + Elderly + PWDs is compared to the Total; mismatched rows are highlighted.
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
            <Select value={ll.status || ''} onChange={(e) => onChange(i, 'status', e.target.value)}>
              <option value="">Status…</option>
              {LIFELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
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