import AgencyImpactView from '../components/agencyImpact/AgencyImpactView';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { buildAgencyView } from '../lib/agencyViews';

export default function ImpactDeped({ view: viewProp, assessments = [], permissions = [] }) {
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
    viewProp || buildAgencyView('deped', { data, service, incidents, options, incidentOptions });

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
