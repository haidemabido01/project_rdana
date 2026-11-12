import { resolveIcon } from './icons';
import { PLACEHOLDER_METRICS } from './placeholders';
import { IMPACT_COLORS, IMPACT_TINTS } from './palette';

/* ------------------------------------------------------------------ *
 * D — One metric tile.
 *
 * The icon chip is the only blue element on the tile; the figure
 * itself stays in the product's navy so the numbers read first.
 * ------------------------------------------------------------------ */
export default function MetricCard({ metric }) {
  const Icon = resolveIcon(metric.icon);
  const value =
    metric.format === 'number' && typeof metric.value === 'number'
      ? metric.value.toLocaleString()
      : metric.value;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-h-[26px] text-[11px] font-bold uppercase leading-tight tracking-wider text-gray-500">
          {metric.label}
        </p>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: IMPACT_TINTS.blue, color: IMPACT_COLORS.blue }}
        >
          <Icon size={15} strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-3 text-[1.75rem] font-extrabold leading-none tracking-tight tabular-nums text-navy-900">
        {value}
      </p>
    </div>
  );
}

/** The metric grid: 2 columns on phones, 4 from the md breakpoint. */
export function MetricGrid({ metrics = PLACEHOLDER_METRICS }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
