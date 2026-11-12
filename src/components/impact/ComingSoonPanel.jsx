import { Clock3 } from 'lucide-react';
import { useState } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import RefreshButton from '../RefreshButton';
import { useToast } from '../Toast';

/* ------------------------------------------------------------------ *
 * "Soon to be available" notice for agencies outside the MVP scope.
 *
 * The card stays selectable so the page can explain the rollout order
 * instead of showing an empty or misleading placeholder dashboard.
 * ------------------------------------------------------------------ */
export default function ComingSoonPanel({ agency, showRefresh = true }) {
  const notify = useToast();
  const name = agency?.name || agency?.code || 'This agency';
  const [tick, setTick] = useState(0);
  const { refresh, lastRefreshed, isRefreshing } = useAutoRefresh(
    async ({ silent } = {}) => {
      if (silent) return false;
      setTick((t) => t + 1);
      return true;
    },
    { intervalMs: 10000, enabled: showRefresh }
  );

  const handleRefresh = async () => {
    await refresh();
    notify.info(`${agency?.code || name} portal status refreshed.`);
  };

  return (
    <>
      {showRefresh && (
        <div className="flex justify-end mb-3">
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
        </div>
      )}
      <span className="sr-only" data-tick={tick} />
      <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm sm:p-10">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Clock3 size={22} strokeWidth={2.1} />
      </span>

      <span className="mt-4 inline-flex rounded-full bg-[var(--warning-bg)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--warning-txt)]">
        Soon to be available
      </span>

      <h2 className="mt-3 text-lg font-extrabold tracking-tight text-navy-900 sm:text-xl">
        {name} impact portal is coming soon
      </h2>

      <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
        The MVP prioritizes MDRRMO, OMAG, MHO, and DepEd. The customized assessment and
        reporting view for this agency will be available in a future update.
      </p>
    </section>
    </>
  );
}
