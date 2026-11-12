import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Database,
  House,
  LayoutDashboard,
  LifeBuoy
} from 'lucide-react';
import AgencyReportsTab from '../components/dashboard/AgencyReportsTab';
import DamageServicesTab from '../components/dashboard/DamageServicesTab';
import DataSetsTab from '../components/dashboard/DataSetsTab';
import OverviewTab from '../components/dashboard/OverviewTab';
import ReliefHealthTab from '../components/dashboard/ReliefHealthTab';
import { TabStrip } from '../components/dashboard/ui';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { useRole } from '../context/RoleContext';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { useOnline } from '../hooks/useOnline';
import {
  applyFilters,
  buildAnalytics,
  incidentPlace
} from '../lib/analytics';
import { notifyDataChanged } from '../lib/refresh';
import { buildServiceAnalytics } from '../lib/services';

/* The four sections of the intelligence dashboard. */
const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'damage-services', label: 'Damage & Services', icon: House },
  { key: 'relief-health', label: 'Relief & Health', icon: LifeBuoy },
  { key: 'agency-reports', label: 'Agency Reports', icon: ClipboardList }
];

/* Super Admin only — reads whatever CSV/Excel file was uploaded. */
const DATA_SETS_TAB = { key: 'data-sets', label: 'Data Sets', icon: Database };

const EMPTY_FILTERS = { formType: 'all', municipality: 'all', hazard: 'all', incident: 'all', area: 'all' };

export default function Dashboard() {
  const online = useOnline();
  const { isSuperAdmin } = useRole();
  const notify = useToast();
  const [searchParams] = useSearchParams();
  const [overviewSource, setOverviewSource] = useState('combined');
  const [sourcePicked, setSourcePicked] = useState(false);
  const [tab, setTab] = useState(() => {
    const wanted = searchParams.get('tab');
    const known = [...TABS, DATA_SETS_TAB].some((t) => t.key === wanted);
    return known ? wanted : 'overview';
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const firstVersion = useRef(true);

  const {
    datasets,
    activeDataset,
    activeIncidents,
    savedIncidents,
    resolvedSource,
    options,
    incidentOptions,
    loading,
    dataVersion,
    refresh,
    lastRefreshed,
    isRefreshing
  } = useAnalyticsData({
    source: sourcePicked ? overviewSource : 'combined',
    datasetId: searchParams.get('dataset'),
    intervalMs: 3000
  });

  useEffect(() => {
    if (firstVersion.current) {
      firstVersion.current = false;
      return;
    }
    setFilters(EMPTY_FILTERS);
  }, [dataVersion]);

  const handleRefresh = async () => {
    await refresh();
    /* Also wakes tab-level readers (e.g. Data Sets tab) so one button
       refreshes everything on the page. */
    notifyDataChanged();
    notify.info('Disaster situation overview refreshed.');
  };

  const hazardFiltered = useMemo(
    () =>
      applyFilters(activeIncidents, {
        formType: filters.formType,
        municipality: filters.municipality,
        hazard: filters.hazard
      }),
    [activeIncidents, filters.formType, filters.municipality, filters.hazard]
  );

  /* Incident and area are dashboard-level pickers on top of the shared
     filters, so they are applied after the standard ones. */
  const filtered = useMemo(() => {
    return hazardFiltered.filter((inc) => {
      if (filters.incident !== 'all' && inc.id !== filters.incident) return false;
      const brgy = incidentPlace(inc).barangay || '';
      if (filters.area !== 'all' && brgy !== filters.area) return false;
      return true;
    });
  }, [hazardFiltered, filters.incident, filters.area]);

  const data = useMemo(() => buildAnalytics(filtered), [filtered]);
  /* Ranking follows the same selection as the KPI cards, so picking one
     building/assessment leaves only that record's reporting area. */
  const rankingData = useMemo(() => buildAnalytics(filtered), [filtered]);
  const service = useMemo(() => buildServiceAnalytics(filtered), [filtered]);

  const onFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const onReset = () => setFilters(EMPTY_FILTERS);

  if (loading) {
    return <div className="empty">Loading…</div>;
  }

  return (
    <div data-tailwind className="space-y-6">
      {/* Page header — stacks on mobile, splits on desktop. */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl">
            Disaster Situation Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {resolvedSource === 'combined' && datasets.length > 0
              ? `Consolidated RDANA monitoring and analytics — saved assessments and ${
                  datasets.length
                } uploaded data set${datasets.length === 1 ? '' : 's'} combined live, latest first.`
              : resolvedSource === 'dataset' && activeDataset
              ? `Consolidated RDANA monitoring and analytics — driven by uploaded data set (${activeDataset.name}).`
              : 'Consolidated RDANA monitoring and analytics — updated live from saved Form 1 and Form 2 assessments, latest first.'}
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:flex-none md:flex-nowrap">
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
          {isSuperAdmin && datasets.length > 0 && (
            <select
              aria-label="Overview data source"
              title={
                resolvedSource === 'dataset'
                  ? 'Uploaded data set'
                  : resolvedSource === 'assessments'
                  ? 'Assessments'
                  : 'Forms + uploaded data'
              }
              data-testid="overview-source"
              value={resolvedSource}
              onChange={(e) => {
                setOverviewSource(e.target.value);
                setSourcePicked(true);
              }}
              className="!w-auto min-w-0 max-w-[190px] flex-initial truncate rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition-colors hover:border-brand-300 focus:border-brand-500 sm:max-w-[230px]"
            >
              <option value="combined">Forms + uploaded data</option>
              <option value="dataset">Uploaded data set</option>
              <option value="assessments">Assessments</option>
            </select>
          )}
          <span
            className={`badge hidden flex-none lg:inline-flex ${
              online ? 'badge-success' : 'badge-warning'
            }`}
          >
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Section tabs */}
      <TabStrip
        tabs={isSuperAdmin ? [...TABS, DATA_SETS_TAB] : TABS}
        active={tab}
        onSelect={setTab}
      />

      {tab === 'data-sets' ? (
        <DataSetsTab initialDataset={searchParams.get('dataset')} />
      ) : tab === 'overview' ? (
        <OverviewTab
          data={data}
          rankingBarangays={rankingData.barangays}
          service={service}
          filters={filters}
          onFilter={onFilter}
          options={{ ...options, incidents: incidentOptions }}
          datasets={datasets}
          incidents={savedIncidents}
        />
      ) : activeIncidents.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="text-3xl">📊</div>
          <p className="mt-2 font-semibold text-navy-900">No assessments on this device yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            Create a Phase 1 assessment (Damage Register / Barangay Damage Profile) or a Phase 2
            follow-up — this dashboard updates itself automatically from both.
          </p>
        </div>
      ) : (
        <>
          {tab === 'damage-services' && <DamageServicesTab data={data} service={service} />}
          {tab === 'relief-health' && <ReliefHealthTab data={data} service={service} />}
          {tab === 'agency-reports' && <AgencyReportsTab service={service} onReset={onReset} />}
        </>
      )}
    </div>
  );
}
