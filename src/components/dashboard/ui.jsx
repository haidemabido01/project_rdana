/* ------------------------------------------------------------------ *
 * Dashboard primitives.
 *
 * The layout follows the ARDANA intelligence template; the colours are
 * the main app's orange + navy + white system so the dashboard belongs
 * to the RDANA product rather than sitting beside it.
 * ------------------------------------------------------------------ */

/** Card surface: white panel, hairline border, generous radius. */
export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-navy-900 md:text-lg">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-gray-500 md:text-sm">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/* Accent palette for the tiles, matched to the app's semantic colours. */
const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600',
  navy: 'bg-navy-100 text-navy-700',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  blue: 'bg-blue-50 text-blue-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  slate: 'bg-gray-100 text-gray-600'
};

/** Headline KPI tile: icon top-right, title, large value, subtext. */
export function KpiCard({ icon: Icon, title, value, unit, subtext, accent = 'brand' }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        {Icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              ACCENTS[accent] || ACCENTS.brand
            }`}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-navy-900 md:text-[2rem]">
        {value}
        {unit && ' '}
        {unit && (
          <span className="ml-2 align-baseline text-sm font-semibold text-gray-500">{unit}</span>
        )}
      </p>
      <p className="mt-1 text-xs text-gray-500 md:text-sm">{subtext}</p>
    </div>
  );
}

/** Compact stat block used inside panels. */
export function StatBlock({ icon: Icon, title, value, subtext, accent = 'slate' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              ACCENTS[accent] || ACCENTS.slate
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-navy-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtext}</p>
    </div>
  );
}

/** Progress track. `segments` = [{ key, width: '75%', className: 'bg-green-500' }]. */
export function ProgressBar({ segments = [], className = '' }) {
  return (
    <div className={`flex h-2.5 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      {segments.map((s) => (
        <div key={s.key || s.width} className={s.className} style={{ width: s.width }} />
      ))}
    </div>
  );
}

/* Status pill tones, matched to the lifeline status values. */
const PILL_TONES = {
  green: 'bg-green-50 text-green-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  orange: 'bg-brand-50 text-brand-700',
  red: 'bg-red-50 text-red-700',
  muted: 'bg-gray-100 text-gray-500'
};

/** A status chip. An unknown or empty status renders as a muted slot. */
export function StatusPill({ label, tone = 'muted' }) {
  const text = label && label.trim() ? label.trim() : '—';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${
        PILL_TONES[tone] || PILL_TONES.muted
      }`}
    >
      {text}
    </span>
  );
}

/** Horizontal bar list. `data` = [{ key, label, value, color }]. */
export function BarList({ data = [], format = (v) => String(v), emptyLabel = 'Nothing recorded yet.' }) {
  if (!data.length) {
    return <p className="m-0 text-sm text-gray-500">{emptyLabel}</p>;
  }
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => {
        const value = Number(d.value) || 0;
        const pct = (value / max) * 100;
        return (
          <div key={d.key} className="grid grid-cols-[minmax(80px,34%)_1fr_auto] items-center gap-2">
            <span className="truncate text-xs text-gray-600" title={d.label}>
              {d.label}
            </span>
            <span className="block h-2.5 overflow-hidden rounded-full bg-gray-200">
              <span
                className="block h-full rounded-full"
                style={{ width: `${pct}%`, background: d.color || 'var(--orange-500)' }}
              />
            </span>
            <span className="text-xs font-bold text-navy-900">{format(value, d)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Select styled for the light surface. `renderOption` maps a value to
 *  its visible label, so the stored value can stay an id. */
export function FilterSelect({ options = ['[Select]'], value, onChange, label, renderOption }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={onChange}
      className="w-auto min-w-[11rem] rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition-colors hover:border-brand-300 focus:border-brand-500"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {renderOption ? renderOption(o) : o}
        </option>
      ))}
    </select>
  );
}

/** Small metadata pill used under the filter row. */
export function MetaPill({ accent = 'brand', children }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    navy: 'bg-navy-100 text-navy-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    slate: 'bg-gray-100 text-gray-600'
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[accent] || tones.slate}`}>
      {children}
    </span>
  );
}

/** Ghost button for secondary actions. */
export function GhostButton({ icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
      {children}
    </button>
  );
}

/** Solid pill button for the primary action of a panel. */
export function SolidButton({ icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />}
      {children}
    </button>
  );
}

/** Rounded pill tab navigation (the ARDANA section switcher).
 *  The negative margin lets the strip bleed to the screen edge on
 *  phones — it matches the app's 14px gutter exactly so nothing
 *  overflows sideways. */
export function TabStrip({ tabs, active, onSelect }) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="-mx-[14px] overflow-x-auto px-[14px] md:mx-0 md:px-0"
    >
      <div className="flex w-max min-w-max gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelect(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
