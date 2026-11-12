import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Check, ChevronDown, Columns3, Database, FileSpreadsheet, Hash, Rows3 } from 'lucide-react';
import { summarizeDataset } from '../../lib/dataset';
import { listDatasets } from '../../lib/db';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { BarList, FilterSelect, KpiCard, Panel } from './ui';

/* ------------------------------------------------------------------ *
 * Data Sets tab — schema-agnostic analytics for whatever file the
 * Super Admin uploaded. Types are inferred per column, so numbers
 * get sum/avg/min/max and categories get frequency breakdowns
 * without the file needing to follow any fixed format.
 * ------------------------------------------------------------------ */

const PREVIEW_ROWS = 10;
const TYPE_TONES = {
  number: 'bg-blue-50 text-blue-700',
  date: 'bg-purple-50 text-purple-700',
  text: 'bg-gray-100 text-gray-600'
};

function fmtNum(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtCount(n) {
  return Number(n || 0).toLocaleString();
}

function fmtWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function fileExt(name) {
  const ext = String(name || '').split('.').pop();
  return ext && ext !== name ? ext.toUpperCase() : 'FILE';
}

/* ------------------------------------------------------------------ *
 * Dataset picker
 *
 * File names are often long, so the closed control truncates them and
 * the open list shows the same name plus row/column metadata and the
 * file type. A custom popover keeps the trigger compact on every
 * screen instead of letting a native <select> widen the whole row.
 * ------------------------------------------------------------------ */
function DatasetSelect({ datasets, value, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const triggerRef = useRef(null);
  const selected = datasets.find((d) => d.id === value) || null;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative w-full sm:w-[26rem]" ref={boxRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose uploaded data set"
        className={`flex w-full items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left shadow-sm transition-all ${
          open
            ? 'border-brand-500 ring-2 ring-brand-500/20'
            : 'border-gray-200 hover:border-brand-300 hover:shadow-md'
        }`}
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Uploaded data set
          </span>
          <span className="block truncate text-sm font-bold text-navy-900" title={selected?.name}>
            {selected?.name || 'Choose a data set'}
          </span>
          {selected && (
            <span className="mt-0.5 block truncate text-[11px] text-gray-500">
              {(selected.rows?.length || 0).toLocaleString()} rows ·{' '}
              {selected.columns?.length || 0} columns · saved {fmtWhen(selected.uploadedAt)}
            </span>
          )}
        </span>
        {selected && (
          <span className="hidden flex-none rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 sm:inline">
            {fileExt(selected.name)}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 flex-none text-gray-400 transition-transform ${
            open ? 'rotate-180 text-brand-600' : ''
          }`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Uploaded data sets"
          className="absolute left-0 right-0 z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl shadow-navy-900/10 ring-1 ring-black/5"
          style={{ animation: 'pop-in 0.14s ease-out' }}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {datasets.length} saved {datasets.length === 1 ? 'set' : 'sets'}
          </p>
          {datasets.map((ds) => {
            const active = ds.id === value;
            return (
              <button
                key={ds.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(ds.id);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                title={ds.name}
                className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                  active ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg ${
                    active ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      active ? 'text-brand-700' : 'text-navy-900'
                    }`}
                  >
                    {ds.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                    {(ds.rows?.length || 0).toLocaleString()} rows · {ds.columns?.length || 0}{' '}
                    columns · {fmtWhen(ds.uploadedAt)}
                  </span>
                </span>
                <span className="mt-0.5 flex flex-none items-center gap-1.5">
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                    {fileExt(ds.name)}
                  </span>
                  {active && <Check className="h-4 w-4 text-brand-600" strokeWidth={2.5} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DataSetsTab({ initialDataset }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedId, setSelectedId] = useState(initialDataset || '');
  const [loading, setLoading] = useState(true);
  const [breakCol, setBreakCol] = useState('');
  const signatureRef = useRef('');

  /* Background sync only — the page header's Refresh button (Dashboard)
     is the single manual refresh control and fires `rdana:data-changed`,
     which this hook listens for. */
  useAutoRefresh(
    async ({ silent } = {}) => {
      const rows = await listDatasets();
      const sig = rows.map((d) => `${d.id}:${d.uploadedAt || ''}`).join(',');
      if (silent && signatureRef.current === sig) {
        return false;
      }
      signatureRef.current = sig;
      setDatasets(rows);
      setSelectedId((cur) => (rows.some((d) => d.id === cur) ? cur : rows[0]?.id || ''));
      setLoading(false);
      return true;
    },
    { intervalMs: 5000 }
  );

  const selected = datasets.find((d) => d.id === selectedId) || null;
  const summary = useMemo(
    () => (selected ? summarizeDataset(selected.rows, selected.columns) : null),
    [selected]
  );

  const breakable = useMemo(
    () => (summary ? summary.columns.filter((c) => c.type !== 'number' && c.filled > 0) : []),
    [summary]
  );

  useEffect(() => {
    setBreakCol((cur) => (breakable.some((c) => c.name === cur) ? cur : breakable[0]?.name || ''));
  }, [breakable]);

  const breakData = useMemo(() => {
    if (!summary) return [];
    const col = summary.columns.find((c) => c.name === breakCol);
    if (!col) return [];
    const colors = [
      'var(--orange-500)',
      '#1e3a8a',
      '#059669',
      '#7c3aed',
      '#dc2626',
      '#d97706',
      '#0891b2',
      '#4f46e5',
      '#16a34a',
      '#be123c'
    ];
    return col.top.slice(0, 10).map((t, i) => ({
      key: `${col.name}:${t.value}`,
      label: t.value || '(blank)',
      value: t.count,
      color: colors[i % colors.length]
    }));
  }, [summary, breakCol]);

  if (loading) {
    return <div className="empty">Loading…</div>;
  }

  if (!datasets.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Database className="h-6 w-6" strokeWidth={2} />
        </div>
        <p className="mt-3 font-semibold text-navy-900">No data sets uploaded yet.</p>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV or Excel file from the Data Sets page, then come back to explore its
          analytics.
        </p>
        <div className="mt-5">
          <Link
            to="/data-sets"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
          >
            Go to Data Sets
          </Link>
        </div>
      </div>
    );
  }

  const numericCols = summary.columns.filter((c) => c.type === 'number');
  const categoryCols = summary.columns.filter((c) => c.type !== 'number');

  return (
    <div className="space-y-6">
      {/* Dataset picker */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <DatasetSelect datasets={datasets} value={selectedId} onChange={setSelectedId} />
        <Link
          to="/data-sets"
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 sm:self-auto"
        >
          <Database className="h-3.5 w-3.5" strokeWidth={2} />
          Manage data sets
        </Link>
      </div>

      {!selected || !summary ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">Select a data set to analyze.</p>
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Rows3}
              title="Rows"
              value={fmtCount(summary.rowCount)}
              subtext={
                <span className="block truncate" title={selected.name}>
                  {selected.name}
                </span>
              }
              accent="brand"
            />
            <KpiCard icon={Columns3} title="Columns" value={fmtCount(summary.columns.length)} subtext={`${numericCols.length} numeric · ${categoryCols.length} category/date`} accent="navy" />
            <KpiCard icon={Hash} title="Numeric columns" value={fmtCount(numericCols.length)} subtext="Averaged & summed below" accent="blue" />
            <KpiCard icon={BarChart3} title="Category columns" value={fmtCount(categoryCols.length)} subtext="Top values charted below" accent="purple" />
          </div>

          {/* Column summary */}
          <Panel
            title="Column summary"
            subtitle="Types are inferred from the values — numbers get totals, the rest get top values."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="ds-summary-table">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4 font-semibold">Column</th>
                    <th className="py-2 pr-4 font-semibold">Type</th>
                    <th className="py-2 pr-4 font-semibold">Filled</th>
                    <th className="py-2 pr-4 font-semibold">Distinct</th>
                    <th className="py-2 font-semibold">Statistics</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.columns.map((col) => (
                    <tr key={col.name} className="border-b border-gray-100 last:border-0" data-col={col.name}>
                      <td className="py-2.5 pr-4 text-sm font-semibold text-navy-900">{col.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_TONES[col.type]}`}>
                          {col.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-sm text-gray-600">{fmtCount(col.filled)}</td>
                      <td className="py-2.5 pr-4 text-sm text-gray-600">{fmtCount(col.distinct)}</td>
                      <td className="py-2.5 text-sm text-gray-700">
                        {col.type === 'number' && (
                          <span>
                            Σ {fmtNum(col.sum)} · avg {fmtNum(col.avg)} · min {fmtNum(col.min)} · max{' '}
                            {fmtNum(col.max)}
                          </span>
                        )}
                        {col.type === 'date' && (
                          <span>
                            {col.min || '—'} → {col.max || '—'}
                          </span>
                        )}
                        {col.type === 'text' && (
                          <span>
                            {col.top[0] ? `Top: ${col.top[0].value || '(blank)'} × ${fmtCount(col.top[0].count)}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Category breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Top values"
              subtitle="Most frequent entries for the selected column."
              action={
                breakable.length ? (
                  <FilterSelect
                    label="Breakdown column"
                    value={breakCol}
                    onChange={(e) => setBreakCol(e.target.value)}
                    options={breakable.map((c) => c.name)}
                  />
                ) : undefined
              }
            >
              {breakData.length ? (
                <BarList data={breakData} format={(v) => fmtCount(v)} />
              ) : (
                <p className="text-sm text-gray-500">No category columns to break down.</p>
              )}
            </Panel>

            <Panel title="Numeric totals" subtitle="Sum and average per numeric column.">
              {numericCols.length ? (
                <div className="flex flex-col gap-3">
                  {numericCols.map((col) => (
                    <div key={col.name} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-xs font-semibold text-navy-700">{col.name}</span>
                        <span className="text-lg font-extrabold text-navy-900">{fmtNum(col.sum)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-[11px] text-gray-500">
                        <span>avg {fmtNum(col.avg)}</span>
                        <span>
                          {fmtNum(col.min)} – {fmtNum(col.max)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">This file has no numeric columns.</p>
              )}
            </Panel>
          </div>

          {/* Row preview */}
          <Panel
            title="Row preview"
            subtitle={`First ${Math.min(PREVIEW_ROWS, selected.rows.length)} of ${fmtCount(summary.rowCount)} rows.`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" data-testid="ds-preview-table">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    {selected.columns.map((col) => (
                      <th key={col} className="whitespace-nowrap px-3 py-2 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      {selected.columns.map((col) => (
                        <td key={col} className="whitespace-nowrap px-3 py-1.5 text-gray-700">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
