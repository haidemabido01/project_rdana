import { toneChip } from './tones';

/* ------------------------------------------------------------------ *
 * Agency metric cards.
 *
 * Every card uses the same white surface as the rest of the system,
 * with a semantic icon chip and the figure in navy.
 * ------------------------------------------------------------------ */
export function AgencyMetricCard({ label, value, icon: Icon, tone = 'brand' }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase leading-tight tracking-wider text-gray-500">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneChip(tone)}`}
        >
          {Icon ? <Icon size={17} strokeWidth={2.1} /> : null}
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold leading-none tracking-tight tabular-nums text-navy-900">
        {value}
      </p>
    </div>
  );
}

/**
 * The metric grid: 2 x 2 on phones, one row of four from the medium
 * breakpoint up — the same rhythm as the MDRRMO overview.
 */
export function AgencyMetricGrid({ metrics = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {metrics.map((metric) => (
        <AgencyMetricCard key={metric.id} {...metric} />
      ))}
    </div>
  );
}
