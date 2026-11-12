import { Check, X } from 'lucide-react';

const STATUS_TONES = {
  Validated: 'bg-brand-50 text-brand-700',
  Submitted: 'bg-navy-100 text-navy-700',
  Pending: 'bg-gray-100 text-gray-500'
};

/* ------------------------------------------------------------------ *
 * Panels for the "Assessments" and "Permissions" tabs.
 *
 * Both are list-driven: hand them rows and they render, leave them
 * empty and they show a single empty-state line.
 * ------------------------------------------------------------------ */

export function AgencyAssessmentsPanel({ rows = [] }) {
  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-navy-900">No assessments to display.</p>
        <p className="mt-1 text-xs text-gray-500">Submissions filed by this agency appear here.</p>
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
                <p className="text-sm font-bold text-navy-900">{row.area}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {row.sector} · <span className="font-mono text-[11px] text-gray-400">{row.id}</span>
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
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {row.metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-gray-50 px-3 py-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {m.label}
                  </dt>
                  <dd className="mt-0.5 ml-0 text-sm font-bold tabular-nums text-navy-900">{m.value}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AgencyPermissionsPanel({ rows = [] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold tracking-tight text-navy-900 sm:text-lg">Agency Permissions</h2>
      <p className="mt-1 text-sm text-gray-500">Actions granted to the assigned office.</p>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
          No permissions to display.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-gray-700">{row.label}</span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  row.granted ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'
                }`}
                aria-label={row.granted ? 'Granted' : 'Not granted'}
              >
                {row.granted ? (
                  <Check size={14} strokeWidth={2.6} />
                ) : (
                  <X size={14} strokeWidth={2.6} />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
