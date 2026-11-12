import { notifyDataChanged } from './refresh';

const ARCHIVE_AGENCIES = {
  deped: {
    id: 'deped',
    code: 'DEPED',
    name: 'Department of Education Division Office',
    shortName: 'DepEd',
    officer: 'Dr. Elena Ramos',
    tone: 'violet',
    focus: 'Educational facilities, classrooms, and learning continuity assessments'
  },
  mho: {
    id: 'mho',
    code: 'MHO',
    name: 'Municipal Health Office',
    shortName: 'MHO',
    officer: 'Dr. Grace Lim',
    tone: 'blue',
    focus: 'Health facilities, medical response, and casualty monitoring'
  },
  omag: {
    id: 'omag',
    code: 'OMAG',
    name: 'Office of the Municipal Agriculturist',
    shortName: 'OMAG',
    officer: 'Ramon Valderama',
    tone: 'green',
    focus: 'Agricultural damage, crops, livestock, and fisheries assessments'
  },
  mswdo: {
    id: 'mswdo',
    code: 'MSWDO',
    name: 'Municipal Social Welfare & Development Office',
    shortName: 'MSWDO',
    officer: 'Teresa Villanueva',
    tone: 'red',
    focus: 'Affected families, evacuation centers, and relief distribution'
  },
  masso: {
    id: 'masso',
    code: 'MASSO',
    name: "Municipal Assessor's Office",
    shortName: 'MASSO',
    officer: 'Carlos Mendoza',
    tone: 'green',
    focus: 'Damaged structures and assessed property valuations'
  },
  meo: {
    id: 'meo',
    code: 'MEO',
    name: 'Municipal Engineering Office',
    shortName: 'MEO',
    officer: 'Engr. Arthur Salazar',
    tone: 'yellow',
    focus: 'Roads, bridges, drainage, and public building inspections'
  },
  mpdo: {
    id: 'mpdo',
    code: 'MPDO',
    name: 'Municipal Planning & Development Office',
    shortName: 'MPDO',
    officer: 'Arch. Diana Cruz',
    tone: 'navy',
    focus: 'Spatial hazard mapping, rehabilitation planning, and GIS layers'
  },
  mdrrmo: {
    id: 'mdrrmo',
    code: 'MDRRMO',
    name: 'MDRRMO Disaster Operations Office',
    shortName: 'MDRRMO',
    officer: 'Engr. Roberto Dizon',
    tone: 'brand',
    focus: 'Consolidated disaster operations, uploaded data sets, and field assessments'
  }
};

export const ARCHIVE_AGENCY_LIST = Object.values(ARCHIVE_AGENCIES);

export const ARCHIVE_STATUS_STYLES = {
  Archived: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Superseded: 'bg-slate-100 text-slate-600 border-slate-200',
  Permanent: 'bg-brand-50 text-brand-700 border-brand-200',
  Retrieved: 'bg-amber-50 text-amber-700 border-amber-200',
  Deleted: 'bg-red-50 text-red-700 border-red-200'
};

/* ------------------------------------------------------------------ *
 * Retrieve — bring an archived record back to active use.
 *
 * The seed records above are static, so retrieved state is persisted in
 * localStorage keyed by record id. Retrieving never deletes the seed
 * record: its status becomes "Retrieved" (original status kept in
 * `originalStatus`) so the move is visible in every archive tab,
 * survives reload, and can be undone with unretrieveArchiveRecord().
 * ------------------------------------------------------------------ */
export const ARCHIVE_RETRIEVED_KEY = 'rdana.archive.retrieved.v1';

function readRetrievedMap() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ARCHIVE_RETRIEVED_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeRetrievedMap(map) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ARCHIVE_RETRIEVED_KEY, JSON.stringify(map));
    }
    notifyDataChanged();
  } catch {
    /* storage unavailable (private mode) — retrieve still works in-memory for this visit */
  }
}

export function getRetrievedMap() {
  return readRetrievedMap();
}

export function isArchiveRetrieved(recordOrId) {
  const id = typeof recordOrId === 'string' ? recordOrId : recordOrId?.id;
  if (!id) return false;
  return Boolean(readRetrievedMap()[id]);
}

export function retrieveArchiveRecord(recordOrId, retrievedBy = '') {
  const id = typeof recordOrId === 'string' ? recordOrId : recordOrId?.id;
  if (!id) return null;
  const map = readRetrievedMap();
  const existing = map[id];
  map[id] = {
    retrievedAt: new Date().toISOString(),
    retrievedBy: retrievedBy || existing?.retrievedBy || '',
    originalStatus: existing?.originalStatus || (typeof recordOrId === 'object' ? recordOrId.status : '') || 'Archived'
  };
  writeRetrievedMap(map);
  return map[id];
}

export function unretrieveArchiveRecord(recordOrId) {
  const id = typeof recordOrId === 'string' ? recordOrId : recordOrId?.id;
  if (!id) return false;
  const map = readRetrievedMap();
  if (!map[id]) return false;
  delete map[id];
  writeRetrievedMap(map);
  return true;
}

export function listRetrievedRecords(agencyId, incidents = []) {
  const map = readRetrievedMap();
  const ids = new Set(Object.keys(map));
  const seed = SEED_RECORDS.map((record) => ({ ...record, source: 'archived' }));
  const filled = incidents
    .map((inc) => filledIncidentToArchiveRecord(inc))
    .filter(Boolean);
  return [...seed, ...filled]
    .filter((record) => ids.has(record.id) && (!agencyId || record.agencyId === agencyId))
    .map((record) => withRetrieved(record, map));
}

function withRetrieved(record, map = readRetrievedMap()) {
  const entry = map[record.id];
  if (!entry || record.status === 'Deleted') {
    return { ...record, retrieved: false, originalStatus: record.status };
  }
  return {
    ...record,
    status: 'Retrieved',
    retrieved: true,
    retrievedAt: entry.retrievedAt || '',
    retrievedBy: entry.retrievedBy || '',
    originalStatus: entry.originalStatus || record.status
  };
}

export const ARCHIVE_TYPE_STYLES = {
  Report: 'bg-blue-50 text-blue-700 border-blue-200',
  Assessment: 'bg-brand-50 text-brand-700 border-brand-200'
};

export function agencyToneClass(tone) {
  const tones = {
    brand: 'bg-brand-500',
    navy: 'bg-navy-700',
    violet: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-emerald-600',
    yellow: 'bg-amber-600',
    red: 'bg-rose-600',
    slate: 'bg-slate-600'
  };
  return tones[tone] || tones.slate;
}

function buildSeedRecords() {
  return [];
}

const SEED_RECORDS = buildSeedRecords();

export function listArchiveRecords(agencyId) {
  const map = readRetrievedMap();
  const list = agencyId
    ? SEED_RECORDS.filter((record) => record.agencyId === agencyId)
    : SEED_RECORDS;
  return list.map((record) => ({ ...withRetrieved(record, map), source: 'archived' }));
}

export function listDatasetArchiveRecords(datasets = []) {
  const map = readRetrievedMap();
  const agency = ARCHIVE_AGENCIES.mdrrmo;
  return datasets
    .filter((ds) => ds && ds.id)
    .map((ds) => {
      const archivedAt = ds.uploadedAt || new Date().toISOString();
      const d = new Date(archivedAt);
      const period = Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const rowCount = Array.isArray(ds.rows) ? ds.rows.length : 0;
      const colCount = Array.isArray(ds.columns) ? ds.columns.length : 0;
      const summary = `Uploaded analytics data set (${rowCount.toLocaleString()} rows · ${colCount} columns).`;
      return withRetrieved(
        {
          id: `DATASET-${ds.id}`,
          datasetId: ds.id,
          source: 'dataset',
          agencyId: agency.id,
          agencyCode: agency.code,
          agencyName: agency.name,
          agencyShortName: agency.shortName,
          agencyTone: agency.tone,
          type: 'Report',
          form: 'Uploaded Data Set',
          title: ds.name || 'Uploaded Data Set',
          reference: ds.id,
          incident: ds.name || 'Uploaded Data Set',
          period,
          archivedAt,
          archivedBy: 'Super Admin · Crissalen Danao',
          status: 'Archived',
          retention: 'Retain until 2033',
          files: 1,
          summary,
          highlights: summary,
          access: 'Visible to MDRRMO and Super Admin'
        },
        map
      );
    })
    .sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
}

/* ------------------------------------------------------------------ *
 * Filled Forms — real assessments saved on this device (Dexie
 * `incidents`: Phase 1, Phase 2, Agriculture, Building Structure).
 * These are included in the Archive alongside the seed records, so the
 * archive is the complete institutional memory, not just demo data.
 * Empty/untitled drafts are excluded — only filled forms appear.
 * ------------------------------------------------------------------ */

function agencyForText(text) {
  const raw = String(text || '').toUpperCase();
  if (!raw.trim()) return null;
  return (
    ARCHIVE_AGENCY_LIST.find(
      (agency) =>
        raw.includes(agency.code) ||
        raw.includes(agency.id.toUpperCase()) ||
        raw.includes(agency.shortName.toUpperCase())
    ) || null
  );
}

function hasValue(v) {
  return v !== '' && v != null && String(v).trim() !== '';
}

export function isFilledIncident(inc) {
  if (!inc) return false;
  const type = inc.formType || 'phase1';

  /* Building Structure and Agriculture forms are no longer part of the
     RDANA workflow, so their legacy records stay out of the Archive. */
  if (type === 'building' || type === 'agriculture') return false;

  if (type === 'phase2') {
    const h = inc.header || {};
    const s2 = inc.s2 || {};
    return Boolean(
      h.incidentName ||
        h.areaAssessed ||
        h.affectedMunicipality ||
        h.reportDate ||
        s2.personsAffected ||
        s2.familiesAffected ||
        s2.personsDisplaced ||
        s2.familiesDisplaced
    );
  }

  /* Phase 1 */
  const p = inc.profile || {};
  const damageFilled = [...(inc.damage?.structures || []), ...(inc.damage?.barangays || [])].some(
    (r) =>
      hasValue(r.barangay) ||
      hasValue(r.buildingName) ||
      hasValue(r.damageLevel) ||
      hasValue(r.units) ||
      hasValue(r.estimatedCost) ||
      hasValue(r.damagedHouses) ||
      hasValue(r.affectedFamilies) ||
      hasValue(r.remarks)
  );
  const effectsFilled = Object.values(inc.initialEffects || {}).some(
    (m) => m && (hasValue(m.total) || hasValue(m.men) || hasValue(m.women))
  );
  const lifelineFilled = (inc.lifelines || []).some((l) => hasValue(l.status) || hasValue(l.observation));
  const issueFilled = (inc.issues || []).some((i) => hasValue(i.healthIssue) || hasValue(i.nonHealthIssue));
  const actionFilled = (inc.responseActions || []).some(
    (a) => hasValue(a.groupInvolved) || hasValue(a.assetsDeployed) || hasValue(a.familiesServed)
  );
  return Boolean(
    p.siteLocation ||
      p.barangay ||
      p.municipality ||
      p.incidentName ||
      p.summary ||
      p.occurrenceTime ||
      (Array.isArray(p.disasterTypes) && p.disasterTypes.length) ||
      damageFilled ||
      effectsFilled ||
      lifelineFilled ||
      issueFilled ||
      actionFilled
  );
}

function filledTitle(inc, type) {
  if (type === 'building') return inc.building?.buildingName || 'Untitled building assessment';
  if (type === 'agriculture') return inc.header?.location || inc.header?.typeOfDisaster || 'Untitled agriculture assessment';
  if (type === 'phase2') {
    const h = inc.header || {};
    return h.incidentName || h.areaAssessed || h.affectedMunicipality || 'Untitled assessment';
  }
  const p = inc.profile || {};
  const place = [p.purok, p.barangay, p.municipality, p.province].filter(Boolean).join(', ');
  return place || p.siteLocation || p.incidentName || 'Untitled assessment';
}

function filledIncidentLabel(inc, type) {
  if (type === 'building') return inc.disaster?.calamityType || 'Building Structure Assessment';
  if (type === 'agriculture') return inc.header?.typeOfDisaster || 'Agriculture Disaster Assessment';
  if (type === 'phase2') return inc.header?.incidentName || 'Phase 2 Assessment';
  const types = Array.isArray(inc.profile?.disasterTypes) ? inc.profile.disasterTypes : [];
  return types.length ? types.join(' + ') : 'RDANA Assessment';
}

function filledSummary(inc, type) {
  if (type === 'building') {
    const b = inc.building || {};
    const s = inc.structure || {};
    const co = inc.condition || {};
    const cost = inc.cost?.damageCost || inc.cost?.repairCost || '';
    const parts = [
      b.buildingName,
      inc.disaster?.calamityType,
      s.severity ? `severity ${s.severity}` : '',
      co.usabilityStatus,
      cost ? `damage ₱${cost}` : '',
      b.affectedIndividuals ? `${b.affectedIndividuals} affected` : b.occupants ? `${b.occupants} occupants` : ''
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Filled Building Structure Assessment form saved on this device.';
  }
  if (type === 'agriculture') {
    const h = inc.header || {};
    const parts = [
      h.typeOfDisaster,
      h.location,
      h.affectedFarmers ? `${h.affectedFarmers} farmers affected` : '',
      inc.costing?.estimatedAmount ? `est. ₱${inc.costing.estimatedAmount}` : ''
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Filled Agriculture Disaster Assessment form saved on this device.';
  }
  if (type === 'phase2') {
    const h = inc.header || {};
    const s2 = inc.s2 || {};
    const parts = [
      h.incidentName,
      s2.familiesAffected ? `${s2.familiesAffected} families affected` : '',
      s2.personsAffected ? `${s2.personsAffected} persons affected` : '',
      s2.familiesDisplaced ? `${s2.familiesDisplaced} families displaced` : ''
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Filled Phase 2 (Form 2) assessment saved on this device.';
  }
  const p = inc.profile || {};
  const eff = inc.initialEffects || {};
  const parts = [
    (Array.isArray(p.disasterTypes) ? p.disasterTypes.join(' + ') : ''),
    eff.affected?.total ? `${eff.affected.total} affected` : '',
    eff.displaced?.total ? `${eff.displaced.total} displaced` : '',
    p.summary
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Filled Phase 1 (Form 1) assessment saved on this device.';
}

const FILLED_FORM_META = {
  phase1: { form: 'Form 1 · Phase 1', formName: 'Form 1' },
  phase2: { form: 'Form 2 · Phase 2', formName: 'Form 2' },
  agriculture: { form: 'Agriculture Form', formName: 'Agriculture Form' },
  building: { form: 'Building Form · Building Structure', formName: 'Building Form' }
};

export function filledIncidentToArchiveRecord(inc) {
  if (!inc || !isFilledIncident(inc)) return null;
  const type = inc.formType || 'phase1';
  const meta = FILLED_FORM_META[type] || FILLED_FORM_META.phase1;

  const agencyHint =
    (type === 'building' && inc.assessment?.office) ||
    (type === 'agriculture' && 'OMAG') ||
    (type === 'phase2' && inc.header?.participatingAgencies?.[0]?.name) ||
    (type === 'phase1' && inc.responseActions?.[0]?.groupInvolved) ||
    '';
  const agency = agencyForText(agencyHint) || ARCHIVE_AGENCIES.mdrrmo;

  const isDeleted = Boolean(inc.deletedAt);
  /* Deleted records sort by deletedAt so the most recently deleted
     form is on top of the Archive (and of the Deleted filter). */
  const archivedAt = inc.deletedAt || inc.updatedAt || inc.createdAt || new Date().toISOString();
  const period = (() => {
    const d = new Date(archivedAt);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  })();
  const assessorName =
    (type === 'building' && inc.assessment?.assessorName) ||
    (type === 'building' && inc.assessment?.office) ||
    agency.officer;

  return {
    id: `FILLED-${inc.id}`,
    incidentId: inc.id,
    formType: type,
    source: 'filled-form',
    agencyId: agency.id,
    agencyCode: agency.code,
    agencyName: agency.name,
    agencyShortName: agency.shortName,
    agencyTone: agency.tone,
    type: 'Assessment',
    form: meta.form,
    title: filledTitle(inc, type),
    reference: inc.caseId || inc.id,
    incident: filledIncidentLabel(inc, type),
    period,
    archivedAt,
    archivedBy: assessorName,
    status: isDeleted ? 'Deleted' : 'Archived',
    deletedAt: inc.deletedAt || '',
    retention: 'Retain until 2033',
    files: 1,
    summary: isDeleted ? `Deleted: ${filledSummary(inc, type)}` : filledSummary(inc, type),
    highlights: filledSummary(inc, type),
    access: `Visible to ${agency.code} and Super Admin only`
  };
}

export function listFilledArchiveRecords(incidents = []) {
  const map = readRetrievedMap();
  return incidents
    .map((inc) => filledIncidentToArchiveRecord(inc))
    .filter(Boolean)
    .map((record) => withRetrieved(record, map))
    .sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
}

export function mergeArchiveRecords(seedRecords = [], filledRecords = []) {
  const byId = new Map();
  for (const record of [...filledRecords, ...seedRecords]) {
    if (!byId.has(record.id)) byId.set(record.id, record);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );
}

export function getArchiveAgency(agencyId) {
  return ARCHIVE_AGENCIES[agencyId] || null;
}

export function archiveCountsByAgency(records) {
  return records.reduce((acc, record) => {
    acc[record.agencyId] = (acc[record.agencyId] || 0) + 1;
    return acc;
  }, {});
}
