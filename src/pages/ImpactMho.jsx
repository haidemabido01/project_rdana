import AgencyImpactView from '../components/agencyImpact/AgencyImpactView';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { buildAgencyView } from '../lib/agencyViews';

/* ------------------------------------------------------------------ *
 * DOH – MHO impact view.
 *
 * The agency's figures are built from the saved assessments so they
 * match the Dashboard Overview.
 * ------------------------------------------------------------------ */
export default function ImpactMho({ view: viewProp, assessments = [], permissions = [] }) {
  const {
    loading,
    refresh,
    lastRefreshed,
    isRefreshing,
    data,
    service,
    incidents,
    options,
    incidentOptions
  } = useAnalyticsData({ intervalMs: 10000 });
  const view =
    viewProp || buildAgencyView('mho', { data, service, incidents, options, incidentOptions });

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <AgencyImpactView
      view={view}
      assessments={assessments}
      permissions={permissions}
      onRefresh={refresh}
      lastRefreshed={lastRefreshed}
      isRefreshing={isRefreshing}
    />
  );
}
