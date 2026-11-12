/* ------------------------------------------------------------------ *
 * "Assessments" tab — the submissions behind the reporting figures.
 * ------------------------------------------------------------------ */
const STATUS_TONES = {
  Validated: 'bg-brand-50 text-brand-700',
  Submitted: 'bg-navy-100 text-navy-700',
  Pending: 'bg-gray-100 text-gray-500'
};

export default function AssessmentsPanel({ rows = [] }) {
  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-navy-900">No assessments yet.</p>
        <p className="mt-1 text-xs text-gray-500">
          Submissions filed by the assigned agencies appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <ul className="divide-y divide-gray-100">
        {rows.map((row) => (
          <li key={row.id} className="p-4 transition-colors duration-150 hover:bg-brand-50/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy-900">{row.agency}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {row.area} · <span className="font-mono text-[11px] text-gray-400">{row.id}</span>
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  STATUS_TONES[row.status] || STATUS_TONES.Pending
                }`}
              >
                {row.status}
              </span>
            </div>
            <dl className="mt-3 mb-0 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Families
                </dt>
                <dd className="mt-0.5 ml-0 text-sm font-bold tabular-nums text-navy-900">
                  {row.families.toLocaleString()}
                </dd>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Damaged houses
                </dt>
                <dd className="mt-0.5 ml-0 text-sm font-bold tabular-nums text-navy-900">
                  {row.houses.toLocaleString()}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
