import Dexie from 'dexie';
import { notifyDataChanged } from './refresh';

export function emitDataChanged() {
  notifyDataChanged();
}

export const db = new Dexie('rdana-form1');

db.version(1).stores({
  incidents: 'id, updatedAt, createdAt'
});

// v2 introduces the formType discriminator (one shared store for Phase 1 + Phase 2
// records) and the deferred caseId seam. Existing v1 records are all Phase 1.
db.version(2)
  .stores({
    incidents: 'id, formType, updatedAt, createdAt'
  })
  .upgrade(async (tx) => {
    await tx
      .table('incidents')
      .toCollection()
      .modify((rec) => {
        if (!rec.formType) rec.formType = 'phase1';
        if (rec.caseId === undefined) rec.caseId = '';
        if (rec.profile && !Array.isArray(rec.profile.disasterTypes)) {
          rec.profile.disasterTypes = rec.profile.disasterType ? [rec.profile.disasterType] : [];
        }
      });
  });

export async function saveIncident(incident) {
  const record = { ...incident, updatedAt: new Date().toISOString() };
  await db.incidents.put(record);
  emitDataChanged();
  return record;
}

export async function getIncident(id) {
  return db.incidents.get(id);
}

/* Latest information must be on top: every list is returned newest-first
   (updatedAt descending). The previous `.reverse()` after a reversed query
   flipped the list back to oldest-first, burying the just-saved Building
   Structure assessment at the bottom of the Assessments list and the
   Disaster Situation Overview. */
export function sortLatestFirst(rows = []) {
  return [...rows].sort((a, b) => {
    const ta = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
    const tb = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
    return ta - tb;
  });
}

/* Soft-delete: a deleted assessment is kept (deletedAt set) so it can
   appear in Archive as Deleted — recent Deleted on top — and be
   restored. Active lists (Assessments, Dashboard, Reports) exclude it. */
export function isDeletedIncident(inc) {
  return Boolean(inc?.deletedAt);
}

export function sortDeletedLatestFirst(rows = []) {
  return [...rows].sort((a, b) => {
    const ta = new Date(b.deletedAt || b.updatedAt || 0).getTime() || 0;
    const tb = new Date(a.deletedAt || a.updatedAt || 0).getTime() || 0;
    return ta - tb;
  });
}

export async function listIncidents(formType) {
  const rows = formType
    ? await db.incidents.where('formType').equals(formType).toArray()
    : await db.incidents.toArray();
  return sortLatestFirst(rows.filter((row) => !isDeletedIncident(row)));
}

export async function listDeletedIncidents(formType) {
  const rows = formType
    ? await db.incidents.where('formType').equals(formType).toArray()
    : await db.incidents.toArray();
  return sortDeletedLatestFirst(rows.filter((row) => isDeletedIncident(row)));
}

export async function listAllIncidents(formType) {
  const rows = formType
    ? await db.incidents.where('formType').equals(formType).toArray()
    : await db.incidents.toArray();
  return sortLatestFirst(rows);
}

export async function deleteIncident(id) {
  const found = await db.incidents.get(id);
  if (!found) return null;
  if (isDeletedIncident(found)) return found;
  const now = new Date().toISOString();
  const record = { ...found, deletedAt: now, updatedAt: now };
  await db.incidents.put(record);
  emitDataChanged();
  return record;
}

export async function restoreIncident(id) {
  const found = await db.incidents.get(id);
  if (!found) return null;
  const record = { ...found, deletedAt: null, updatedAt: new Date().toISOString() };
  await db.incidents.put(record);
  emitDataChanged();
  return record;
}

export async function permanentlyDeleteIncident(id) {
  await db.incidents.delete(id);
  emitDataChanged();
}

/* ------------------------------------------------------------------ *
 * Data sets — CSV/Excel files uploaded by the Super Admin and parsed
 * into rows + columns for the Data Sets analytics tab.
 * ------------------------------------------------------------------ */
db.version(3).stores({
  incidents: 'id, formType, updatedAt, createdAt',
  datasets: 'id, name, uploadedAt'
});

export async function saveDataset(dataset) {
  const record = { ...dataset, uploadedAt: new Date().toISOString() };
  await db.datasets.put(record);
  emitDataChanged();
  return record;
}

export async function listDatasets() {
  return db.datasets.orderBy('uploadedAt').reverse().toArray();
}

export async function deleteDataset(id) {
  await db.datasets.delete(id);
  emitDataChanged();
}

/* Danger — wipes every saved form (including soft-deleted ones) and every
   uploaded data set on this device. Used before a fresh test run. */
export async function clearAllData() {
  await db.transaction('rw', db.incidents, db.datasets, async () => {
    await db.incidents.clear();
    await db.datasets.clear();
  });
  emitDataChanged();
}

/* v4 — soft-delete seam (deletedAt). Existing records are not deleted. */
db.version(4).stores({
  incidents: 'id, formType, updatedAt, createdAt, deletedAt',
  datasets: 'id, name, uploadedAt'
});