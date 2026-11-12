import { useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { TAGBINA_BARANGAYS } from '../lib/constants';
import { uid } from '../lib/model';
import {
  Field,
  SubSection,
  TextArea,
  TextInput,
  NumberInput,
  Select,
  DatePicker
} from './ui';

const CALAMITY_TYPES = ['Typhoon', 'Earthquake', 'Flood', 'Fire', 'Landslide', 'Volcanic Eruption', 'Other'];
const INTENSITIES = ['Low', 'Moderate', 'High', 'Very High'];

/* Intensity / Magnitude choices straight from the official
   BUILDING STRUCTURE ASSESSMENT FORM — each calamity type loads its own. */
const MAGNITUDES = [
  ['Below 2.0', 'Micro Earthquake'],
  ['2.0 - 3.9', 'Minor Earthquake'],
  ['4.0 - 4.9', 'Light Earthquake'],
  ['5.0 - 5.9', 'Moderate Earthquake'],
  ['6.0 - 6.9', 'Strong Earthquake'],
  ['7.0 - 7.9', 'Major Earthquake'],
  ['8.0 and above', 'Great Earthquake']
];

const INTENSITY_SCALE = [
  ['I', 'Scarcely Perceptible'],
  ['II', 'Weak'],
  ['III', 'Weak'],
  ['IV', 'Moderately Strong'],
  ['V', 'Strong'],
  ['VI', 'Very Strong'],
  ['VII', 'Destructive'],
  ['VIII', 'Very Destructive'],
  ['IX', 'Devastating'],
  ['X', 'Completely Devastating']
];

const WIND_SIGNALS = [
  ['1', '39 to 61 km/hr', 'Tropical Depression'],
  ['2', '62 to 88 km/hr', 'Tropical Storm'],
  ['3', '89 to 117 km/hr', 'Tropical Severe Storm'],
  ['4', '118 to 184 km/hr', 'Typhoon'],
  ['5', '185 km/hr and above', 'Super Typhoon']
];

const RAINFALL_WARNINGS = [
  ['Yellow Warning', '7.5 to 15 mm/hr', 'Be alert'],
  ['Orange Warning', '15 to 30 mm/hr', 'Be prepared'],
  ['Red Warning', 'More than 30 mm/hr', 'Take Action']
];

/* The reference tables printed on the paper form. */
function RefTable({ head, rows }) {
  return (
    <table className="ref-table">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]}>
            {r.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
const BUILDING_CLASSIFICATIONS = ['Residential', 'Commercial', 'Institutional', 'Industrial', 'Agricultural', 'Mixed-Use'];
const BUILDING_TYPES = ['Concrete', 'Wood', 'Semi-Concrete', 'Steel', 'Mixed'];
const FLOORS = ['1', '2', '3', '4', '5+'];
const OCCUPANCIES = ['Residential', 'Commercial', 'Institutional', 'Industrial', 'Vacant'];
const COMPONENTS = ['Walls', 'Columns', 'Beams', 'Roof', 'Floors', 'Foundation'];
const SEVERITIES = ['Minor', 'Moderate', 'Severe', 'TOTALLY'];
const USABILITY = ['Safe / Usable', 'Restricted Use', 'Unsafe / Unusable'];
const PROVINCES = [];

export function BuildingDisaster({ inc, onChange }) {
  const d = inc.disaster || {};
  const set = (f, v) => onChange('disaster.' + f, v);

  /* Changing the calamity type discards the choices that belonged to the
     previous type so a stale magnitude can never ride along with a typhoon. */
  const pickType = (t) =>
    onChange('disaster', {
      ...d,
      calamityType: t,
      magnitude: '',
      intensity: '',
      windSignal: '',
      rainfallWarning: ''
    });

  const isQuake = d.calamityType === 'Earthquake';
  const isTyphoon = d.calamityType === 'Typhoon';
  const isFlood = d.calamityType === 'Flood';
  const hasType = Boolean(d.calamityType);

  return (
    <div>
      <SubSection title="Section 1: Disaster Information">
        <div className="grid-2">
          <Field label="Calamity Type" required>
            <div className="checks">
              {CALAMITY_TYPES.map((o) => (
                <label key={o} className="check">
                  <input type="radio" name="calamityType" checked={d.calamityType === o} onChange={() => pickType(o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Date of Calamity" required>
            <DatePicker value={d.dateOfCalamity} onChange={(v) => set('dateOfCalamity', v)} />
          </Field>

          {isQuake && (
            <>
              <Field label="Magnitude" required hint="Range recorded on the official form.">
                <Select value={d.magnitude || ''} onChange={(e) => set('magnitude', e.target.value)}>
                  <option value="">Select magnitude…</option>
                  {MAGNITUDES.map(([range, cls]) => (
                    <option key={range} value={range}>
                      {range} — {cls}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Intensity" required hint="PHIVOLCS earthquake intensity scale.">
                <Select value={d.intensity || ''} onChange={(e) => set('intensity', e.target.value)}>
                  <option value="">Select intensity…</option>
                  {INTENSITY_SCALE.map(([level, desc]) => (
                    <option key={level} value={level}>
                      {level} — {desc}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          {isTyphoon && (
            <Field label="Wind Signal / Intensity" required hint="PAGASA wind signal number.">
              <Select value={d.windSignal || ''} onChange={(e) => set('windSignal', e.target.value)}>
                <option value="">Select wind signal…</option>
                {WIND_SIGNALS.map(([n, speed, cls]) => (
                  <option key={n} value={n}>
                    Signal {n} — {cls} ({speed})
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {isFlood && (
            <Field label="Rainfall Warning / Intensity" required hint="Interpretation of the rainfall warning level.">
              <Select value={d.rainfallWarning || ''} onChange={(e) => set('rainfallWarning', e.target.value)}>
                <option value="">Select rainfall warning…</option>
                {RAINFALL_WARNINGS.map(([level]) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {!isQuake && !isTyphoon && !isFlood && hasType && (
            <Field label="Intensity / Magnitude" required>
              <div className="checks">
                {INTENSITIES.map((o) => (
                  <label key={o} className="check">
                    <input type="radio" name="intensity" checked={d.intensity === o} onChange={() => set('intensity', o)} />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            </Field>
          )}

          {!hasType && (
            <Field
              label="Intensity / Magnitude"
              required
              hint="Pick a Calamity Type first — its own choices load here."
            >
              <Select value="" disabled>
                <option value="">Select a calamity type first…</option>
              </Select>
            </Field>
          )}

          <Field label="Impact / Description" required>
            <TextArea rows={3} value={d.impactDescription} onChange={(e) => set('impactDescription', e.target.value)} placeholder="Enter details..." />
          </Field>
        </div>

        {isQuake && (
          <div className="ref-block">
            <span className="ref-caption">Earthquake magnitude reference</span>
            <RefTable head={['Magnitude', 'Classification']} rows={MAGNITUDES} />
            <span className="ref-caption">Earthquake intensity scale</span>
            <RefTable head={['Intensity', 'Description']} rows={INTENSITY_SCALE} />
          </div>
        )}

        {isTyphoon && (
          <div className="ref-block">
            <span className="ref-caption">Wind signal reference</span>
            <RefTable head={['Wind Signal #', 'Speed (km/hr)', 'Classification']} rows={WIND_SIGNALS} />
          </div>
        )}

        {isFlood && (
          <div className="ref-block">
            <span className="ref-caption">Rainfall warning reference</span>
            <RefTable head={['Rainfall Warning', 'Millimeters per hour (mm/hr)', 'Description']} rows={RAINFALL_WARNINGS} />
          </div>
        )}
      </SubSection>
    </div>
  );
}

export function BuildingClassification({ inc, onChange }) {
  const c = inc.classification || {};
  const set = (f, v) => onChange('classification.' + f, v);
  return (
    <div>
      <SubSection title="Section 2: Building Classification">
        <div className="grid-2">
          <Field label="Building Classification" required>
            <div className="checks">
              {BUILDING_CLASSIFICATIONS.map((o) => (
                <label key={o} className="check">
                  <input type="radio" name="buildingClassification" checked={c.buildingClassification === o} onChange={() => set('buildingClassification', o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Building Type">
            <div className="checks">
              {BUILDING_TYPES.map((o) => (
                <label key={o} className="check">
                  <input type="radio" name="classificationBuildingType" checked={c.buildingType === o} onChange={() => set('buildingType', o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </SubSection>
    </div>
  );
}

export function BuildingInfo({ inc, onChange }) {
  const b = inc.building || {};
  const set = (f, v) => onChange('building.' + f, v);
  return (
    <div>
      <SubSection title="Section 3: Building Information">
        <div className="grid-2">
          <Field label="Building Name" required>
            <TextInput value={b.buildingName} onChange={(e) => set('buildingName', e.target.value)} placeholder="Enter building name..." />
          </Field>
          <Field label="Province">
            <TextInput
              list="building-province-list"
              value={b.province}
              onChange={(e) => set('province', e.target.value)}
              placeholder="Select province..."
            />
            <datalist id="building-province-list">
              <option value="Surigao del Sur" />
            </datalist>
          </Field>
          <Field label="Municipality / City">
            <TextInput
              list="building-municipality-list"
              value={b.municipality}
              onChange={(e) => set('municipality', e.target.value)}
              placeholder="Select municipality / city..."
            />
            <datalist id="building-municipality-list">
              <option value="Tagbina" />
            </datalist>
          </Field>
          <Field label="Barangay">
            <TextInput
              list="building-barangay-list"
              value={b.barangay}
              onChange={(e) => set('barangay', e.target.value)}
              placeholder="Select barangay..."
            />
            <datalist id="building-barangay-list">
              {TAGBINA_BARANGAYS.map((brgy) => (
                <option key={brgy} value={brgy} />
              ))}
            </datalist>
          </Field>
          <Field label="Purok / Sitio">
            <TextInput value={b.purok} onChange={(e) => set('purok', e.target.value)} placeholder="Enter purok / sitio..." />
          </Field>
          <Field label="Number of floors">
            <div className="checks">
              {FLOORS.map((o) => (
                <label key={o} className="check">
                  <input type="radio" name="floors" checked={b.floors === o} onChange={() => set('floors', o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Building Type">
            <div className="checks">
              {BUILDING_TYPES.map((o) => (
                <label key={o} className="check">
                  <input type="radio" name="buildingInfoBuildingType" checked={b.buildingType === o} onChange={() => set('buildingType', o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Number of Occupants / Residents" required>
            <NumberInput value={b.occupants} onChange={(e) => set('occupants', e.target.value)} />
          </Field>
          <Field label="Building Occupancy">
            <div className="checks">
              {OCCUPANCIES.map((o) => (
                <label key={o} className="check">
                  <input type="radio" name="buildingOccupancy" checked={b.buildingOccupancy === o} onChange={() => set('buildingOccupancy', o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Number of Affected Individuals">
            <NumberInput value={b.affectedIndividuals} onChange={(e) => set('affectedIndividuals', e.target.value)} />
          </Field>
        </div>
      </SubSection>
    </div>
  );
}

export function BuildingStructure({ inc, onChange }) {
  const s = inc.structure || {};
  const components = Array.isArray(s.components) ? s.components : [];
  const toggle = (c) => {
    const next = components.includes(c) ? components.filter((x) => x !== c) : [...components, c];
    onChange('structure.components', next);
  };
  return (
    <div>
      <SubSection title="Section 4: Physical Structure Assessment">
        <div className="grid-2">
          <Field label="Affected Structural Components (Select all that apply)" required>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {COMPONENTS.map((c) => (
                <label key={c} className="chip chip-btn">
                  <input
                    type="checkbox"
                    checked={components.includes(c)}
                    onChange={() => toggle(c)}
                    style={{ marginRight: 6 }}
                  />
                  {c}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Other structural components">
            <TextInput value={s.otherComponent} onChange={(e) => onChange('structure.otherComponent', e.target.value)} placeholder="Specify other..." />
          </Field>
          <Field label="Observed Findings / Damage" required>
            <TextArea rows={4} value={s.findings} onChange={(e) => onChange('structure.findings', e.target.value)} placeholder="Describe the actual damage..." />
          </Field>
          <Field label="Damage Severity" required>
            <div className="checks">
              {SEVERITIES.map((o) => (
                <label key={o} className="check">
                  <input
                    type="radio"
                    name="building-severity"
                    checked={s.severity === o}
                    onChange={() => onChange('structure.severity', o)}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </SubSection>
    </div>
  );
}

export function BuildingCondition({ inc, onChange }) {
  const co = inc.condition || {};
  const set = (f, v) => onChange('condition.' + f, v);
  return (
    <div>
      <SubSection title="Section 5: Building Conditions & Status">
        <div className="grid-2">
          <Field label="Building Usability / Safety Status" required>
            <div className="checks">
              {USABILITY.map((o) => (
                <label key={o} className="check">
                  <input type="radio" name="usabilityStatus" checked={co.usabilityStatus === o} onChange={() => set('usabilityStatus', o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Recommended Actions" required>
            <TextArea rows={3} value={co.recommendedActions} onChange={(e) => set('recommendedActions', e.target.value)} placeholder="Enter recommended actions..." />
          </Field>
        </div>
      </SubSection>
    </div>
  );
}

export function BuildingCost({ inc, onChange }) {
  const cost = inc.cost || {};
  const set = (f, v) => onChange('cost.' + f, v);
  return (
    <div>
      <SubSection title="Section 6: Estimated Damage Cost">
        <div className="grid-2">
          <Field label="Estimated Damage Cost (PHP)" required>
            <NumberInput value={cost.damageCost} onChange={(e) => set('damageCost', e.target.value)} />
          </Field>
          <Field label="Estimated Repair / Rehabilitation Cost (PHP)" required>
            <NumberInput value={cost.repairCost} onChange={(e) => set('repairCost', e.target.value)} />
          </Field>
        </div>
      </SubSection>
    </div>
  );
}

const PHOTO_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif';

function isPhotoFile(file) {
  if (!file) return false;
  if (typeof file.type === 'string' && file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(file.name || '');
}

function readPhotoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function fmtPhotoSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtPhotoWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function BuildingAssessment({ inc, onChange, notify }) {
  const a = inc.assessment || {};
  const set = (f, v) => onChange('assessment.' + f, v);
  const inputRef = useRef(null);
  const [reading, setReading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const photoItems = Array.isArray(a.photoItems) ? a.photoItems : [];

  const onPhotoFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const validFiles = files.filter(isPhotoFile);
    const invalidFiles = files.filter((f) => !isPhotoFile(f));

    if (invalidFiles.length > 0) {
      const msg = 'Only photo files (.jpg, .jpeg, .png, .webp, .gif) are allowed in this section.';
      setPhotoError(msg);
      if (notify?.error) notify.error(msg);
      if (validFiles.length === 0) {
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
    } else {
      setPhotoError('');
    }

    setReading(true);
    try {
      const nextItems = [...photoItems];
      for (const file of validFiles) {
        const dataUrl = await readPhotoAsDataUrl(file);
        const existingIdx = nextItems.findIndex((item) => item.name === file.name);
        const record = {
          id: existingIdx >= 0 ? nextItems[existingIdx].id : uid(),
          name: file.name,
          size: file.size || 0,
          type: file.type || 'image/jpeg',
          dataUrl,
          uploadedAt: new Date().toISOString()
        };
        if (existingIdx >= 0) {
          nextItems[existingIdx] = record;
        } else {
          nextItems.push(record);
        }
      }

      onChange('assessment', {
        ...a,
        photoItems: nextItems,
        photos: nextItems.map((item) => item.name).join(', ')
      });

      if (notify?.success) {
        notify.success(
          `${validFiles.length} building photo${validFiles.length === 1 ? '' : 's'} uploaded and auto-saved.`
        );
      }
    } catch (err) {
      const msg = err?.message || 'Could not read that photo file.';
      setPhotoError(msg);
      if (notify?.error) notify.error(msg);
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removePhoto = (photoId) => {
    const target = photoItems.find((item) => item.id === photoId);
    const nextItems = photoItems.filter((item) => item.id !== photoId);
    onChange('assessment', {
      ...a,
      photoItems: nextItems,
      photos: nextItems.map((item) => item.name).join(', ')
    });
    if (target && notify?.info) {
      notify.info(`Removed photo ${target.name}.`);
    }
  };

  return (
    <div>
      <SubSection title="Section 7: Assessment Details">
        <div className="grid-2">
          <Field label="Date of Assessment" required>
            <DatePicker value={a.date} onChange={(v) => set('date', v)} />
          </Field>
          <Field label="Time of Assessment">
            <TextInput value={a.time} onChange={(e) => set('time', e.target.value)} placeholder="HH:MM AM/PM" />
          </Field>
          <Field label="Name of Assessor" required>
            <TextInput value={a.assessorName} onChange={(e) => set('assessorName', e.target.value)} placeholder="Enter full name..." />
          </Field>
          <Field label="Office / Agency" required>
            <TextInput
              list="building-office-list"
              value={a.office}
              onChange={(e) => set('office', e.target.value)}
              placeholder="Enter office or agency (e.g. MEO, MDRRMO, MASSO)..."
            />
            <datalist id="building-office-list">
              <option value="MEO" />
              <option value="MDRRMO" />
              <option value="MASSO" />
              <option value="MPDO" />
              <option value="DepEd" />
              <option value="MHO" />
              <option value="OMAG" />
              <option value="MSWDO" />
            </datalist>
          </Field>
          <Field label="Designation">
            <TextInput value={a.designation} onChange={(e) => set('designation', e.target.value)} placeholder="Enter designation..." />
          </Field>
        </div>

        {/* Upload Photos of the Building — same drag & drop / click to browse design as Data Sets */}
        <div data-tailwind data-shell="ardana" className="mt-5 space-y-4 font-sans">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
            <h3 className="text-base font-bold text-navy-900 md:text-lg">
              Upload Photos of the Building
            </h3>
            <p className="mt-1 text-xs text-gray-500 md:text-sm">
              Accepted: <strong>.jpg</strong>, <strong>.jpeg</strong>, <strong>.png</strong>,{' '}
              <strong>.webp</strong>, <strong>.gif</strong> — only photo files can be uploaded in
              this section. Photos never leave this device.
            </p>

            <div
              data-testid="building-photo-dropzone"
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragOver
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/50'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onPhotoFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="h-7 w-7 text-brand-500" strokeWidth={2} />
              <p className="mt-3 text-sm font-semibold text-navy-900">
                {reading ? 'Reading photo(s)…' : 'Drag a photo here, or click to browse'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Photos save automatically — only image files are accepted.
              </p>
              <input
                ref={inputRef}
                data-testid="building-photo-input"
                type="file"
                accept={PHOTO_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => onPhotoFiles(e.target.files)}
              />
            </div>

            {photoError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700">
                {photoError}
              </p>
            )}

            {photoItems.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                <ImageIcon className="mx-auto h-7 w-7 text-gray-400" strokeWidth={1.6} />
                <p className="mt-2 text-sm font-semibold text-navy-900">No photos uploaded yet.</p>
                <p className="mt-1 text-xs text-gray-500">
                  Drag and drop or click above to attach building structure photos.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {photoItems.map((photo) => (
                  <li
                    key={photo.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                    data-testid="building-photo-item"
                  >
                    {photo.dataUrl ? (
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        className="h-12 w-12 shrink-0 rounded-xl border border-gray-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <ImageIcon className="h-5 w-5" strokeWidth={2} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-900">{photo.name}</p>
                      <p className="text-xs text-gray-500">
                        {fmtPhotoSize(photo.size)} · saved {fmtPhotoWhen(photo.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Delete ${photo.name}`}
                        onClick={() => removePhoto(photo.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SubSection>
    </div>
  );
}