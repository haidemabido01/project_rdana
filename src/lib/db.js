import Dexie from 'dexie';

export const db = new Dexie('rdana-form1');

db.version(1).stores({
  incidents: 'id, updatedAt, createdAt'
});

export async function saveIncident(incident) {
  const record = { ...incident, updatedAt: new Date().toISOString() };
  await db.incidents.put(record);
  return record;
}

export async function getIncident(id) {
  return db.incidents.get(id);
}

export async function listIncidents() {
  return db.incidents.orderBy('updatedAt').reverse().toArray();
}

export async function deleteIncident(id) {
  return db.incidents.delete(id);
}