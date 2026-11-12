import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive as ArchiveIcon,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  FolderArchive,
  Lock,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
  UserCheck
} from 'lucide-react';
import { ConfirmDialog, Modal } from '../components/Modal';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { useRole } from '../context/RoleContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { ROLE_LEVELS } from '../lib/roles';
import {
  ARCHIVE_AGENCY_LIST,
  ARCHIVE_STATUS_STYLES,
  ARCHIVE_TYPE_STYLES,
  agencyToneClass,
  archiveCountsByAgency,
  getArchiveAgency,
  getRetrievedMap,
  listArchiveRecords,
  listDatasetArchiveRecords,
  listFilledArchiveRecords,
  mergeArchiveRecords,
  retrieveArchiveRecord,
  unretrieveArchiveRecord
} from '../lib/archive';
import { recordAuditLog } from '../lib/audit';
import { deleteIncident, listDatasets, listDeletedIncidents, listIncidents, permanentlyDeleteIncident, restoreIncident } from '../lib/db';
import { displayDT, timeAgo } from '../lib/format';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All record types' },
  { value: 'Assessment', label: 'Assessments (incl. Filled Forms)' },
  { value: 'Report', label: 'Sector reports' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Deleted', label: 'Deleted' },
  { value: 'Archived', label: 'Archived' },
  { value: 'Superseded', label: 'Superseded' },
  { value: 'Permanent', label: 'Permanent' },
  { value: 'Retrieved', label: 'Retrieved' }
];

export default function ArchivePage() {
  const { role, isSuperAdmin } = useRole();
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [retrievedTick, setRetrievedTick] = useState(0);
  const [pendingRetrieve, setPendingRetrieve] = useState(null);
  const [pendingRetrieveAll, setPendingRetrieveAll] = useState(false);
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState(null);
  const [filledIncidents, setFilledIncidents] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const signatureRef = useRef('');

  const scopeAgency = isSuperAdmin ? null : getArchiveAgency(role.agencyId);

  const { refresh, lastRefreshed, isRefreshing } = useAutoRefresh(
    async ({ silent } = {}) => {
      const [active, deleted, dsRows] = await Promise.all([
        listIncidents(),
        listDeletedIncidents(),
        listDatasets()
      ]);
      const rows = [...active, ...deleted];
      const incSig = rows
        .map((r) => `${r.id}:${r.updatedAt || ''}:${r.deletedAt || ''}`)
        .join(',');
      const dsSig = (dsRows || []).map((d) => `${d.id}:${d.uploadedAt || ''}`).join(',');
      const retSig = JSON.stringify(getRetrievedMap());
      const signature = `${incSig}||${dsSig}||${retSig}`;
      if (silent && signature === signatureRef.current) {
        return false;
      }
      signatureRef.current = signature;
      setFilledIncidents(rows);
      setDatasets(dsRows || []);
      setRetrievedTick((t) => t + 1);
      return true;
    },
    { intervalMs: 3000 }
  );

  const handleRefresh = async () => {
    await refresh();
    notify.info('Archive records refreshed.');
  };

  /* Re-reads listArchiveRecords (which merges persisted Retrieved status)
     whenever retrievedTick changes, so a retrieve/re-archive is visible
     in every archive tab — All Agencies, each agency folder, Assessments,
     Sector Reports, and every status — without a page reload.
     Filled Forms and uploaded Data Sets are merged on top, latest first.
     Agency users see central (MDRRMO) records plus their own agency's records. */
  const records = useMemo(() => {
    const seed = isSuperAdmin
      ? listArchiveRecords(null)
      : listArchiveRecords(role.agencyId || '__no_agency__');
    const filledAll = [
      ...listFilledArchiveRecords(filledIncidents),
      ...listDatasetArchiveRecords(datasets)
    ];
    const filled = isSuperAdmin
      ? filledAll
      : filledAll.filter(
          (record) => record.agencyId === role.agencyId || record.agencyId === 'mdrrmo'
        );
    return mergeArchiveRecords(seed, filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, role.agencyId, retrievedTick, filledIncidents, datasets]);

  const refreshRetrieved = () => setRetrievedTick((t) => t + 1);

  const doRetrieve = async (record) => {
    if (!record) return;
    /* Deleted Filled Forms are restored to Assessments (deletedAt cleared),
       not just marked Retrieved in localStorage. */
    if (record.status === 'Deleted' && record.incidentId) {
      await restoreIncident(record.incidentId);
      signatureRef.current = '';
      refreshRetrieved();
      setPendingRetrieve(null);
      setSelected(null);
      notify.undo(`Restored “${record.title}” to Assessments`, async () => {
        await deleteIncident(record.incidentId);
        signatureRef.current = '';
        refreshRetrieved();
      });
      return;
    }
    const entry = retrieveArchiveRecord(record, role.name || '');
    refreshRetrieved();
    setPendingRetrieve(null);
    if (selected?.id === record.id) {
      setSelected({
        ...record,
        status: 'Retrieved',
        retrieved: true,
        retrievedAt: entry?.retrievedAt || '',
        retrievedBy: entry?.retrievedBy || role.name || '',
        originalStatus: entry?.originalStatus || record.status
      });
    }
    notify.undo(`Retrieved “${record.title}” from archive`, () => {
      unretrieveArchiveRecord(record.id);
      refreshRetrieved();
      setSelected(null);
    });
  };

  const doPermanentDelete = async (record) => {
    if (!record?.incidentId) return;
    await permanentlyDeleteIncident(record.incidentId);
    signatureRef.current = '';
    refreshRetrieved();
    setPendingPermanentDelete(null);
    setSelected(null);
    notify.success(`Permanently deleted “${record.title}”.`);
  };

  const doReArchive = (record) => {
    if (!record) return;
    unretrieveArchiveRecord(record.id);
    refreshRetrieved();
    if (selected?.id === record.id) setSelected(null);
    notify.success(`Re-archived “${record.title}”.`);
  };

  const doRetrieveAll = async () => {
    const targets = shown.filter((record) => !record.retrieved);
    for (const record of targets) {
      if (record.status === 'Deleted' && record.incidentId) {
        await restoreIncident(record.incidentId);
      } else {
        retrieveArchiveRecord(record, role.name || '');
      }
    }
    signatureRef.current = '';
    refreshRetrieved();
    setPendingRetrieveAll(false);
    notify.undo(
      `Retrieved ${targets.length} archive record${targets.length === 1 ? '' : 's'}`,
      async () => {
        for (const record of targets) {
          if (record.status === 'Deleted' && record.incidentId) {
            await deleteIncident(record.incidentId);
          } else {
            unretrieveArchiveRecord(record.id);
          }
        }
        signatureRef.current = '';
        refreshRetrieved();
      }
    );
  };

  const agencyCounts = useMemo(() => archiveCountsByAgency(records), [records]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (isSuperAdmin && agencyFilter !== 'all' && record.agencyId !== agencyFilter) {
        return false;
      }
      if (typeFilter !== 'all' && record.type !== typeFilter) return false;
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (!needle) return true;
      const haystack = [
        record.title,
        record.reference,
        record.agencyCode,
        record.agencyName,
        record.incident,
        record.period,
        record.archivedBy,
        record.summary
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [records, query, agencyFilter, typeFilter, statusFilter, isSuperAdmin]);

  const stats = useMemo(
    () => ({
      total: records.length,
      agencies: new Set(records.map((record) => record.agencyId)).size,
      assessments: records.filter((record) => record.type === 'Assessment').length,
      reports: records.filter((record) => record.type === 'Report').length,
      filledForms: records.filter((record) => record.source === 'filled-form').length,
      deleted: records.filter((record) => record.status === 'Deleted').length,
      retrieved: records.filter((record) => record.retrieved).length,
      files: records.reduce((sum, record) => sum + (Number(record.files) || 0), 0)
    }),
    [records]
  );

  const exportCsv = (list, label = 'archive') => {
    const header = [
      'Agency Code',
      'Agency',
      'Record ID',
      'Title',
      'Reference',
      'Type',
      'Form',
      'Incident',
      'Period',
      'Status',
      'Archived At',
      'Archived By',
      'Retention',
      'Files',
      'Summary',
      'Source',
      'Incident ID'
    ];
    const rows = list.map((record) => [
      record.agencyCode,
      record.agencyName,
      record.id,
      record.title,
      record.reference,
      record.type,
      record.form,
      record.incident,
      record.period,
      record.status,
      record.archivedAt,
      record.archivedBy,
      record.retention,
      record.files,
      record.summary,
      record.source === 'filled-form' ? 'Filled Form' : 'Archived record',
      record.incidentId || ''
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdana-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify.success(`Exported ${list.length} archive record${list.length === 1 ? '' : 's'}.`);
  };

  const breadcrumbRoot = isSuperAdmin
    ? 'Super Admin Workspace'
    : role.level === ROLE_LEVELS.ADMIN
    ? 'MDRRMO Admin Workspace'
    : 'Agency Workspace';

  const pageTitle = isSuperAdmin
    ? 'All-Agency Archive'
    : `${role.agencyCode} Agency Archive`;

  const pageSubtitle = isSuperAdmin
    ? 'Every archived assessment, sector report, and Filled Form saved on this device (Phase 1, Phase 2) from the eight municipal offices. Open an agency folder to narrow the record set.'
    : `Read-only institutional memory for ${role.agencyName || role.agencyCode}, including Filled Forms saved on this device. Records from other agencies are not visible from this account.`;

  return (
    <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>{breadcrumbRoot}</span>
            <ChevronRight size={14} />
            {!isSuperAdmin && (
              <>
                <span>{role.agencyCode} Portal</span>
                <ChevronRight size={14} />
              </>
            )}
            <span className="text-brand-600 font-bold">Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1">
            {pageTitle}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{pageSubtitle}</p>
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
            onClick={() => setPendingRetrieveAll(true)}
            disabled={!shown.some((record) => !record.retrieved)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} />
            <span>Retrieve All Shown</span>
          </button>
          <button
            type="button"
            onClick={() => exportCsv(shown)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 shadow-sm"
          >
            <Download size={14} />
            <span>Export Archive CSV</span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-3">
        <ShieldCheck size={18} className="text-brand-600 flex-none mt-0.5" />
        <div className="text-xs text-brand-900">
          <span className="font-bold">
            {isSuperAdmin ? 'Full archive oversight.' : 'Scoped agency archive.'}
          </span>{' '}
          {isSuperAdmin
            ? 'You are viewing the records of all agencies, including Filled Forms saved on this device. Each agency account can only open its own archive folder.'
            : `This archive contains ${role.agencyCode} records and central Filled Forms only. Cross-agency archive access is reserved for the Super Admin.`}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <FolderArchive size={13} /> Archived Records
          </div>
          <div className="text-2xl font-black text-navy-900 mt-1">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.files} attached file{stats.files === 1 ? '' : 's'}
            {stats.retrieved > 0 && (
              <span className="text-amber-700 font-semibold"> · {stats.retrieved} retrieved</span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Building2 size={13} /> Agencies Covered
          </div>
          <div className="text-2xl font-black text-brand-600 mt-1">{stats.agencies}</div>
          <div className="text-xs text-slate-500 mt-1">
            {isSuperAdmin ? 'All municipal offices' : 'Your office only'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <ClipboardList size={13} /> Assessments
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.assessments}</div>
          <div className="text-xs text-slate-500 mt-1">
            RDANA Forms 1 &amp; 2{stats.filledForms > 0 ? ` · ${stats.filledForms} Filled Form${stats.filledForms === 1 ? '' : 's'}` : ''}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <FileText size={13} /> Sector Reports
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats.reports}</div>
          <div className="text-xs text-slate-500 mt-1">24-hour and 72-hour submissions</div>
        </div>
      </div>

      {isSuperAdmin ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Agency Archive Folders
            </h2>
            <span className="text-xs text-slate-400">
              Open a folder to view only that agency's records
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setAgencyFilter('all')}
              className={`text-left rounded-2xl border p-3.5 transition-all bg-white hover:border-slate-300 ${
                agencyFilter === 'all'
                  ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/40'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center">
                  <ArchiveIcon size={15} />
                </span>
                <span className="text-lg font-black text-navy-900">{records.length}</span>
              </div>
              <div className="text-xs font-bold text-navy-900 mt-2">All Agencies</div>
              <div className="text-[10px] text-slate-500">Complete institutional archive</div>
            </button>

            {ARCHIVE_AGENCY_LIST.map((agency) => (
              <button
                key={agency.id}
                type="button"
                onClick={() => setAgencyFilter(agency.id)}
                className={`text-left rounded-2xl border p-3.5 transition-all bg-white hover:border-slate-300 ${
                  agencyFilter === agency.id
                    ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/40'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-8 h-8 rounded-lg text-white text-[10px] font-bold flex items-center justify-center ${agencyToneClass(
                      agency.tone
                    )}`}
                  >
                    {agency.code.slice(0, 2)}
                  </span>
                  <span className="text-lg font-black text-navy-900">
                    {agencyCounts[agency.id] || 0}
                  </span>
                </div>
                <div className="text-xs font-bold text-navy-900 mt-2 truncate">
                  {agency.code}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{agency.shortName}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <span
            className={`w-11 h-11 rounded-xl text-white text-xs font-bold flex items-center justify-center flex-none ${agencyToneClass(
              scopeAgency?.tone
            )}`}
          >
            {role.agencyCode?.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-navy-900">{scopeAgency?.name || role.agencyName}</div>
            <div className="text-[11px] text-slate-500">
              Archive folder restricted to {role.agencyCode} · managed by {scopeAgency?.officer || role.name}
            </div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 flex-none">
            <Lock size={11} /> Agency scope
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, reference, incident, or officer…"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold text-navy-900 py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-navy-900 py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {shown.length} of {records.length} shown
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-navy-900">Archived Records &amp; Filled Forms</h2>
            <p className="text-xs text-slate-500">
              Newest first — Filled Forms and recent Deleted appear automatically at the top{stats.deleted > 0 ? ` · ${stats.deleted} Deleted (latest Deleted on top)` : ''} · click a row to inspect
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Lock size={12} /> Read-only until retrieved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">Record</th>
                {isSuperAdmin && <th className="py-3 px-4">Agency</th>}
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Archived</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Retention</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((record, idx) => (
                <tr
                  key={record.id}
                  onClick={() => setSelected(record)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-navy-900 max-w-[280px] flex items-center gap-1.5 flex-wrap">
                      {record.title}
                      {record.source === 'filled-form' && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-200">
                          Filled Form
                        </span>
                      )}
                      {record.status === 'Deleted' &&
                        idx === shown.findIndex((r) => r.status === 'Deleted') && (
                          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700 border border-red-200">
                            Latest Deleted
                          </span>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {record.reference} · {record.incident}
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md text-white text-[9px] font-bold flex items-center justify-center flex-none ${agencyToneClass(
                            record.agencyTone
                          )}`}
                        >
                          {record.agencyCode.slice(0, 2)}
                        </span>
                        <div>
                          <div className="font-bold text-navy-900 text-[11px]">
                            {record.agencyCode}
                          </div>
                          <div className="text-[10px] text-slate-500 max-w-[130px] truncate">
                            {record.agencyShortName}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="py-3.5 px-4 align-top">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        ARCHIVE_TYPE_STYLES[record.type] || ARCHIVE_TYPE_STYLES.Report
                      }`}
                    >
                      {record.type}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">{record.form}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-navy-900 whitespace-nowrap">
                      {displayDT(record.archivedAt)}
                    </div>
                    <div className="text-[10px] text-slate-400">{timeAgo(record.archivedAt)}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        ARCHIVE_STATUS_STYLES[record.status] || ARCHIVE_STATUS_STYLES.Archived
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top text-slate-600">{record.retention}</td>
                  <td className="py-3.5 px-4 align-top text-right">
                    <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(record);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:text-brand-600 px-2.5 py-1 rounded-lg hover:bg-slate-100"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                      {record.status === 'Deleted' ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingRetrieve(record);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg"
                            title="Restore this deleted form to Assessments"
                          >
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingPermanentDelete(record);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg"
                            title="Permanently delete this record"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : record.retrieved ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            doReArchive(record);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 border border-slate-200"
                          title="Return this record to the archive"
                        >
                          <Undo2 size={13} />
                          <span>Re-archive</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingRetrieve(record);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg"
                          title="Retrieve this record back to active use"
                        >
                          <RotateCcw size={13} />
                          <span>Retrieve</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {shown.length === 0 && (
          <div className="p-10 text-center">
            <FolderArchive size={28} className="mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-bold text-navy-900">No archive records match your filters</div>
            <p className="text-xs text-slate-500 mt-1">
              Try a different search term, record type, or status.
            </p>
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        title="Archive Record Detail"
        onCancel={() => setSelected(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => exportCsv([selected], 'archive-record')}
            >
              Download Record
            </button>
            {selected?.source === 'filled-form' &&
              selected?.incidentId &&
              selected?.status !== 'Deleted' && (
                <>
                  <Link to={`/incident/${selected.incidentId}`} className="btn btn-outline btn-sm">
                    Open Filled Form
                  </Link>
                  <Link to={`/incident/${selected.incidentId}/report`} className="btn btn-outline btn-sm">
                    Open Report
                  </Link>
                </>
              )}
            {selected?.status === 'Deleted' ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => selected && setPendingRetrieve(selected)}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => selected && setPendingPermanentDelete(selected)}
                >
                  Delete Permanently
                </button>
              </>
            ) : selected?.retrieved ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => doReArchive(selected)}
              >
                Re-archive
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#fff7ed', color: '#92400e', border: '1px solid #fcd9a8' }}
                onClick={() => selected && setPendingRetrieve(selected)}
              >
                Retrieve
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4" data-tailwind>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selected.reference}
                </div>
                <h3 className="text-base font-black text-navy-900 mt-1">{selected.title}</h3>
                <div className="text-xs text-slate-500 mt-0.5">{selected.incident}</div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-none ${
                  ARCHIVE_STATUS_STYLES[selected.status] || ARCHIVE_STATUS_STYLES.Archived
                }`}
              >
                {selected.status}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span
                className={`w-8 h-8 rounded-lg text-white text-[10px] font-bold flex items-center justify-center flex-none ${agencyToneClass(
                  selected.agencyTone
                )}`}
              >
                {selected.agencyCode.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy-900">
                  {selected.agencyCode} · {selected.agencyName}
                </div>
                <div className="text-[10px] text-slate-500">
                  Archived by {selected.archivedBy}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{selected.summary}</p>

            {selected.source === 'filled-form' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900 flex items-start gap-2">
                <ClipboardList size={13} className="text-emerald-600 flex-none mt-0.5" />
                <span>
                  <b>Filled Form</b> — this is a real assessment filled and saved on this device
                  ({selected.form}), included in the archive automatically. Use Open Filled Form /
                  Open Report to view or edit the original.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Record Type
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">
                  {selected.type} · {selected.form}
                </div>
                <div className="text-[11px] text-slate-500">{selected.period}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Archived
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">
                  {displayDT(selected.archivedAt)}
                </div>
                <div className="text-[11px] text-slate-500">{timeAgo(selected.archivedAt)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Retention
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">{selected.retention}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Attached Files
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">
                  {selected.files} document{selected.files === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                <CalendarDays size={12} /> Key Archived Highlights
              </div>
              <div className="text-xs text-brand-900 mt-1">{selected.highlights}</div>
            </div>

            {selected.status === 'Deleted' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-900 flex items-start gap-2">
                <Trash2 size={13} className="text-red-600 flex-none mt-0.5" />
                <span>
                  <b>Deleted</b> {selected.deletedAt ? `on ${displayDT(selected.deletedAt)} (${timeAgo(selected.deletedAt)})` : ''}.
                  This form is excluded from Assessments and the Disaster Situation Overview until restored.
                  Use Restore to bring it back, or Delete Permanently to remove it for good.
                </span>
              </div>
            )}

            {selected.retrieved && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <RotateCcw size={13} className="text-amber-600 flex-none mt-0.5" />
                <span>
                  <b>Retrieved</b> {selected.retrievedAt ? `on ${displayDT(selected.retrievedAt)}` : ''}
                  {selected.retrievedBy ? ` by ${selected.retrievedBy}` : ''} · previous status:{' '}
                  {selected.originalStatus || 'Archived'}. Use Re-archive to return it to the archive.
                </span>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-500 flex items-start gap-2">
              <Lock size={13} className="text-slate-400 flex-none mt-0.5" />
              <span>
                {selected.access}. Archive records are read-only until retrieved, and cannot be deleted
                from this screen.
              </span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingRetrieve}
        title={pendingRetrieve?.status === 'Deleted' ? 'Restore this deleted form?' : 'Retrieve this archive record?'}
        message={
          pendingRetrieve
            ? pendingRetrieve.status === 'Deleted'
              ? `“${pendingRetrieve.title}” (${pendingRetrieve.reference}) will be restored to Assessments and back into the Disaster Situation Overview totals.`
              : `“${pendingRetrieve.title}” (${pendingRetrieve.reference}) will be retrieved from the archive back to active use. It stays in the archive list with a “Retrieved” status and can be re-archived or undone.`
            : ''
        }
        confirmLabel={pendingRetrieve?.status === 'Deleted' ? 'Restore form' : 'Retrieve record'}
        onConfirm={() => doRetrieve(pendingRetrieve)}
        onCancel={() => setPendingRetrieve(null)}
      />

      <ConfirmDialog
        open={pendingRetrieveAll}
        title="Retrieve all shown records?"
        message={`This will retrieve ${shown.filter((record) => !record.retrieved).length} record(s) currently shown (${shown.length} total in this view) back to active use. Deleted forms will be restored to Assessments; other records keep a “Retrieved” status and can be re-archived or undone together.`}
        confirmLabel="Retrieve all shown"
        onConfirm={doRetrieveAll}
        onCancel={() => setPendingRetrieveAll(false)}
      />

      <ConfirmDialog
        open={!!pendingPermanentDelete}
        title="Delete permanently?"
        message={
          pendingPermanentDelete
            ? `“${pendingPermanentDelete.title}” will be permanently removed from this device. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete permanently"
        danger
        onConfirm={() => doPermanentDelete(pendingPermanentDelete)}
        onCancel={() => setPendingPermanentDelete(null)}
      />
    </div>
  );
}
