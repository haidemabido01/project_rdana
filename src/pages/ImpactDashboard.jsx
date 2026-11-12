import { useState } from 'react';
import AgencyHeader from '../components/agencyImpact/AgencyHeader';
import AgencyImpactView from '../components/agencyImpact/AgencyImpactView';
import RefreshButton from '../components/RefreshButton';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import AgencySelector from '../components/impact/AgencySelector';
import AssessmentsPanel from '../components/impact/AssessmentsPanel';
import ComingSoonPanel from '../components/impact/ComingSoonPanel';
import FilterBar from '../components/impact/FilterBar';
import ImpactChart from '../components/impact/ImpactChart';
import { MetricGrid } from '../components/impact/MetricCard';
import PermissionsPanel from '../components/impact/PermissionsPanel';
import ReportingStatus from '../components/impact/ReportingStatus';
import TabPills from '../components/impact/TabPills';
import {
  PLACEHOLDER_AGENCIES,
  PLACEHOLDER_AREAS,
  PLACEHOLDER_INCIDENTS,
  PLACEHOLDER_TABS
} from '../components/impact/placeholders';
import { buildAgencyPortals, MDRRMO_HEADER, MVP_AGENCY_IDS } from '../lib/agencyViews';

/* ------------------------------------------------------------------ *
 * ARDANA — Disaster Impact Dashboard (template + portals).
 *
 * A single fluid page: it fills whatever column it is given, from a
 * 360px phone to a wide desktop.
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  agency card · picker · agency detail        │
 *   ├──────────────────────────────────────────────┤
 *   │  filters (2 up)                              │
 *   │  tabs                                        │
 *   ├──────────────────────────────────────────────┤
 *   │  metrics (2 up → 4 up)                       │
 *   │  chart (2/3)          ·  status (1/3)        │
 *   └──────────────────────────────────────────────┘
 *
 * The agency picker doubles as the portal switcher: cells that have a
 * portal (MHO, OMAG, DepEd) are marked with a dot, and selecting one
 * swaps the detail area below for that agency's own impact view — the
 * page itself and the 8-cell picker stay in place. Agencies outside
 * the MVP scope show a "soon to be available" notice instead.
 *
 * Every block is prop-driven and falls back to the placeholder copy in
 * components/impact/placeholders.js. Bind your own data by passing the
 * matching props — there is no data module to edit.
 * ------------------------------------------------------------------ */
export default function ImpactDashboard({
  meta,
  agencies = PLACEHOLDER_AGENCIES,
  incidents: incidentProp = PLACEHOLDER_INCIDENTS,
  areas = PLACEHOLDER_AREAS,
  tabs = PLACEHOLDER_TABS,
  metrics,
  chart,
  reporting,
  assessments = [],
  permissions = [],
  portals: portalsOverride,
  onNotify
}) {
  const { refresh, lastRefreshed, isRefreshing, data, service, incidents, options, incidentOptions } =
    useAnalyticsData({ intervalMs: 10000 });
  const portals =
    portalsOverride || buildAgencyPortals({ data, service, incidents, options, incidentOptions });
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? '');
  const [tab, setTab] = useState(tabs[0]?.key ?? 'overview');
  const [incidentId, setIncidentId] = useState(incidentProp[0]?.id ?? '');
  const [areaId, setAreaId] = useState(areas[0]?.id ?? '');

  const handleRefresh = async () => {
    await refresh();
    if (typeof onNotify === 'function') onNotify('Agency impact refreshed.');
  };

  /* A portal is just an agency whose detail area has its own view. */
  const portal = portals[agencyId] || null;
  const activeAgency = agencies.find((a) => a.id === agencyId) || null;
  const upcoming = !MVP_AGENCY_IDS.includes(agencyId);

  const notify = (message) => {
    if (typeof onNotify === 'function') onNotify(message);
  };

  const selectAgency = (id) => {
    setAgencyId(id);
    const picked = agencies.find((a) => a.id === id);
    if (picked) {
      const name = picked.name || picked.code;
      notify(
        portals[id]
          ? `${name} dashboard loaded.`
          : !MVP_AGENCY_IDS.includes(id)
            ? `${name} portal is coming soon.`
            : `${name} selected.`
      );
    }
  };

  /* --- template view -------------------------------------------------- */
  return (
    <div data-impact data-tailwind className="mx-auto w-full max-w-[1120px] space-y-4">
      <div className="flex justify-end">
        <RefreshButton
          onRefresh={handleRefresh}
          lastRefreshed={lastRefreshed}
          isRefreshing={isRefreshing}
          label="Refresh"
        />
      </div>
      <span className="sr-only" data-tick={agencyId} />
      {/* B — agency header + picker (also the portal switcher) */}
      <AgencySelector
        meta={meta}
        agencies={agencies}
        activeId={agencyId}
        onSelect={selectAgency}
        portalIds={Object.keys(portals)}
        upcomingIds={agencies
          .filter((agency) => !MVP_AGENCY_IDS.includes(agency.id))
          .map((agency) => agency.id)}
      />

      {portal ? (
        /* Detail area for agencies with their own card set. Still the
           same page — no route change, no overlay. */
        <section key={agencyId} aria-label={`${portal.label} impact details`}>
          <AgencyImpactView view={portal.view} showRefresh={false} />
        </section>
      ) : upcoming ? (
        <ComingSoonPanel key={agencyId} agency={activeAgency} showRefresh={false} />
      ) : (
        <>
          <AgencyHeader {...MDRRMO_HEADER} />

          {/* C — filters + tabs */}
          <FilterBar
            incidents={incidentProp}
            areas={areas}
            incidentId={incidentId}
            areaId={areaId}
            onIncident={setIncidentId}
            onArea={setAreaId}
          />

          <TabPills tabs={tabs} active={tab} onSelect={setTab} />

          {/* Panels */}
          <div role="tabpanel" className="space-y-4">
            {tab === 'overview' && (
              <>
                {/* D — metrics */}
                <MetricGrid metrics={metrics} />

                {/* E + F — chart and reporting status */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ImpactChart chart={chart} />
                  </div>
                  <ReportingStatus reporting={reporting} />
                </div>
              </>
            )}

            {tab === 'assessments' && <AssessmentsPanel rows={assessments} />}

            {tab === 'permissions' && <PermissionsPanel rows={permissions} />}
          </div>
        </>
      )}
    </div>
  );
}
