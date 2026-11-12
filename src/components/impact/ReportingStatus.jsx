import { PLACEHOLDER_REPORTING } from './placeholders';
import { IMPACT_COLORS, IMPACT_TINTS } from './palette';

/* ------------------------------------------------------------------ *
 * F — Reporting status card.
 *
 * Shows how many agency submissions are in, the state badge and the
 * progress track.
 * ------------------------------------------------------------------ */
export default function ReportingStatus({ reporting = PLACEHOLDER_REPORTING }) {
  const pct = reporting.total > 0 ? (reporting.submitted / reporting.total) * 100 : 0;

  return (
    <section className="h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-navy-900">Reporting Status</h2>
          <p className="mt-0.5 text-xs text-gray-500">Agency submission rate</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: IMPACT_TINTS.orange, color: '#C2410C' }}
        >
          {reporting.status}
        </span>
      </div>

      <p className="mt-4 text-[1.75rem] font-extrabold leading-none tracking-tight tabular-nums text-navy-900">
        {reporting.submitted} of {reporting.total}
      </p>

      {/* Progress track */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={reporting.submitted}
        aria-valuemin={0}
        aria-valuemax={reporting.total}
        aria-label="Agency submission rate"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: IMPACT_COLORS.blue }}
        />
      </div>

      <p className="mt-2.5 text-xs text-gray-500">{reporting.note}</p>
    </section>
  );
}
