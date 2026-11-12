/* ------------------------------------------------------------------ *
 * Service-level analytics.
 *
 * The dashboard shows four panels — housing damage, lifeline status,
 * health & relief, and agency reporting. This module turns the stored
 * RDANA records into the numbers those panels need. It is pure, like
 * analytics.js, so the same figures back the screen and the printout.
 * ------------------------------------------------------------------ */

import { formTypeOf, incidentPlace, isFilledBuilding } from './analytics';
import { DAMAGE_WEIGHT, numOr } from './damage';

/* The lifelines the "Roads, Bridges & Essential Services" panel
   reports on. The keys are the Form 1 lifeline labels. */
export const SERVICE_LIFELINES = [
  { key: 'Roads and Bridges', label: 'Roads & Bridges' },
  { key: 'Electricity', label: 'Electricity' },
  { key: 'Communication Network', label: 'Communication' },
  { key: 'Water Supply System', label: 'Water Supply' }
];

/* How long a team is assumed to spend on one paper RDANA form. Used
   as the baseline the digital turnaround is measured against. */
export const MANUAL_MINUTES_PER_FORM = 240;

/* The Form 1 lifeline status values, mapped to a tone for the pills. */
export const LIFELINE_TONES = {
  Operational: 'green',
  Intermittent: 'yellow',
  'Partially damaged': 'orange',
  'Non-operational': 'red'
};

const placeOf = (inc) => incidentPlace(inc);

const areaLabel = (inc) => {
  if (formTypeOf(inc) === 'building') {
    const b = inc.building || {};
    const place = placeOf(inc);
    return b.buildingName
      ? `${b.buildingName}${place.barangay ? ` (${place.barangay})` : ''}`
      : place.barangay || 'Building Assessment';
  }
  const p = placeOf(inc);
  return p.barangay || p.purok || p.municipality || inc.profile?.siteLocation || 'Unnamed area';
};

const lifelineOf = (inc, key) =>
  (inc.lifelines || []).find((l) => l.label === key && (l.status || l.observation));

/* ------------------------------------------------------------------ *
 * Housing damage — how much is repairable and how much is a total loss
 * ------------------------------------------------------------------ */
function buildHousing(incidents) {
  let partially = 0;
  let totally = 0;
  let fromProfile = false;
  let buildingPartially = 0;
  let buildingTotally = 0;

  for (const inc of incidents) {
    if (formTypeOf(inc) === 'building') {
      if (!isFilledBuilding(inc)) continue;
      const isTotal = String(inc.structure?.severity || '').trim().toLowerCase() === 'totally';
      if (isTotal) {
        totally += 1;
        buildingTotally += 1;
      } else {
        partially += 1;
        buildingPartially += 1;
      }
      continue;
    }
    for (const p of inc.damage?.barangays || []) {
      if (p.partiallyDamaged !== '' && p.partiallyDamaged != null) {
        partially += numOr(p.partiallyDamaged);
        fromProfile = true;
      }
      if (p.totallyDamaged !== '' && p.totallyDamaged != null) {
        totally += numOr(p.totallyDamaged);
        fromProfile = true;
      }
    }
  }

  if (!fromProfile) {
    /* No barangay profile — read the split off the damage register. */
    for (const inc of incidents) {
      if (formTypeOf(inc) === 'building') continue;
      for (const s of inc.damage?.structures || []) {
        const w = DAMAGE_WEIGHT[s.damageLevel];
        if (w === undefined) continue;
        if (s.damageLevel === 'Totally Damaged') totally += numOr(s.units);
        else if (w > 0) partially += numOr(s.units);
      }
    }
  }

  const total = partially + totally;
  return {
    partiallyDamaged: partially,
    totallyDamaged: totally,
    total,
    buildingPartially,
    buildingTotally,
    partialPct: total > 0 ? (partially / total) * 100 : 0,
    totalPct: total > 0 ? (totally / total) * 100 : 0
  };
}

/* ------------------------------------------------------------------ *
 * Lifelines — status per reporting area
 * ------------------------------------------------------------------ */
function buildLifelines(incidents) {
  const rows = [];
  const counts = new Map();

  for (const svc of SERVICE_LIFELINES) counts.set(svc.key, { reported: 0, byStatus: new Map() });

  for (const inc of incidents) {
    /* Building Structure forms have no lifeline section — including them
       added blank rows to the Damage & Services table and hid the real
       per-area status. Housing impact from buildings is counted in
       buildHousing / buildingTotals instead. */
    if (formTypeOf(inc) === 'building') continue;
    const place = placeOf(inc);
    const row = { area: areaLabel(inc), municipality: place.municipality, incidentId: inc.id };

    for (const svc of SERVICE_LIFELINES) {
      const ll = lifelineOf(inc, svc.key);
      const status = ll?.status || '';
      row[svc.key] = status;
      if (status) {
        const c = counts.get(svc.key);
        c.reported += 1;
        c.byStatus.set(status, (c.byStatus.get(status) || 0) + 1);
      }
    }
    rows.push(row);
  }

  const summary = SERVICE_LIFELINES.map((svc) => {
    const c = counts.get(svc.key);
    const byStatus = c.byStatus;
    const down = byStatus.get('Non-operational') || 0;
    const partial = byStatus.get('Partially damaged') || 0;
    const operational = byStatus.get('Operational') || 0;

    let subtext = 'No status recorded';
    if (c.reported > 0) {
      const parts = [];
      if (operational) parts.push(`${operational} operational`);
      if (partial) parts.push(`${partial} partially damaged`);
      if (down) parts.push(`${down} non-operational`);
      subtext = parts.length ? parts.join(' · ') : `${c.reported} assessed`;
    }

    return {
      key: svc.key,
      label: svc.label,
      value: c.reported > 0 ? `${operational}/${c.reported}` : '—',
      subtext,
      reported: c.reported,
      operational,
      partial,
      down
    };
  });

  return { summary, rows };
}

/* ------------------------------------------------------------------ *
 * Health & relief
 * ------------------------------------------------------------------ */
function buildHealth(incidents) {
  const byArea = new Map();
  let injured = 0;
  let dead = 0;

  for (const inc of incidents) {
    const eff = inc.initialEffects || {};
    injured += numOr(eff.injured?.total);
    dead += numOr(eff.dead?.total);

    const area = areaLabel(inc);
    const entries = (inc.issues || []).filter((i) => (i.healthIssue || '').trim());
    if (!entries.length) continue;
    const cur = byArea.get(area) || { label: area, value: 0, notes: [] };
    cur.value += entries.length;
    for (const e of entries) cur.notes.push(e.healthIssue.trim());
    byArea.set(area, cur);
  }

  return {
    value: injured + dead,
    subtext: `${injured.toLocaleString()} injured · ${dead.toLocaleString()} dead`,
    byArea: [...byArea.values()].sort((a, b) => b.value - a.value)
  };
}

/* The four relief quadrants, each fed by one or more RDANA clusters. */
const RELIEF_CLUSTERS = [
  { key: 'foodNfi', label: 'Food & Non-Food Items', cluster: ['foodNfi'] },
  { key: 'safeWater', label: 'Safe Water', cluster: ['washHealth'] },
  { key: 'shelter', label: 'Shelter & Protection', cluster: ['campShelter', 'permShelterLive'] },
  { key: 'medical', label: 'Medical Supplies', cluster: ['logistics', 'education'] }
];

function buildRelief(incidents) {
  return RELIEF_CLUSTERS.map((q) => {
    let reported = 0;
    const notes = [];

    for (const inc of incidents) {
      if (formTypeOf(inc) === 'building' && q.key === 'shelter' && isFilledBuilding(inc)) {
        const rec = (inc.condition?.recommendedActions || inc.structure?.findings || '').trim();
        if (rec) {
          reported += 1;
          notes.push(rec);
        }
        continue;
      }
      for (const need of inc.needs || []) {
        if (!q.cluster.includes(need.key)) continue;
        const text = (need.priorityNeeds || '').trim();
        if (!text) continue;
        reported += 1;
        notes.push(text);
      }
    }

    return {
      key: q.key,
      label: q.label,
      value: reported,
      subtext: notes.length ? notes[0].slice(0, 90) : 'No priority recorded'
    };
  });
}

/* ------------------------------------------------------------------ *
 * Agency submissions and reporting turnaround
 * ------------------------------------------------------------------ */
function buildAgencies(incidents) {
  const names = new Set();
  let submitted = 0;
  let familiesServed = 0;

  for (const inc of incidents) {
    if (formTypeOf(inc) === 'building') {
      if (!isFilledBuilding(inc)) continue;
      const office = (inc.assessment?.office || '').trim();
      const assessor = (inc.assessment?.assessorName || '').trim();
      if (office || assessor || inc.building?.buildingName) {
        submitted += 1;
        names.add(office || 'MEO');
      }
      const indiv = numOr(inc.building?.affectedIndividuals) || numOr(inc.building?.occupants);
      familiesServed += indiv > 0 ? Math.max(1, Math.ceil(indiv / 5)) : 1;
      continue;
    }
    if (inc.source === 'dataset') {
      submitted += 1;
      names.add('MDRRMO');
      const brgyFamilies = (inc.damage?.barangays || []).reduce(
        (sum, b) => sum + numOr(b.affectedFamilies),
        0
      );
      familiesServed += brgyFamilies || numOr(inc.profile?.affectedFamilies);
      continue;
    }
    const actions = (inc.responseActions || []).filter(
      (a) => (a.groupInvolved || '').trim() || (a.assetsDeployed || '').trim()
    );
    if (actions.length) submitted += 1;
    for (const a of inc.responseActions || []) {
      if ((a.groupInvolved || '').trim()) names.add(a.groupInvolved.trim());
      familiesServed += numOr(a.familiesServed);
    }
  }

  const total = incidents.length;
  const pending = Math.max(0, total - submitted);
  const rate = total > 0 ? (submitted / total) * 100 : 0;

  return {
    total: names.size,
    submitted,
    pending,
    rate,
    familiesServed,
    names: [...names].sort()
  };
}

function buildProcessing(incidents) {
  const minutes = incidents
    .map((inc) => {
      const start = new Date(inc.createdAt).getTime();
      const end = new Date(inc.updatedAt).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
      return Math.max(0, (end - start) / 60000);
    })
    .filter((m) => m !== null);

  const avg = minutes.length ? minutes.reduce((a, b) => a + b, 0) / minutes.length : 0;
  const manual = MANUAL_MINUTES_PER_FORM;
  const digital = Math.min(manual, avg);

  return {
    manualMinutes: manual,
    digitalMinutes: digital,
    savedMinutes: Math.max(0, manual - digital),
    rate: manual > 0 ? (digital / manual) * 100 : 0,
    assessed: minutes.length
  };
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */
export function buildServiceAnalytics(incidents = []) {
  const housing = buildHousing(incidents);
  const lifelines = buildLifelines(incidents);

  return {
    housing,
    lifelines,
    health: buildHealth(incidents),
    relief: buildRelief(incidents),
    agencies: buildAgencies(incidents),
    processing: buildProcessing(incidents)
  };
}
