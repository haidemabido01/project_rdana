import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MILITARY_HOURS,
  MILITARY_MINUTES,
  militaryParts,
  militaryValue,
  todayLocalISO
} from '../lib/format';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const pad2 = (n) => String(n).padStart(2, '0');

function parseISODate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function Field({ label, required, hint, error, children }) {
  return (
    <div className="field">
      {label && (
        <label>
          {label}
          {required && <span className="req"> *</span>}
        </label>
      )}
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export function TextInput(props) {
  return <input type="text" {...props} />;
}

export function NumberInput(props) {
  return <input type="number" min="0" step="any" placeholder="0" inputMode="decimal" {...props} />;
}

export function TextArea(props) {
  return <textarea {...props} />;
}

export function Select({ children, ...props }) {
  return <select {...props}>{children}</select>;
}

export function DateTimeInput(props) {
  return <input type="datetime-local" {...props} />;
}

/* ------------------------------------------------------------------ *
 * Responsive in-app calendar. The browser's native date picker ignores
 * the page layout on phones, so the date is chosen from this dialog
 * instead. It is rendered in a portal, which keeps it above the form
 * card and lets it fit any viewport.
 * ------------------------------------------------------------------ */
export function DatePicker({ id, value, onChange }) {
  const [open, setOpen] = useState(false);
  const initial = parseISODate(value) || new Date();
  const [view, setView] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1)
  );
  const panelRef = useRef(null);

  const selected = parseISODate(value);

  useEffect(() => {
    if (open) return undefined;
    const d = parseISODate(value);
    if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1));
    return undefined;
  }, [value, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = todayLocalISO();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const atCurrentMonth = year === currentYear && month === currentMonth;
  const inFutureMonth = year > currentYear || (year === currentYear && month > currentMonth);

  const shiftMonth = (delta) => setView(new Date(year, month + delta, 1));

  const pick = (iso) => {
    if (!iso || iso > today) return;
    onChange(iso);
    setOpen(false);
  };

  const label = selected
    ? selected.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Select date…';

  return (
    <div className="mt-date">
      <button
        type="button"
        id={id}
        className={`mt-date-btn${selected ? '' : ' is-empty'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          const d = parseISODate(value) || new Date();
          setView(new Date(d.getFullYear(), d.getMonth(), 1));
          setOpen(true);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span>{label}</span>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="mt-cal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="mt-cal" role="dialog" aria-modal="true" aria-label="Choose date" ref={panelRef}>
              <div className="mt-cal-head">
                <button
                  type="button"
                  className="mt-cal-nav"
                  aria-label="Previous month"
                  onClick={() => shiftMonth(-1)}
                >
                  ‹
                </button>
                <span className="mt-cal-title">
                  {MONTHS[month]} {year}
                </span>
                <button
                  type="button"
                  className="mt-cal-nav"
                  aria-label="Next month"
                  disabled={inFutureMonth || atCurrentMonth}
                  onClick={() => shiftMonth(1)}
                >
                  ›
                </button>
              </div>

              <div className="mt-cal-grid mt-cal-weekdays">
                {WEEKDAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              <div className="mt-cal-grid">
                {cells.map((day, i) => {
                  if (!day) return <span key={`e${i}`} className="mt-cal-day is-empty" />;
                  const iso = `${year}-${pad2(month + 1)}-${pad2(day)}`;
                  const future = iso > today;
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`mt-cal-day${value === iso ? ' is-selected' : ''}${
                        iso === today ? ' is-today' : ''
                      }${future ? ' is-future' : ''}`}
                      disabled={future}
                      aria-disabled={future || undefined}
                      title={future ? 'Future dates are not allowed' : undefined}
                      onClick={() => pick(iso)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-cal-foot">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onChange(today);
                    setOpen(false);
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Date + time on a 24-hour (military) clock.
 *
 * The hour is picked from an explicit 00-23 list so the value is kept
 * in the same "YYYY-MM-DDTHH:mm" shape the rest of the app stores.
 * ------------------------------------------------------------------ */
export function MilitaryDateTimeInput({ value = '', onChange, id }) {
  const { date, hour, minute } = militaryParts(value);

  const emit = (d, h, m) => onChange(militaryValue(d, h, m));

  return (
    <div className="mt">
      <DatePicker id={id} value={date} onChange={(d) => emit(d, hour, minute)} />
      <div className="mt-time">
        <select
          aria-label="Hour (24-hour)"
          className="mt-hour"
          value={hour}
          onChange={(e) => emit(date || todayLocalISO(), e.target.value, minute)}
        >
          <option value="">HH</option>
          {MILITARY_HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="mt-sep">:</span>
        <select
          aria-label="Minute"
          className="mt-min"
          value={minute}
          onChange={(e) => emit(date || todayLocalISO(), hour, e.target.value)}
        >
          <option value="">MM</option>
          {MILITARY_MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="mt-unit">24h</span>
      </div>
    </div>
  );
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <label className="check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Multi-select chip group (Type of Disaster, and any future tags).
 * ------------------------------------------------------------------ */
export function ChipToggle({ options, value = [], onChange }) {
  const list = Array.isArray(value) ? value : [];
  const toggle = (opt) =>
    onChange(list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt]);
  return (
    <div className="chips">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`chip chip-pick ${list.includes(opt) ? 'chip-on' : ''}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Yes / No picker. Blank means "not assessed" (the official form only
 * offers Y and N, so there is deliberately no explicit N/A option).
 * ------------------------------------------------------------------ */
export function YesNo({ value, onChange, yes = 'Yes', no = 'No' }) {
  const id = useId();
  return (
    <div className="checks">
      <label className="check">
        <input type="radio" name={id} checked={value === yes} onChange={() => onChange(yes)} />
        <span>{yes}</span>
      </label>
      <label className="check">
        <input type="radio" name={id} checked={value === no} onChange={() => onChange(no)} />
        <span>{no}</span>
      </label>
    </div>
  );
}

const YES_NO_VALUES = ['Yes', 'No'];

/* ------------------------------------------------------------------ *
 * Impact on <sector>: High / Medium / Low / None — a 4-way single pick.
 * ------------------------------------------------------------------ */
export function ImpactScale({ value, onChange }) {
  const opts = ['High', 'Medium', 'Low', 'None'];
  return (
    <div className="seg">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          className={`seg-btn ${value === o ? 'seg-on' : ''}`}
          onClick={() => onChange(value === o ? '' : o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 0-100 percentage with an optional live "sums to 100" cross-check.
 * ------------------------------------------------------------------ */
export function PercentInput({ value, onChange, showSum, sum }) {
  const n = Number(value);
  const has = value !== '' && value != null && Number.isFinite(n);
  const total = Number(sum);
  const off = has && showSum && Number.isFinite(total) && total !== 0 && Math.round(total) !== 100;
  return (
    <div className="pct">
      <NumberInput
        value={value ?? ''}
        min="0"
        max="100"
        step="1"
        inputMode="numeric"
        placeholder="%"
        className={off ? 'is-mismatch' : ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {showSum && (
        <span className={`pct-sum ${off ? 'pct-sum-bad' : ''}`}>
          Σ {Number.isFinite(total) ? Math.round(total) : 0}%
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Collapsible sub-block. Heavy sectors (Health, WASH, Food) are split
 * into named sub-sections so the page is not one long wall of inputs.
 * ------------------------------------------------------------------ */
export function SubSection({ title, subtitle, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`subsec ${open ? 'open' : ''}`}>
      <button type="button" className="subsec-head" onClick={() => setOpen((o) => !o)}>
        <span className="chev">{open ? '▾' : '▸'}</span>
        <span className="grow">
          <b>{title}</b>
          {subtitle && <small className="muted"> {subtitle}</small>}
        </span>
      </button>
      {open && <div className="subsec-body">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Schema-driven cell renderer shared by every Form 2 table.
 * type: text | num | pct | area | select | yn | checks
 * ------------------------------------------------------------------ */
function Cell({ col, value, onChange, sum, rowKey }) {
  const set = (e) => onChange(e.target.value);
  const ph = col.placeholder || '';

  if (col.type === 'area') return <TextArea rows={col.rows || 2} value={value ?? ''} placeholder={ph} onChange={set} />;
  if (col.type === 'num') return <NumberInput value={value ?? ''} placeholder="0" onChange={set} />;
  if (col.type === 'pct')
    return <PercentInput value={value} onChange={onChange} showSum={col.showSum} sum={sum} />;
  if (col.type === 'select')
    return (
      <Select value={value ?? ''} onChange={set}>
        <option value="">{ph || 'Select…'}</option>
        {(col.options || [])
          .filter((o) => o !== '')
          .map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
      </Select>
    );
  if (col.type === 'yn')
    return <YesNo value={value} onChange={onChange} yes={col.yes || 'Yes'} no={col.no || 'No'} placeholder={ph || '—'} />;
  if (col.type === 'radio') {
    const name = `${col.key}-${rowKey ?? 'row'}`;
    return (
      <div className="checks">
        {(col.options || []).map((o) => (
          <label key={o} className="check">
            <input
              type="radio"
              name={name}
              checked={value === o}
              onChange={() => onChange(o)}
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  }
  if (col.type === 'checks') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="checks">
        {(col.options || []).map((o) => (
          <label key={o} className="check">
            <input
              type="checkbox"
              checked={arr.includes(o)}
              onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  }
  return <TextInput value={value ?? ''} placeholder={ph} onChange={set} />;
}

export function cellWidth(col) {
  return col.width ? { width: col.width, minWidth: col.width } : undefined;
}

/* ------------------------------------------------------------------ *
 * Fixed rows (from a preset list) x N columns, rendered as a real
 * table so it reads like the paper form and prints correctly.
 * ------------------------------------------------------------------ */
export function MatrixRows({
  rows,
  columns,
  onChange,
  showHead = true,
  labelKey = 'label',
  labelHead = 'Item',
  sumFor,
  max,
  minWidth
}) {
  const shown = max ? rows.slice(0, max) : rows;
  return (
    <div className="table-wrap">
      <table className="grid" style={minWidth ? { minWidth } : undefined}>
        {showHead && (
          <thead>
            <tr>
              {labelKey && <th className="rowlabel">{labelHead}</th>}
              {columns.map((c) => (
                <th key={c.key} style={cellWidth(c)}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {shown.map((r, i) => (
            <tr key={r.id || r.key || i}>
              {labelKey && <th className="rowlabel">{r[labelKey]}</th>}
              {columns.map((c) => (
                <td key={c.key} style={cellWidth(c)}>
                  <Cell
                    col={c}
                    value={r[c.key]}
                    sum={sumFor ? sumFor(i, c) : undefined}
                    rowKey={r.id || r.key || i}
                    onChange={(v) => onChange(i, c.key, v)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Repeatable rows: one bordered card per record, laid out as a two
 * column grid of label/control pairs. Wide controls (areas) span the
 * full card width.
 * ------------------------------------------------------------------ */
export function RepeatTable({
  rows = [],
  columns,
  onChange,
  onAdd,
  onRemove,
  addLabel = '+ Add row',
  note,
  cols = 2,
  minRows = 1
}) {
  const shown = rows.length > minRows ? rows : rows.length ? rows : rows;
  return (
    <div>
      {shown.length === 0 && <p className="sum-note">No rows yet — use the button below to add one.</p>}
      <div className="repeat">
        {shown.map((r, i) => (
          <div key={r.id || i} className="repeat-item">
            <div className="cellgrid" style={{ '--cols': cols }}>
              {columns.map((c) => (
                <div key={c.key} className={`cell ${c.full ? 'cell-full' : ''}`}>
                  <span className="cell-lbl">{c.label}</span>
                  <Cell col={c} value={r[c.key]} rowKey={r.id || i} onChange={(v) => onChange(i, c.key, v)} />
                </div>
              ))}
            </div>
            <button type="button" title="Remove row" className="btn btn-ghost btn-sm remove" onClick={() => onRemove(i)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={onAdd}>
        {addLabel}
      </button>
      {note && <p className="sum-note">{note}</p>}
    </div>
  );
}

export { Cell, YES_NO_VALUES };