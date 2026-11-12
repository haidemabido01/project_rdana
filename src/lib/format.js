export function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 6) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function toLocalInput(d) {
  const dt = new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

/* ------------------------------------------------------------------ *
 * 24-hour (military) time.
 *
 * The native date/time controls render in the browser locale, which is
 * 12-hour AM/PM on most phones. The forms therefore pick the hour from
 * an explicit 00-23 list so every assessor writes the same 24-hour
 * clock, and every printed report reads back the same way.
 * ------------------------------------------------------------------ */

export const MILITARY_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MILITARY_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/* Splits a stored "YYYY-MM-DDTHH:mm" value into its parts. An empty
   hour/minute means the time was never filled in. A value that carries
   a timezone (imported or demo records) is shown in local time. */
export function militaryParts(v) {
  const s = v || '';
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s);
  if (!m) return { date: '', hour: '', minute: '' };
  if (/[Zz]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const p = (n) => String(n).padStart(2, '0');
      return {
        date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
        hour: p(d.getHours()),
        minute: p(d.getMinutes())
      };
    }
  }
  return { date: m[1], hour: m[2] || '', minute: m[3] || '' };
}

/* Rebuilds the stored value. A missing hour or minute falls back to
   00 so the record always holds a complete timestamp. */
export function militaryValue(date, hour, minute) {
  if (!date) return '';
  const h = hour === '' || hour == null ? '00' : hour;
  const m = minute === '' || minute == null ? '00' : minute;
  return `${date}T${h}:${m}`;
}

/* Today's date as YYYY-MM-DD, used when a time is picked before a date. */
export function todayLocalISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* 24-hour clock, e.g. "14:30". */
export function fmtMilitary(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function displayDT(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const date = d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  return `${date}, ${fmtMilitary(d)}`;
}

export function fmtNum(v) {
  const n = Number(v);
  return v !== '' && v != null && Number.isFinite(n) ? n.toLocaleString() : '—';
}

export function composeSitePlace(profile = {}) {
  return [profile.purok, profile.barangay, profile.municipality, profile.province]
    .filter((x) => x && String(x).trim())
    .join(', ');
}