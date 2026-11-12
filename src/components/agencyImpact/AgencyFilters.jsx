import { ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * The two dashboard-level pickers.
 *
 * Native <select> elements (keyboard + screen reader friendly) styled
 * like the rest of the light system, with a custom chevron.
 * ------------------------------------------------------------------ */
function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm font-semibold text-navy-900 shadow-sm transition-colors duration-150 hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </span>
    </label>
  );
}

export default function AgencyFilters({
  incidents = [],
  areas = [],
  incidentId,
  areaId,
  onIncident,
  onArea
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-3xl">
      <SelectField
        label="Disaster Incident"
        value={incidentId ?? incidents[0]?.id ?? ''}
        options={incidents}
        onChange={onIncident}
      />
      <SelectField
        label="Reporting Area"
        value={areaId ?? areas[0]?.id ?? ''}
        options={areas}
        onChange={onArea}
      />
    </div>
  );
}
