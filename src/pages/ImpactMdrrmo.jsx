import AgencyImpactView from '../components/agencyImpact/AgencyImpactView';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { buildAgencyView } from '../lib/agencyViews';

/* ------------------------------------------------------------------ *
 * OCD – MDRRMO impact view.
 *
 * Central disaster operations and multi-agency reporting portal.
 * The agency's own content is built from the saved assessments so its
 * figures match the Dashboard Overview.
 * ------------------------------------------------------------------ */
export default function ImpactMdrrmo({ view: viewProp, assessments = [], permissions = [] }) {
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
    viewProp || buildAgencyView('mdrrmo', { data, service, incidents, options, incidentOptions });

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
