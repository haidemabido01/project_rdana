import { ShieldAlert } from 'lucide-react';
import AgencyButton from './AgencyButton';
import { PLACEHOLDER_AGENCIES, PLACEHOLDER_META } from './placeholders';
import { IMPACT_COLORS } from './palette';

/* ------------------------------------------------------------------ *
 * B — Header & agency selection.
 *
 * The card carries the ARDANA identity and the agency picker (4 across
 * on phones, 8 on wide screens). The selected agency's detail card is
 * rendered below this picker by the impact page.
 * ------------------------------------------------------------------ */
export default function AgencySelector({
  meta = PLACEHOLDER_META,
  agencies = PLACEHOLDER_AGENCIES,
  activeId,
  onSelect,
  portalIds = [],
  upcomingIds = []
}) {
  const active = agencies.find((a) => a.id === activeId) || agencies[0] || null;
  if (!active) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      {/* Identity row */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm shadow-[#0066FF]/25 sm:h-11 sm:w-11"
            style={{ background: IMPACT_COLORS.blue }}
          >
            <ShieldAlert size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-tight tracking-tight text-navy-900 sm:text-xl">
              {meta.appName}
            </h1>
            <p className="mt-0.5 text-xs leading-snug text-gray-500 sm:text-sm">{meta.appSubtitle}</p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {meta.mode}
        </span>
      </header>

      {/* Agency picker — 4 x 2 on phones, one row of 8 on wide screens.
          Green dots mark functioning MVP agencies and amber dots mark
          upcoming ones; selecting a cell swaps the detail below. */}
      <div className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-8 lg:gap-3" role="group" aria-label="Select agency">
        {agencies.map((agency) => (
          <AgencyButton
            key={agency.id}
            agency={agency}
            active={agency.id === active.id}
            onSelect={onSelect}
            portal={portalIds.includes(agency.id)}
            upcoming={upcomingIds.includes(agency.id)}
          />
        ))}
      </div>

    </section>
  );
}
