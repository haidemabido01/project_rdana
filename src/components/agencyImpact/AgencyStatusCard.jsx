/* ------------------------------------------------------------------ *
 * Reporting status card.
 *
 * Submitted / assigned on the left, the state badge on the right, and
 * the progress track underneath — all on the system's white surface.
 * ------------------------------------------------------------------ */
export default function AgencyStatusCard({
  title = 'Reporting Status',
  subtitle = 'Assigned reporting progress',
  submitted = 0,
  total = 0,
  status = 'In progress',
  note = 'One assigned assessment awaiting completion'
}) {
  const pct = total > 0 ? (submitted / total) * 100 : 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-navy-900 sm:text-lg">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--warning-bg)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--warning-txt)]">
          {status}
        </span>
      </div>

      <p className="mt-5 text-4xl font-extrabold leading-none tracking-tight tabular-nums text-navy-900">
        {submitted} of {total}
      </p>

      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={submitted}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Assigned reporting progress"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-gray-500 lg:mt-auto lg:pt-6">{note}</p>
    </section>
  );
}
