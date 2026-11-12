import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, FileSpreadsheet, ShieldAlert, Trash2, Upload } from 'lucide-react';
import { ConfirmDialog } from '../components/Modal';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { useRole } from '../context/RoleContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { recordAuditLog } from '../lib/audit';
import { parseDatasetFile, summarizeDataset } from '../lib/dataset';
import { clearAllData, deleteDataset, listDatasets, saveDataset } from '../lib/db';

/* ------------------------------------------------------------------ *
 * Data Sets — Super Admin upload workspace.
 *
 * Files are parsed on the device (SheetJS handles CSV + Excel) and
 * stored in IndexedDB as plain rows + columns, so the Data Sets
 * analytics tab can read them offline like every other screen.
 * ------------------------------------------------------------------ */

const ACCEPT = '.csv,.xlsx,.xls';

function fmtWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DataSets() {
  const { isSuperAdmin } = useRole();
  const notify = useToast();
  const inputRef = useRef(null);
  const [datasets, setDatasets] = useState([]);
  const [reading, setReading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const signatureRef = useRef('');

  const { refresh, lastRefreshed, isRefreshing } = useAutoRefresh(
    async ({ silent } = {}) => {
      const rows = await listDatasets();
      const sig = rows.map((d) => `${d.id}:${d.uploadedAt || ''}`).join(',');
      if (silent && signatureRef.current === sig) {
        return false;
      }
      signatureRef.current = sig;
      setDatasets(rows);
      return true;
    },
    { intervalMs: 5000 }
  );

  const handleRefresh = async () => {
    await refresh();
    notify.info('Data sets refreshed.');
  };

  /* Files save themselves: parse → store → refresh, no confirm step.
     Re-uploading the same file name updates it in place. */
  const onFiles = async (fileList) => {
    const file = fileList && fileList[0];
    if (!file) return;
    setReading(true);
    try {
      const parsed = await parseDatasetFile(file);
      const summary = summarizeDataset(parsed.rows, parsed.columns);
      const numeric = summary.columns.filter((c) => c.type === 'number').length;
      const existing = datasets.find((d) => d.name === parsed.name);
      await saveDataset({
        id: existing ? existing.id : crypto.randomUUID(),
        name: parsed.name,
        columns: parsed.columns,
        rows: parsed.rows
      });
      recordAuditLog({
        action: existing ? 'Updated analytics data set' : 'Uploaded analytics data set',
        category: 'System',
        severity: 'success',
        target: parsed.name,
        details: `${parsed.name} saved with ${summary.rowCount.toLocaleString()} rows and ${parsed.columns.length} columns.`
      });
      await refresh();
      notify.success(
        `${parsed.name} auto-saved — ${summary.rowCount.toLocaleString()} rows · ${parsed.columns.length} columns · ${numeric} numeric.`
      );
    } catch (err) {
      notify.error(err?.message || 'Could not read that file.');
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDelete = async () => {
    const target = pendingDelete;
    if (!target) return;
    await deleteDataset(target.id);
    recordAuditLog({
      action: 'Deleted analytics data set',
      category: 'System',
      severity: 'warning',
      target: target.name,
      details: `Removed uploaded data set "${target.name}".`
    });
    setPendingDelete(null);
    await refresh();
    notify.success(`Deleted ${target.name}.`);
  };

  const onClearAll = async () => {
    await clearAllData();
    recordAuditLog({
      action: 'Cleared all data',
      category: 'System',
      severity: 'warning',
      target: 'Local database',
      details: 'Removed every saved assessment form and uploaded data set from this device.'
    });
    setConfirmClear(false);
    await refresh();
    notify.success('All saved forms and uploaded data sets were removed.');
  };

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto my-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center font-sans shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-xl font-bold text-navy-900">Restricted Access: Data Sets</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Uploading analytics data sets is exclusive to the Super Admin account. MDRRMO Admin and
          agency users cannot upload or manage files.
        </p>
        <div className="mt-5">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans" data-shell="ardana">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl">Data Sets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload CSV or Excel files on this device and use them in the dashboard's Data Sets
            analytics.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            data-testid="clear-all-data"
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:border-rose-400 hover:bg-rose-50"
          >
            <Trash2 size={15} strokeWidth={2.2} />
            Clear all data
          </button>
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-navy-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
          >
            <Database size={15} strokeWidth={2.2} />
            Open analytics
          </Link>
        </div>
      </div>

      {/* Upload card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-base font-bold text-navy-900 md:text-lg">Upload a data set</h2>
        <p className="mt-1 text-xs text-gray-500 md:text-sm">
          Accepted: <strong>.csv</strong>, <strong>.xlsx</strong>, <strong>.xls</strong> — the first
          row must contain the column names. Files never leave this device.
        </p>

        <div
          data-testid="dataset-dropzone"
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/50'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="h-7 w-7 text-brand-500" strokeWidth={2} />
          <p className="mt-3 text-sm font-semibold text-navy-900">
            {reading ? 'Reading file…' : 'Drag a file here, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-gray-500">Files save automatically — the first sheet/row is read.</p>
          <input
            ref={inputRef}
            data-testid="dataset-input"
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
      </section>

      {/* Saved list */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-base font-bold text-navy-900 md:text-lg">Saved data sets</h2>
        <p className="mt-1 text-xs text-gray-500 md:text-sm">Stored in this browser's local database.</p>

        {datasets.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-400" strokeWidth={1.6} />
            <p className="mt-2 text-sm font-semibold text-navy-900">No data sets yet.</p>
            <p className="mt-1 text-xs text-gray-500">Upload a CSV or Excel file above to get started.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {datasets.map((ds) => (
              <li key={ds.id} className="flex flex-wrap items-center gap-3 py-3" data-testid="dataset-item">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-900">{ds.name}</p>
                  <p className="text-xs text-gray-500">
                    {(ds.rows?.length || 0).toLocaleString()} rows · {ds.columns?.length || 0} columns ·
                    saved {fmtWhen(ds.uploadedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/dashboard?dataset=${encodeURIComponent(ds.id)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Database className="h-3.5 w-3.5" strokeWidth={2} />
                    View analytics
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => setPendingDelete(ds)}
                    aria-label={`Delete ${ds.name}`}
                    data-testid="dataset-delete"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete data set?"
        message={pendingDelete ? `${pendingDelete.name} and its rows will be removed from this device.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Remove all data?"
        message="Every saved assessment form and every uploaded data set will be permanently deleted from this device. This cannot be undone."
        confirmLabel="Remove all"
        danger
        onConfirm={onClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
