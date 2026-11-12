/* ------------------------------------------------------------------ *
 * Small helpers for repeatable-table rows.
 *
 * Every removal in this app follows the same shape: drop the row at
 * index i, and be able to put it back if the assessor changes their
 * mind within the undo window. Keeping that logic here means the Form 1
 * store handlers and the Form 2 path handlers stay one-liners.
 * ------------------------------------------------------------------ */

/** Splice a row back in at the index it came from. Out-of-range indices
 *  (the list shrank in the meantime) fall back to appending. */
export function insertAt(list, i, row) {
  const arr = Array.isArray(list) ? list.slice() : [];
  if (typeof i !== 'number' || i < 0 || i > arr.length) return [...arr, row];
  arr.splice(i, 0, row);
  return arr;
}

/** Keys that can identify a row for the "Removed …" toast wording, in
 *  priority order. Falls back to a generic label for blank rows. */
const LABEL_KEYS = [
  'label',
  'needs',
  'assessedNeeds',
  'donorSource',
  'facilityName',
  'bridgeName',
  'bridge',
  'item',
  'areaLocation',
  'classification',
  'groupInvolved',
  'healthIssue',
  'nonHealthIssue',
  'buildingType',
  'buildingName',
  'barangay',
  'description'
];

/** Human-readable identity for a row, used in undo messages. */
export function rowLabel(row, fallback = 'row') {
  if (!row) return fallback;
  for (const k of LABEL_KEYS) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 60);
  }
  return fallback;
}