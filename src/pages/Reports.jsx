import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck,
  Send
} from 'lucide-react';
import AgencyReportWorkspace, { listStoredSectorReports } from '../components/reports/AgencyReportWorkspace';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { useRole } from '../context/RoleContext';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { recordAuditLog } from '../lib/audit';
import { formatPesoShort } from '../lib/damage';
import { ROLE_LEVELS, ROLE_LIST } from '../lib/roles';

/* Every office the Super Admin can open from the Reports hub: the
   MDRRMO admin plus the seven agency representatives. */
const REPORT_AGENCY_ROLES = ROLE_LIST.filter(
  (r) => r.level === ROLE_LEVELS.ADMIN || r.level === ROLE_LEVELS.AGENCY
);

export default function Reports() {
  const { role, isSuperAdmin, isAdmin } = useRole();
  const notify = useToast();

  /* Which agency workspace is open, if any. Only the Super Admin can
     open one; the agency representatives see their own page below. */
  const [agencyViewId, setAgencyViewId] = useState(null);
  const [reportTick, setReportTick] = useState(0);

  const {
    refresh,
    lastRefreshed,
    isRefreshing,
    data: analytics,
    activeDataset,
    incidentOptions
  } = useAnalyticsData({ intervalMs: 5000 });

  const handleRefresh = async () => {
    await refresh();
    setReportTick((t) => t + 1);
    notify.info('Agency reports refreshed.');
  };

  const agencyKey = (value) => String(value || '').toUpperCase();

  const openAgencyReports = (agencyCode) => {
    const target = REPORT_AGENCY_ROLES.find(
      (r) => agencyKey(r.agencyCode) === agencyKey(agencyCode)
    );
    if (target) {
      setAgencyViewId(target.id);
    } else {
      notify.info(`Reports for ${agencyCode} are not available yet.`);
    }
  };

  const handleAdminAction = (actionName, agencyCode) => {
    recordAuditLog({
      action: actionName,
      category: 'Reports',
      severity: 'success',
      target: agencyCode,
      details: `${actionName} executed for ${agencyCode}.`
    });
    notify.info(`${actionName} triggered for ${agencyCode}.`);
  };

  // Agency submissions derived strictly from uploaded datasets and saved sector reports
  const consolidatedSubmissions = useMemo(() => {
    const hasActiveData = (analytics?.totals?.assessments || 0) > 0;
    const datasetTimestamp = activeDataset?.uploadedAt
      ? new Date(activeDataset.uploadedAt).toLocaleString()
      : hasActiveData
      ? 'Synced from RDANA Data'
      : 'Pending Submission';

    const base = [
      {
        id: 'REP-DEPED-001',
        agency: 'DepEd',
        agencyName: 'Department of Education',
        officer: 'Dr. Elena Ramos',
        cycle: '72-Hour Rapid Assessment',
        timestamp: 'Pending Submission',
        status: 'Pending',
        metrics: 'No sector report submitted yet',
        tone: 'violet'
      },
      {
        id: 'REP-MHO-002',
        agency: 'MHO',
        agencyName: 'Municipal Health Office',
        officer: 'Dr. Grace Lim',
        cycle: '72-Hour Rapid Assessment',
        timestamp: 'Pending Submission',
        status: 'Pending',
        metrics: 'No sector report submitted yet',
        tone: 'blue'
      },
      {
        id: 'REP-OMAG-003',
        agency: 'OMAG',
        agencyName: 'Office of the Municipal Agriculturist',
        officer: 'Ramon Valderama',
        cycle: '72-Hour Rapid Assessment',
        timestamp: 'Pending Submission',
        status: 'Pending',
        metrics: 'No sector report submitted yet',
        tone: 'green'
      },
      {
        id: 'REP-MDRRMO-004',
        agency: 'MDRRMO',
        agencyName: 'MDRRMO Disaster Operations',
        officer: 'Engr. Roberto Dizon',
        cycle: '72-Hour Rapid Assessment',
        timestamp: datasetTimestamp,
        status: hasActiveData ? 'Consolidated' : 'Pending',
        metrics: hasActiveData
          ? `${analytics.totals.assessments} record${analytics.totals.assessments === 1 ? '' : 's'} Â· ${(
              analytics.totals.families || 0
            ).toLocaleString()} families Â· ${formatPesoShort(analytics.totals.cost || 0)} damage`
          : 'No sector report submitted yet',
        tone: 'brand'
      },
      {
        id: 'REP-MSWDO-005',
        agency: 'MSWDO',
        agencyName: 'Municipal Social Welfare & Development',
        officer: 'Teresa Villanueva',
        cycle: '72-Hour Rapid Assessment',
        timestamp: 'Pending Submission',
        status: 'Pending',
        metrics: 'No sector report submitted yet',
        tone: 'red'
      },
      {
        id: 'REP-MASSO-006',
        agency: 'MASSO',
        agencyName: "Municipal Assessor's Office",
        officer: 'Carlos Mendoza',
        cycle: '72-Hour Rapid Assessment',
        timestamp: 'Pending Submission',
        status: 'Pending',
        metrics: 'No sector report submitted yet',
        tone: 'slate'
      },
      {
        id: 'REP-MEO-007',
        agency: 'MEO',
        agencyName: 'Municipal Engineering Office',
        officer: 'Engr. Arthur Salazar',
        cycle: '72-Hour Rapid Assessment',
        timestamp: 'Pending Submission',
        status: 'Pending',
        metrics: 'No sector report submitted yet',
        tone: 'yellow'
      },
      {
        id: 'REP-MPDO-008',
        agency: 'MPDO',
        agencyName: 'Municipal Planning & Development',
        officer: 'Arch. Diana Cruz',
        cycle: '72-Hour Rapid Assessment',
        timestamp: 'Pending Submission',
        status: 'Pending',
        metrics: 'No sector report submitted yet',
        tone: 'navy'
      }
    ];

    const storedSector = listStoredSectorReports();
    const byStoredAgency = new Map();
    for (const sr of storedSector) {
      const code = agencyKey(sr.agencyCode);
      const list = byStoredAgency.get(code) || [];
      list.push(sr);
      byStoredAgency.set(code, list);
    }

    return base.map((row) => {
      const code = agencyKey(row.agency);
      const matchedStored = byStoredAgency.get(code) || [];

      if (matchedStored.length === 0) return row;

      const metricParts = [];
      if (row.status === 'Consolidated') {
        metricParts.push(row.metrics);
      }
      if (matchedStored.length > 0) {
        const latestSr = matchedStored[0];
        metricParts.push(
          `${latestSr.damagedUnits || 0} units Â· ${formatPesoShort(latestSr.estimatedCost || 0)} damage`
        );
      }

      const latestStored = matchedStored[0];

      return {
        ...row,
        officer: latestStored?.submittedBy || row.officer,
        status: row.status === 'Pending' ? 'Submitted' : row.status,
        timestamp: latestStored?.date || row.timestamp || 'Synced from Assessment',
        metrics: metricParts.join(' + ')
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics, activeDataset, reportTick]);

  const submittedCount = consolidatedSubmissions.filter((r) => r.status !== 'Pending').length;
  const pendingRows = consolidatedSubmissions.filter((r) => r.status === 'Pending');
  const grandTotalDamage = analytics.totals.cost;

  const submissionFor = (agencyCode) =>
    consolidatedSubmissions.find(
      (row) => agencyKey(row.agency) === agencyKey(agencyCode)
    );

  /* ------------------------------------------------------------------ */
  /* RENDER VIEW: SUPER ADMIN REVIEWING ONE AGENCY'S REPORTS            */
  /* ------------------------------------------------------------------ */
  if (isSuperAdmin && agencyViewId) {
    const selected = REPORT_AGENCY_ROLES.find((r) => r.id === agencyViewId);
    if (selected) {
      return (
        <div>
          <div className="flex justify-end mb-3">
            <RefreshButton
              onRefresh={handleRefresh}
              lastRefreshed={lastRefreshed}
              isRefreshing={isRefreshing}
              label="Refresh"
            />
          </div>
          <AgencyReportWorkspace
            agencyRole={selected}
            activeDataset={activeDataset}
            incidentOptions={incidentOptions}
            onSubmitted={() => setReportTick((t) => t + 1)}
            readOnly
            notify={notify}
            onBack={() => setAgencyViewId(null)}
          />
        </div>
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* RENDER VIEW: SUPER ADMIN & MDRRMO ADMIN (Consolidated Tracker)     */
  /* ------------------------------------------------------------------ */
  if (isSuperAdmin || isAdmin) {
    return (
      <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>{isSuperAdmin ? 'Super Admin Workspace' : 'MDRRMO Admin Workspace'}</span>
              <ChevronRight size={14} />
              <span className="text-brand-600 font-bold">Reports Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1">
              Consolidated Agency Reports &amp; Submissions
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Review, track, and consolidate disaster reports submitted by the 8 municipal offices for RDANA Forms 1 &amp; 2.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <RefreshButton
              onRefresh={handleRefresh}
              lastRefreshed={lastRefreshed}
              isRefreshing={isRefreshing}
              label="Refresh"
            />
            <button
              type="button"
              onClick={() => handleAdminAction('Export Consolidated RDANA PDF', 'All Agencies')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 shadow-sm"
            >
              <Download size={14} />
              <span>Export PDF Briefing</span>
            </button>
            <button
              type="button"
              onClick={() => handleAdminAction('Consolidate RDANA Data', 'System')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20"
            >
              <FileCheck size={14} />
              <span>Consolidate All Submissions</span>
            </button>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Total Agencies</div>
            <div className="text-2xl font-black text-navy-900 mt-1">8 Offices</div>
            <div className="text-xs text-slate-500 mt-1">
              Tagbina LGU Cluster
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Reports Submitted</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{submittedCount} of 8</div>
            <div className="text-xs text-emerald-700 mt-1 font-semibold">
              {Math.round((submittedCount / 8) * 100)}% ready for consolidation
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Pending Submissions</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {pendingRows.length} {pendingRows.length === 1 ? 'Agency' : 'Agencies'}
            </div>
            <div className="text-xs text-amber-700 mt-1 font-semibold">
              {pendingRows.length > 0
                ? pendingRows.map((r) => r.agency).join(', ')
                : 'All agencies submitted'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Est. Total Damage</div>
            <div className="text-2xl font-black text-brand-600 mt-1">
              {formatPesoShort(grandTotalDamage)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {grandTotalDamage > 0
                ? `Sum of ${analytics.totals.assessments} saved assessment${
                    analytics.totals.assessments === 1 ? '' : 's'
                  }`
                : 'No damage valuation recorded yet'}
            </div>
          </div>
        </div>


        {/* Agency report workspaces â€” Super Admin only */}
        {isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-navy-900">
                  Agency Report Workspaces
                </h2>
                <p className="text-xs text-slate-500">
                  Open any office&apos;s Reports page to review its submissions.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Super Admin Access
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {REPORT_AGENCY_ROLES.map((agency) => {
                const submission = submissionFor(agency.agencyCode);
                const submitted = submission && submission.status !== 'Pending';
                return (
                  <button
                    key={agency.id}
                    type="button"
                    onClick={() => openAgencyReports(agency.agencyCode)}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-100 text-navy-800">
                        {agency.agencyCode}
                      </span>
                      <ArrowUpRight
                        size={14}
                        className="text-slate-300 transition-colors group-hover:text-brand-600"
                      />
                    </div>
                    <span className="mt-2 text-xs font-bold text-navy-900 leading-snug">
                      {agency.agencyName}
                    </span>
                    <span className="mt-0.5 text-[11px] text-slate-500">
                      {agency.name}
                    </span>
                    <span className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          submitted ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                      />
                      <span className={submitted ? 'text-emerald-700' : 'text-amber-700'}>
                        {submitted ? 'Report available' : 'Awaiting submission'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Submissions Matrix Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-navy-900">
                Agency Submission Tracker{activeDataset?.name ? ` (${activeDataset.name})` : ''}
              </h2>
              <p className="text-xs text-slate-500">
                Live status of reports submitted by each agency representative
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Active Cycle: 72-Hour Rapid Assessment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Office / Agency</th>
                  <th className="py-3 px-4">Officer in Charge</th>
                  <th className="py-3 px-4">Submission Cycle</th>
                  <th className="py-3 px-4">Reported Key Metrics</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consolidatedSubmissions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-navy-900">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-100 text-navy-800">
                          {row.agency}
                        </span>
                        <span className="truncate max-w-[150px]">{row.agencyName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{row.officer}</td>
                    <td className="py-3.5 px-4 text-slate-500">{row.cycle}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{row.metrics}</td>
                    <td className="py-3.5 px-4 text-slate-500">{row.timestamp}</td>
                    <td className="py-3.5 px-4">
                      {row.status === 'Submitted' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={10} /> Submitted
                        </span>
                      )}
                      {row.status === 'Consolidated' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                          <CheckCircle size={10} /> Consolidated
                        </span>
                      )}
                      {row.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin || row.status !== 'Pending' ? (
                        <button
                          type="button"
                          onClick={() =>
                            isSuperAdmin
                              ? openAgencyReports(row.agency)
                              : handleAdminAction('View Details', row.agency)
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:text-brand-600 px-2.5 py-1 rounded-lg hover:bg-slate-100"
                        >
                          <Eye size={13} />
                          <span>{isSuperAdmin ? 'Open Reports' : 'Review'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdminAction('Send Reminder', row.agency)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100"
                        >
                          <Send size={12} />
                          <span>Remind</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* RENDER VIEW: AGENCY USERS (Personal Sector Report Input)           */
  /* ------------------------------------------------------------------ */
  return (
    <div>
      <div className="flex justify-end mb-3">
        <RefreshButton
          onRefresh={handleRefresh}
          lastRefreshed={lastRefreshed}
          isRefreshing={isRefreshing}
          label="Refresh"
        />
      </div>
      <AgencyReportWorkspace
        agencyRole={role}
        activeDataset={activeDataset}
        incidentOptions={incidentOptions}
        onSubmitted={() => setReportTick((t) => t + 1)}
        notify={notify}
      />
    </div>
  );
}
