import { toneChip } from './tones';

/* ------------------------------------------------------------------ *
 * Agency header.
 *
 * Identity block on the left, the assigned representative on the
 * right on wide screens, and the scope line underneath. The agency
 * tone is drawn from the system's semantic palette.
 * ------------------------------------------------------------------ */
export default function AgencyHeader({
  title,
  subtitle,
  representative,
  description,
  tone = 'brand',
  icon: Icon
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneChip(tone)}`}
          >
            {Icon ? <Icon size={21} strokeWidth={2.1} /> : null}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-navy-900 sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        <p className="shrink-0 text-sm text-gray-500 sm:pt-1">
          Assigned representative:{' '}
          <span className="font-semibold text-navy-900">{representative}</span>
        </p>
      </header>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-500">{description}</p>
    </section>
  );
}
