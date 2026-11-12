import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Gauge,
  HelpCircle,
  Info,
  MapPin,
  Send,
  ShieldCheck,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { buildAgencyView } from '../lib/agencyViews';
import { formatPesoShort } from '../lib/damage';

export default function AgencyOverview() {
  const { role } = useRole();
  const notify = useToast();
  const {
    refresh,
    lastRefreshed,
    isRefreshing,
    loading,
    data,
    service,
    incidents,
    options,
    incidentOptions,
    activeDataset
  } = useAnalyticsData({ intervalMs: 10000 });

  const handleRefresh = async () => {
    await refresh();
    notify.info('Agency overview refreshed.');
  };

  const handleAction = (msg) => {
    notify.info(msg);
  };

  const view = role.isMvp
    ? buildAgencyView(role.agencyId, { data, service, incidents, options, incidentOptions })
    : null;

  /* Clear out mainpage for MSWDO, MASSO, MEO, and MPDO — show coming soon */
  if (!role.isMvp) {
    return (
      <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
        {/* Top Breadcrumb Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Agency Workspace</span>
              <ChevronRight size={14} />
              <span className="text-brand-600 font-bold">{role.agencyCode} Portal</span>
              <ChevronRight size={14} />
              <span className="text-slate-800">Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1">
              {role.agencyName}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {role.description}
            </p>
          </div>
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
        </div>

        {/* Coming Soon Panel */}
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm sm:p-12 max-w-3xl mx-auto my-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <Clock size={28} strokeWidth={2.2} />
          </span>

          <span className="inline-flex rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            Coming Soon · Phase 2 Development
          </span>

          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
            {role.agencyName} ({role.agencyCode}) Overview Coming Soon
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
            The RDANA MVP deployment prioritizes <strong>MDRRMO, OMAG, MHO, and DepEd</strong>. The customized overview dashboard, sectoral indicators, and field tracking tools for <strong>{role.agencyCode}</strong> are currently under development and will be activated in the upcoming Phase 2 release.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-navy-900 text-xs">MVP Rollout Status:</div>
            <div className="flex items-center justify-between">
              <span>Active in MVP:</span>
              <span className="font-semibold text-emerald-700">MDRRMO, DepEd, MHO, OMAG</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Coming in Phase 2:</span>
              <span className="font-semibold text-amber-700">MSWDO, MASSO, MEO, MPDO</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return <div className="empty">Loading…</div>;
  }

  const currentMetrics = view?.metrics || [];
  const currentChart = view?.overviewChart;

  return (
    <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
      {/* Top Breadcrumb & Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Agency Workspace</span>
            <ChevronRight size={14} />
            <span className="text-brand-600 font-bold">{role.agencyCode} Portal</span>
            <ChevronRight size={14} />
            <span className="text-slate-800">Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1">
            {role.agencyName}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {role.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
          <Link
            to={`/impact/${role.agencyId}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
          >
            <Gauge size={15} className="text-brand-500" />
            <span>{role.impactLabel || `${role.agencyCode} Impact`}</span>
            <ArrowRight size={13} className="text-slate-400" />
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            <FileSpreadsheet size={15} />
            <span>Submit Sector Report</span>
          </Link>
        </div>
      </div>

      {/* Incident Context Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-navy-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-400 flex items-center justify-center flex-none mt-0.5">
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-500 text-white">
                Active Operational Period
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin size={12} className="text-brand-400" />
                Municipality of Tagbina · Surigao del Sur
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {activeDataset?.name
                ? `Active Data Set: ${activeDataset.name}`
                : (data?.totals?.assessments || 0) > 0
                ? `${data.totals.assessments} Saved Assessment${data.totals.assessments === 1 ? '' : 's'} Recorded`
                : 'No Active Disaster Data Uploaded Yet'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {(data?.totals?.assessments || 0) > 0
                ? `${data.totals.assessments} record${data.totals.assessments === 1 ? '' : 's'} across ${data.totals.barangays || 0} reporting area${data.totals.barangays === 1 ? '' : 's'} · ${formatPesoShort(data.totals.cost || 0)} total estimated damage.`
                : 'Upload a data set or submit field assessments to populate live RDANA coordination metrics.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-5 flex-none">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Representative</div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              <UserCheck size={14} className="text-brand-400" />
              <span>{role.name}</span>
            </div>
            <div className="text-[11px] text-slate-300">{role.roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Non-MVP Notice for Phase 2 agencies */}
      {!role.isMvp && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-none mt-0.5" size={18} />
          <div className="text-xs">
            <span className="font-bold">Phase 2 Development Preview: </span>
            The full dedicated analytics for {role.agencyName} are slated for Phase 2. You can preview the custom sidebar, role access, and report submission workspace today.
          </div>
        </div>
      )}

      {/* Primary Sector Impact Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            {role.agencyCode} Sector Key Indicators
          </h2>
          <span className="text-xs text-slate-400">Synced with field assessments</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentMetrics.map((m, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{m.label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === 'critical'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : m.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : m.status === 'info'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.change}
                </span>
              </div>
              <div className="text-2xl font-black text-navy-900 mt-2 tracking-tight">
                {m.value}
              </div>
              <div className="text-xs text-slate-500 mt-1 leading-snug">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Reporting Status & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sector Responsibilities & Checklist */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy-900">
                RDANA Reporting Cycle &amp; Agency Action Items
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Required deliverables for {role.agencyCode} to the Incident Management Team
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Response Phase 1
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-3">
              {(data?.totals?.assessments || 0) > 0 ? (
                <CheckCircle2 size={18} className="text-emerald-600 flex-none mt-0.5" />
              ) : (
                <Clock size={18} className="text-amber-600 flex-none mt-0.5" />
              )}
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>1. Initial 24-Hour Damage Notification</span>
                  {(data?.totals?.assessments || 0) > 0 ? (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      Active ({data.totals.assessments} records)
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                      Awaiting Data
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mt-0.5">
                  {(data?.totals?.assessments || 0) > 0
                    ? `Live records loaded from ${activeDataset?.name ? `uploaded data set (${activeDataset.name})` : 'field assessments'}.`
                    : 'Awaiting initial data set upload or field assessment submission.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-200 bg-brand-50/40 flex items-start gap-3">
              <Clock size={18} className="text-brand-600 flex-none mt-0.5" />
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>2. 72-Hour Detailed RDANA Sector Assessment (Form 2)</span>
                  <span className="text-brand-700 font-semibold bg-brand-100 px-1.5 py-0.5 rounded text-[10px]">
                    Action Required
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">
                  Consolidated sector damage values, monetary estimates, and relief requisitions must be entered in the Reports tab.
                </p>
                <div className="mt-2.5">
                  <Link
                    to="/reports"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    <span>Proceed to Sector Report Input Form</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-3">
              <HelpCircle size={18} className="text-slate-400 flex-none mt-0.5" />
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-bold text-slate-700 flex items-center justify-between">
                  <span>3. Multi-Agency Post-Disaster Needs Validation</span>
                  <span className="text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                    Upcoming
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Scheduled with Super Admin Crissalen Danao and OCD Caraga joint verification team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Sector Analytics Breakdown Graph & Contact Card */}
        <div className="space-y-4">
          {/* Sector Breakdown Graph (replaces redundant navigation card) */}
          {currentChart && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <BarChart3 size={15} className="text-brand-500" />
                    <span>Sector Impact Analytics</span>
                  </div>
                  <h3 className="text-sm font-bold text-navy-900 mt-1">
                    {currentChart.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {currentChart.subtitle}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-100 text-navy-800 flex-none">
                  {currentChart.totalLabel}
                </span>
              </div>

              {/* Segmented Distribution Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
                  {currentChart.bars.map((b, i) => (
                    <div
                      key={i}
                      style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                      className="h-full rounded-sm transition-all duration-300"
                      title={`${b.label}: ${b.countText} (${b.pct}%)`}
                    />
                  ))}
                </div>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-2.5 pt-1">
                {currentChart.bars.map((bar, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-none"
                          style={{ backgroundColor: bar.color }}
                        />
                        <span className="text-slate-700 font-medium truncate">
                          {bar.label}
                        </span>
                      </div>
                      <span className="font-bold text-navy-900 text-xs flex-none ml-2">
                        {bar.countText}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({bar.pct}%)
                        </span>
                      </span>
                    </div>
                    {/* Progress Fill */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${bar.pct}%`, backgroundColor: bar.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Note */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info size={13} className="text-slate-400 flex-none mt-0.5" />
                <span>{currentChart.note}</span>
              </div>
            </div>
          )}

          <div className="bg-navy-50/60 rounded-2xl border border-navy-100 p-4 text-xs text-navy-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-navy-900">
              <ShieldCheck size={16} className="text-brand-500" />
              <span>RDANA Command Center</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              For urgent inter-agency resource mobilization or discrepancy corrections, coordinate directly with MDRRMO Lead Crissalen Danao.
            </p>
            <div className="pt-1 text-[11px] font-semibold text-brand-700">
              Hotline: (086) 211-MDRRMO · radio: Channel 9
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
