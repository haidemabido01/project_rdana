import { useState } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import RefreshButton from '../RefreshButton';
import { useToast } from '../Toast';
import AgencyChart from './AgencyChart';
import AgencyFilters from './AgencyFilters';
import AgencyHeader from './AgencyHeader';
import { AgencyMetricGrid } from './AgencyMetricCard';
import { AgencyAssessmentsPanel, AgencyPermissionsPanel } from './AgencyPanels';
import AgencyStatusCard from './AgencyStatusCard';
import AgencyTabs from './AgencyTabs';

/* ------------------------------------------------------------------ *
 * The shared agency impact screen.
 *
 * One light layout, one config per agency, drawn with the same white
 * cards, navy text and orange primary controls as the rest of RDANA.
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  agency header                                          │
 *   │  filters · tabs                                         │
 *   │  metrics (2 x 2 → 4 across)                             │
 *   │  chart (2/3)                      ·  status (1/3)       │
 *   └────────────────────────────────────────────────────────┘
 *
 * `view` carries everything that changes between agencies:
 *   { tone, header, filters, tabs, metrics, chart, reporting }
 * ------------------------------------------------------------------ */
export default function AgencyImpactView({
  view,
  assessments = [],
  permissions = [],
  showRefresh = true,
  onRefresh,
  lastRefreshed: lastRefreshedProp,
  isRefreshing: isRefreshingProp
}) {
  const notify = useToast();
  const [tab, setTab] = useState(view.tabs[0]?.key ?? 'overview');
  const [incidentId, setIncidentId] = useState(view.filters.incidents[0]?.id ?? '');
  const [areaId, setAreaId] = useState(view.filters.areas[0]?.id ?? '');
  const [tick, setTick] = useState(0);
  const {
    refresh: internalRefresh,
    lastRefreshed: internalLastRefreshed,
    isRefreshing: internalIsRefreshing
  } = useAutoRefresh(
    async ({ silent } = {}) => {
      if (silent) return false;
      setTick((t) => t + 1);
      return true;
    },
    { intervalMs: 10000, enabled: showRefresh && !onRefresh }
  );

  const refresh = onRefresh || internalRefresh;
  const lastRefreshed = lastRefreshedProp || internalLastRefreshed;
  const isRefreshing = isRefreshingProp ?? internalIsRefreshing;

  const handleRefresh = async () => {
    await refresh();
    notify.info(`${view?.header?.code || 'Agency'} impact view refreshed.`);
  };

  const rows = assessments.length ? assessments : view.assessments || [];

  return (
    <div data-impact data-tailwind className="mx-auto w-full max-w-[1200px] space-y-4 sm:space-y-5">
      {showRefresh && (
        <div className="flex justify-end">
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
        </div>
      )}
      <span className="sr-only" data-tick={tick} />
      <AgencyHeader {...view.header} tone={view.tone} icon={view.header.icon} />

      <div className="space-y-4">
        <AgencyFilters
          incidents={view.filters.incidents}
          areas={view.filters.areas}
          incidentId={incidentId}
          areaId={areaId}
          onIncident={setIncidentId}
          onArea={setAreaId}
        />
        <AgencyTabs tabs={view.tabs} active={tab} onSelect={setTab} />
      </div>

      <div role="tabpanel" className="space-y-4 sm:space-y-5">
        {tab === 'overview' && (
          <>
            <AgencyMetricGrid metrics={view.metrics} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AgencyChart {...view.chart} />
              </div>
              <AgencyStatusCard {...view.reporting} />
            </div>
          </>
        )}

        {tab === 'assessments' && <AgencyAssessmentsPanel rows={rows} />}

        {tab === 'permissions' && <AgencyPermissionsPanel rows={permissions} />}
      </div>
    </div>
  );
}
