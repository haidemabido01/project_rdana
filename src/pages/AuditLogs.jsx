import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Eye,
  ScrollText,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Modal } from '../components/Modal';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { useRole } from '../context/RoleContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_STYLES,
  AUDIT_SEVERITY_STYLES,
  actorToneClass,
  listAuditLogs
} from '../lib/audit';
import { displayDT, timeAgo } from '../lib/format';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All severities' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' }
];

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function AuditLogs() {
  const { isSuperAdmin } = useRole();
  const notify = useToast();
  const [entries, setEntries] = useState(() => listAuditLogs());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [selected, setSelected] = useState(null);
  const signatureRef = useRef('');

  const { refresh: autoRefresh, lastRefreshed, isRefreshing } = useAutoRefresh(
    async ({ silent } = {}) => {
      const next = listAuditLogs();
      const sig = `${next.length}|${next[0]?.id || ''}|${next[0]?.timestamp || ''}`;
      if (silent && signatureRef.current === sig) {
        return false;
      }
      signatureRef.current = sig;
      setEntries(next);
      setSelected((cur) => (cur ? next.find((e) => e.id === cur.id) || cur : null));
      return true;
    },
    { intervalMs: 5000 }
  );

  const refresh = async () => {
    await autoRefresh();
    notify.info('Audit trail refreshed from local storage.');
  };

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (severity !== 'all' && entry.severity !== severity) return false;
      if (!needle) return true;
      const haystack = [
        entry.action,
        entry.target,
        entry.details,
        entry.category,
        entry.actor?.name,
        entry.actor?.role,
        entry.ip,
        entry.device
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [entries, query, category, severity]);

  const stats = useMemo(
    () => ({
      total: entries.length,
      today: entries.filter((entry) => isToday(entry.timestamp)).length,
      flagged: entries.filter((entry) => entry.severity !== 'success').length,
      actors: new Set(entries.map((entry) => entry.actor?.name).filter(Boolean)).size
    }),
    [entries]
  );

  const exportCsv = () => {
    const header = [
      'Timestamp',
      'Event ID',
      'Category',
      'Action',
      'Target',
      'Severity',
      'Actor',
      'Role',
      'IP Address',
      'Device',
      'Details'
    ];
    const rows = shown.map((entry) => [
      entry.timestamp,
      entry.id,
      entry.category,
      entry.action,
      entry.target,
      entry.severity,
      entry.actor?.name,
      entry.actor?.role,
      entry.ip,
      entry.device,
      entry.details
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdana-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify.success(`Exported ${shown.length} audit event${shown.length === 1 ? '' : 's'}.`);
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-xl mx-auto my-10 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-xl font-bold text-navy-900">Restricted Access: Audit Logs</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          The system audit trail is exclusive to the Super Admin account. MDRRMO Admin and agency
          users cannot view or modify audit records.
        </p>
        <div className="mt-5">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Super Admin Workspace</span>
            <ChevronRight size={14} />
            <span className="text-brand-600 font-bold">Audit Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1">
            System Audit Logs
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Immutable record of sign-ins, assessment changes, report submissions, and account
            administration across all offices.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <RefreshButton
            onRefresh={refresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 shadow-sm"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-3">
        <ShieldCheck size={18} className="text-brand-600 flex-none mt-0.5" />
        <div className="text-xs text-brand-900">
          <span className="font-bold">Read-only audit trail.</span> Only the Super Admin can access
          this log. Entries are retained for the last 500 events and cannot be edited or deleted
          from this screen.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Activity size={13} /> Total Events
          </div>
          <div className="text-2xl font-black text-navy-900 mt-1">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Current retention window</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Clock size={13} /> Today
          </div>
          <div className="text-2xl font-black text-brand-600 mt-1">{stats.today}</div>
          <div className="text-xs text-slate-500 mt-1">Events logged since midnight</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <AlertTriangle size={13} /> Flagged Events
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.flagged}</div>
          <div className="text-xs text-amber-700 mt-1 font-semibold">Warnings and critical alerts</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <UserCheck size={13} /> Active Actors
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.actors}</div>
          <div className="text-xs text-slate-500 mt-1">Unique users in this trail</div>
        </div>
      </div>

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
              placeholder="Search by action, actor, target, IP, or details…"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs font-semibold text-navy-900 py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All categories</option>
              {AUDIT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="text-xs font-semibold text-navy-900 py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SEVERITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {shown.length} of {entries.length} shown
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-navy-900">Activity Trail</h2>
            <p className="text-xs text-slate-500">
              Newest events first · click any row to inspect the full record
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={12} /> Tamper-evident
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-navy-900 whitespace-nowrap">
                      {displayDT(entry.timestamp)}
                    </div>
                    <div className="text-[10px] text-slate-400">{timeAgo(entry.timestamp)}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg text-white text-[10px] font-bold flex items-center justify-center flex-none ${actorToneClass(
                          entry.actor?.tone
                        )}`}
                      >
                        {entry.actor?.initials || 'SY'}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-navy-900 truncate max-w-[150px]">
                          {entry.actor?.name || 'System'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
                          {entry.actor?.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-800">{entry.action}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[260px]">
                      {entry.target}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        AUDIT_CATEGORY_STYLES[entry.category] || AUDIT_CATEGORY_STYLES.System
                      }`}
                    >
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                        AUDIT_SEVERITY_STYLES[entry.severity] || AUDIT_SEVERITY_STYLES.success
                      }`}
                    >
                      {entry.severity === 'success' ? (
                        <CheckCircle size={10} />
                      ) : (
                        <AlertTriangle size={10} />
                      )}
                      {entry.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(entry);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:text-brand-600 px-2.5 py-1 rounded-lg hover:bg-slate-100"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {shown.length === 0 && (
          <div className="p-10 text-center">
            <ScrollText size={26} className="mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-bold text-navy-900">No audit events match your filters</div>
            <p className="text-xs text-slate-500 mt-1">
              Try a different search term, category, or severity.
            </p>
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        title="Audit Event Detail"
        onCancel={() => setSelected(null)}
        footer={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        }
      >
        {selected && (
          <div className="space-y-4" data-tailwind>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selected.id}
                </div>
                <h3 className="text-base font-black text-navy-900 mt-1">{selected.action}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selected.target}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                  AUDIT_SEVERITY_STYLES[selected.severity] || AUDIT_SEVERITY_STYLES.success
                }`}
              >
                {selected.severity}
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{selected.details}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Actor
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">
                  {selected.actor?.name || 'System'}
                </div>
                <div className="text-[11px] text-slate-500">{selected.actor?.role}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Category
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">{selected.category}</div>
                <div className="text-[11px] text-slate-500">{displayDT(selected.timestamp)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  IP Address
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">{selected.ip}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Device
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1 break-words">
                  {selected.device}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-500">
              This record is part of the immutable Super Admin audit trail and cannot be modified
              from the application.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
