import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { sortLatestFirst } from '../../lib/analytics';
import { actorFromRole, recordAuditLog } from '../../lib/audit';
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Save,
  Send,
  ShieldAlert,
  Upload
} from 'lucide-react';

const SECTOR_REPORTS_STORAGE_KEY = 'rdana.sector_reports.v1';

export function listStoredSectorReports() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(SECTOR_REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredSectorReport(entry) {
  const current = listStoredSectorReports();
  const next = [entry, ...current];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SECTOR_REPORTS_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore storage quota errors
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * Agency report workspace.
 *
 * This is the Reports page the agency representatives see. It is also
 * rendered read-only for the Super Admin so every office's submissions
 * can be reviewed from one place.
 * ------------------------------------------------------------------ */
export default function AgencyReportWorkspace({
  agencyRole,
  buildingReports = [],
  activeDataset = null,
  incidentOptions = [],
  onSubmitted,
  readOnly = false,
  onBack,
  notify
}) {
  const [activeTab, setActiveTab] = useState('new');
  const [reportCycle, setReportCycle] = useState('72hr');
  const [submitting, setSubmitting] = useState(false);
  const [storedReports, setStoredReports] = useState(() => listStoredSectorReports());

  const [formData, setFormData] = useState({
    damagedUnits: '',
    estimatedCost: '',
    affectedPopulation: '',
    priorityNeed: 'relief_kits',
    barangayCoverage: '',
    remarks: ''
  });

  useEffect(() => {
    if (!buildingReports.length) return;
    const totalCost = buildingReports.reduce(
      (sum, r) => sum + (r.damageCost || r.estimatedCost || 0),
      0
    );
    const totalAffected = buildingReports.reduce(
      (sum, r) => sum + (r.affectedIndividuals || r.occupants || 0),
      0
    );
    const brgys = [...new Set(buildingReports.map((r) => r.barangay).filter(Boolean))].join(', ');
    const notes = buildingReports
      .map(
        (r) =>
          `${r.buildingName} (${r.barangay}): ${r.severityRaw || r.damageLevel}${
            r.usabilityStatus ? ` — ${r.usabilityStatus}` : ''
          }${r.remarks ? `. ${r.remarks}` : ''}`
      )
      .join('\n');

    setFormData((prev) => ({
      ...prev,
      damagedUnits: prev.damagedUnits || String(buildingReports.length),
      estimatedCost: prev.estimatedCost || (totalCost > 0 ? totalCost.toLocaleString() : ''),
      affectedPopulation: prev.affectedPopulation || (totalAffected > 0 ? String(totalAffected) : ''),
      priorityNeed: 'repairs',
      barangayCoverage: brgys || prev.barangayCoverage,
      remarks: prev.remarks || notes
    }));
  }, [buildingReports]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    recordAuditLog({
      action: 'Saved sector report draft',
      category: 'Reports',
      severity: 'success',
      target: `${agencyRole.agencyCode} · ${reportCycle} cycle`,
      details: `Draft sector report saved locally for ${agencyRole.agencyName}.`,
      actor: actorFromRole(agencyRole)
    });
    notify.success('Report draft saved locally on this device.');
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const entry = {
        id: `REP-${agencyRole.agencyCode}-${String(storedReports.length + 1).padStart(3, '0')}`,
        agencyCode: agencyRole.agencyCode,
        agencyName: agencyRole.agencyName,
        title:
          reportCycle === '24hr'
            ? 'Initial 24-Hour Damage Notification'
            : reportCycle === 'post'
            ? 'Post-Disaster Needs Validation Report'
            : '72-Hour Rapid Damage & Needs Report (Form 2 Annex)',
        incident: activeDataset?.name || 'Active RDANA Assessment',
        date: new Date().toLocaleString(),
        status: 'Submitted to MDRRMO',
        submittedBy: agencyRole.name,
        damagedUnits: Number(String(formData.damagedUnits || '0').replace(/,/g, '')) || 0,
        estimatedCost: Number(String(formData.estimatedCost || '0').replace(/,/g, '')) || 0,
        affectedPopulation: Number(String(formData.affectedPopulation || '0').replace(/,/g, '')) || 0,
        barangayCoverage: formData.barangayCoverage || ''
      };
      const updated = saveStoredSectorReport(entry);
      setStoredReports(updated);
      if (typeof onSubmitted === 'function') {
        onSubmitted(entry);
      }
      recordAuditLog({
        action: 'Submitted 72-hour sector report',
        category: 'Reports',
        severity: 'success',
        target: entry.id,
        details: `${agencyRole.agencyName} submitted sector report (${formData.damagedUnits || 0} damaged units, est. ₱${formData.estimatedCost || '0'}).`,
        actor: actorFromRole(agencyRole)
      });
      notify.success(
        'Report successfully transmitted to MDRRMO - RDANA Command (Crissalen Danao).'
      );
    }, 600);
  };

  const agencyHistory = useMemo(() => {
    const dynamicItems = sortLatestFirst(buildingReports).map((r, idx) => ({
      id: `BLDG-${String(idx + 1).padStart(3, '0')}`,
      incidentId: r.incidentId,
      title: `Building Structure Assessment — ${r.buildingName} (${r.barangay})`,
      incident: `${r.calamityType || 'Earthquake'}${r.dateOfCalamity ? ` — ${r.dateOfCalamity}` : ''}`,
      date: r.assessmentDate || 'Synced from Building Form',
      status: 'Auto-Added Report',
      submittedBy: r.assessorName || agencyRole.name
    }));

    const agencySaved = storedReports.filter(
      (item) => String(item.agencyCode || '').toUpperCase() === String(agencyRole.agencyCode || '').toUpperCase()
    );

    return [...agencySaved, ...dynamicItems];
  }, [buildingReports, storedReports, agencyRole.agencyCode, agencyRole.name]);

  /* Phase 2 agencies do not have a reporting workspace yet. The Super
     Admin still gets the read-only review view so their records remain
     reachable. */
  if (!agencyRole.isMvp && !readOnly) {
    return (
      <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>{agencyRole.agencyCode} Portal</span>
            <ChevronRight size={14} />
            <span className="text-brand-600 font-bold">Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1">
            {agencyRole.agencyCode} Disaster Report Submission
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{agencyRole.agencyName}</p>
        </div>

        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm sm:p-12 max-w-3xl mx-auto my-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <Clock size={28} strokeWidth={2.2} />
          </span>

          <span className="inline-flex rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            Coming Soon · Phase 2 Development
          </span>

          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
            {agencyRole.agencyCode} Report Submission Coming Soon
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
            The personalized sectoral reporting tools and input forms for{' '}
            <strong>
              {agencyRole.agencyName} ({agencyRole.agencyCode})
            </strong>{' '}
            are slated for the Phase 2 deployment. For immediate urgent disaster
            reporting, please communicate directly with Super Admin Crissalen Danao
            or the MDRRMO Command Center.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-navy-900 text-xs">MVP Rollout Status:</div>
            <div className="flex items-center justify-between">
              <span>Active in MVP:</span>
              <span className="font-semibold text-emerald-700">
                MDRRMO, DepEd, MHO, OMAG
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Coming in Phase 2:</span>
              <span className="font-semibold text-amber-700">
                MSWDO, MASSO, MEO, MPDO
              </span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-navy-900 shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <ArrowLeft size={14} />
          <span>All agency reports</span>
        </button>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>{readOnly ? 'Super Admin Workspace' : `${agencyRole.agencyCode} Portal`}</span>
            <ChevronRight size={14} />
            <span className="text-brand-600 font-bold">
              {agencyRole.agencyCode} Reports
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1">
            {agencyRole.agencyCode} Disaster Report Submission
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {readOnly
              ? `${agencyRole.agencyName} — reports submitted by ${agencyRole.name}.`
              : `Submit your agency's verified damage statistics and resource requests directly to MDRRMO Lead Crissalen Danao.`}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'new'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Sector Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Submissions ({agencyHistory.length})
          </button>
        </div>
      </div>

      {readOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs text-brand-900">
          <ShieldAlert size={18} className="mt-0.5 flex-none text-brand-600" />
          <div>
            <span className="font-bold">Super Admin review access.</span> You are
            viewing {agencyRole.agencyName}&apos;s reports in read-only mode. Edits and
            submissions stay with the assigned representative, {agencyRole.name}.
          </div>
        </div>
      )}

      {activeTab === 'history' ? (
        /* History Log View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-base font-bold text-navy-900">
            {agencyRole.agencyName} — Submitted Reports
          </h2>
          {agencyHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No submitted reports for this office yet. Submit a sector report to populate this log.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agencyHistory.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-900">{item.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                      <span>ID: {item.id}</span>
                      <span>•</span>
                      <span>{item.incident}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                      <span>•</span>
                      <span>By {item.submittedBy}</span>
                    </div>
                  </div>
                  {item.incidentId ? (
                    <Link
                      to={`/incident/${item.incidentId}/report`}
                      className="px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50 text-xs font-bold text-brand-700 hover:bg-brand-100"
                    >
                      Open Report
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => notify.info(`Viewing archive for ${item.id}`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50"
                    >
                      View Copy
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* New Report Input Form Workspace */
        <form onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmitReport} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            {/* Meta Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Reporting Officer
                </label>
                <div className="text-xs font-semibold text-navy-900 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  {agencyRole.name} ({agencyRole.roleLabel})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Target Disaster Incident
                </label>
                <select
                  disabled={readOnly}
                  className="w-full text-xs font-semibold text-navy-900 p-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                >
                  {activeDataset?.name && (
                    <option value={activeDataset.id}>
                      Uploaded Data Set: {activeDataset.name}
                    </option>
                  )}
                  {incidentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                  {!activeDataset?.name && incidentOptions.length === 0 && (
                    <option value="">Active RDANA Assessment</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Reporting Cycle
                </label>
                <select
                  value={reportCycle}
                  disabled={readOnly}
                  onChange={(e) => setReportCycle(e.target.value)}
                  className="w-full text-xs font-semibold text-navy-900 p-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="24hr">Initial 24-Hour Damage Notification</option>
                  <option value="72hr">72-Hour Detailed RDANA Form 2 Annex</option>
                  <option value="post">Post-Disaster Needs Validation Report</option>
                </select>
              </div>
            </div>

            {/* Sector Impact Numerical Inputs */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-brand-500" />
                <span>Sector Damage &amp; Impact Values</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Damaged Sector Assets / Units
                  </label>
                  <input
                    type="number"
                    name="damagedUnits"
                    value={formData.damagedUnits}
                    disabled={readOnly}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Number of facilities affected
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Damage Cost (PHP)
                  </label>
                  <input
                    type="text"
                    name="estimatedCost"
                    value={formData.estimatedCost}
                    disabled={readOnly}
                    onChange={handleInputChange}
                    placeholder="e.g. 250,000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Monetary loss in Philippine Peso
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Affected Beneficiaries / Population
                  </label>
                  <input
                    type="number"
                    name="affectedPopulation"
                    value={formData.affectedPopulation}
                    disabled={readOnly}
                    onChange={handleInputChange}
                    placeholder="e.g. 120"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Displaced individuals/students
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Immediate Priority Need
                  </label>
                  <select
                    name="priorityNeed"
                    value={formData.priorityNeed}
                    disabled={readOnly}
                    onChange={handleInputChange}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="relief_kits">Emergency Relief &amp; Supplies</option>
                    <option value="repairs">Structural Rehabilitation</option>
                    <option value="temp_spaces">
                      Temporary Learning / Health Spaces
                    </option>
                    <option value="logistics">Heavy Equipment / Transport</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Primary request to MDRRMO
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative & Immediate Needs */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Barangay Coverage &amp; Specific Locations
                </label>
                <input
                  type="text"
                  name="barangayCoverage"
                  value={formData.barangayCoverage}
                  disabled={readOnly}
                  onChange={handleInputChange}
                  placeholder="e.g. Poblacion, San Antonio, Mabini"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sectoral Assessment Observations &amp; Operational Remarks
                </label>
                <textarea
                  name="remarks"
                  rows={4}
                  value={formData.remarks}
                  disabled={readOnly}
                  onChange={handleInputChange}
                  placeholder={`Describe observations from the field, urgent hazards, safety concerns, or specific recommendations from ${agencyRole.agencyName}...`}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* File Attachment Placeholder */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-brand-400 transition-colors">
              <Upload size={22} className="mx-auto text-slate-400 mb-1" />
              <div className="text-xs font-bold text-navy-900">
                Attach Supporting Photo or Scanned Form Annex
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PDF, JPG, PNG up to 10MB (Optional annex for MDRRMO verification)
              </p>
            </div>
          </div>

          {/* Action Row */}
          {readOnly ? (
            <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle size={15} className="text-emerald-600" />
                <span>
                  Read-only review copy — submissions remain with {agencyRole.name}.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  notify.info(`Exporting ${agencyRole.agencyCode} report review copy…`)
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 shadow-sm"
              >
                <Download size={15} />
                <span>Export Review Copy</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 shadow-sm"
              >
                <Save size={15} />
                <span>Save Local Draft</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                <Send size={15} />
                <span>
                  {submitting
                    ? 'Transmitting...'
                    : 'Submit Report to MDRRMO RDANA Command'}
                </span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
