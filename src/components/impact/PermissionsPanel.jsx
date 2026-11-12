import { Check, X } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * "Permissions" tab — what the signed-in agency may do.
 * ------------------------------------------------------------------ */
export default function PermissionsPanel({ rows = [] }) {
  return (
    <section className="h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold tracking-tight text-navy-900">Agency Permissions</h2>
      <p className="mt-0.5 text-xs text-gray-500">Actions granted to the selected agency.</p>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl bg-gray-50 px-3 py-6 text-center text-xs text-gray-500">
          Permission records for this agency appear here.
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
