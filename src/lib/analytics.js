/* ------------------------------------------------------------------ *
 * Dashboard analytics.
 *
 * Everything the dashboard shows is derived from the assessments stored
 * on this device — nothing is fetched, so the numbers are available
 * offline. The module is pure: it takes a list of incident records and
 * returns the shapes the Dashboard page renders.
 * ------------------------------------------------------------------ */

import { TAGBINA_BARANGAYS } from './constants';
import {
  CHART_PALETTE,
  DAMAGE_LEVEL_COLORS,
  PRIORITY_COLORS,
  PRIORITY_ORDER,
  SEVERITY_COLORS,
  SEVERITY_ORDER,
  damageLevelTotals,
  isFilledRow,
  num,
  numOr,
  priorityFor,
  priorityScore,
  profileMetrics,
  registerTotals,
  severityFromIndex,
  severityOf,
  structureTypeTotals
} from './damage';

/* Which form does a stored record belong to? Mirrors forms/index.jsx so
   this module stays free of the form registry (and its JSX). */
export function formTypeOf(inc) {
  if (inc?.formType === 'agriculture') return 'agriculture';
  if (inc?.formType === 'building') return 'building';
  return inc?.formType === 'phase2' ? 'phase2' : 'phase1';
}

/* Latest information on top: a row's recency is its save time first
   (updatedAt — bumped on every Building Structure save), then the date
   the assessor entered, then the calamity date. */
export function recencyTime(row) {
  const candidates = [
    row?.updatedAt,
    row?.assessmentDate,
    row?.dateOfCalamity,
    row?.createdAt,
    row?.occurrenceTime
  ];
  for (const c of candidates) {
    if (!c) continue;
    const t = new Date(c).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

export function sortLatestFirst(rows = []) {
  return [...rows].sort((a, b) => recencyTime(b) - recencyTime(a));
}

export function sortIncidentsLatestFirst(incidents = []) {
  return [...incidents].sort(
    (a, b) =>
      recencyTime({
        updatedAt: b.updatedAt,
        createdAt: b.createdAt,
        assessmentDate: b.assessment?.date,
        dateOfCalamity: b.disaster?.dateOfCalamity,
        occurrenceTime: b.profile?.occurrenceTime
      }) -
      recencyTime({
        updatedAt: a.updatedAt,
        createdAt: a.createdAt,
        assessmentDate: a.assessment?.date,
        dateOfCalamity: a.disaster?.dateOfCalamity,
        occurrenceTime: a.profile?.occurrenceTime
      })
  );
}

/* ------------------------------------------------------------------ *
 * Collecting
 * ------------------------------------------------------------------ */

const keyOf = (...parts) => parts.map((p) => (p || '').trim().toLowerCase()).join('||');

function cleanBarangayKey(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(brgy\.?|barangay|bgy\.?)\b/g, '')
    .replace(/\bsta\.?\s+/g, 'santa ')
    .replace(/\bsto\.?\s+/g, 'santo ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CANONICAL_BARANGAYS = TAGBINA_BARANGAYS.map((name) => ({
  name,
  key: cleanBarangayKey(name)
}));

export function resolveBarangayName(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  const cleaned = cleanBarangayKey(trimmed);
  if (!cleaned) return trimmed;
  const exact = CANONICAL_BARANGAYS.find((b) => b.key === cleaned);
  if (exact) return exact.name;
  const contained = CANONICAL_BARANGAYS.find((b) => {
    const re = new RegExp(`(^|\\s)${b.key}(\\s|$)`, 'i');
    return re.test(cleaned);
  });
  return contained ? contained.name : trimmed;
}

export function isFilledBuilding(inc) {
  if (formTypeOf(inc) !== 'building') return false;
  const b = inc.building || {};
  const d = inc.disaster || {};
  const c = inc.classification || {};
  const s = inc.structure || {};
  const co = inc.condition || {};
  const cost = inc.cost || {};
  const a = inc.assessment || {};
  return Boolean(
    b.buildingName ||
      b.barangay ||
      b.municipality ||
      b.occupants ||
      b.affectedIndividuals ||
      d.calamityType ||
      d.impactDescription ||
      c.buildingClassification ||
      s.severity ||
      s.findings ||
      (Array.isArray(s.components) && s.components.length > 0) ||
      co.usabilityStatus ||
      co.recommendedActions ||
      cost.damageCost ||
      cost.repairCost ||
      a.assessorName ||
      a.office
  );
}

export function incidentPlace(inc) {
  if (formTypeOf(inc) === 'building') {
    const b = inc.building || {};
    const resolvedBrgy = resolveBarangayName(b.barangay);
    return {
      region: '',
      province: b.province || 'Surigao del Sur',
      municipality: b.municipality || 'Tagbina',
      barangay: resolvedBrgy || 'Poblacion',
      purok: b.purok || ''
    };
  }
  const p = inc.profile || {};
  return {
    region: p.region || '',
    province: p.province || '',
    municipality: p.municipality || '',
    barangay: resolveBarangayName(p.barangay),
    purok: p.purok || ''
  };
}

/* A building displaces its occupants unless it is explicitly Safe/Usable
   with only Minor damage. The old rule (Unsafe / Severe / Totally only)
   left Restricted-Use and Moderate buildings at zero displaced, so the
   Displaced Persons card looked frozen after a Building Structure save. */
export function isBuildingDisplaced(inc) {
  const sev = String(inc.structure?.severity || '').trim().toLowerCase();
  const usability = String(inc.condition?.usabilityStatus || '').trim().toLowerCase();
  if (usability.includes('unsafe') || usability.includes('restricted')) return true;
  if (sev === 'totally' || sev === 'severe' || sev === 'moderate') return true;
  if (usability.includes('safe') || sev === 'minor') return false;
  return Boolean(sev || usability);
}

export function buildingAffectedIndividuals(inc) {
  const b = inc.building || {};
  return numOr(b.affectedIndividuals) || numOr(b.occupants);
}

export function buildingFamilies(inc) {
  const indiv = buildingAffectedIndividuals(inc);
  /* A damaged building with no occupant count still represents at least
     one affected family, so the Families card and the ranking chart move
     on save even when Occupants/Affected are left blank. */
  return indiv > 0 ? Math.max(1, Math.ceil(indiv / 5)) : 1;
}

export function buildingCost(inc) {
  const damage = numOr(inc.cost?.damageCost);
  const repair = numOr(inc.cost?.repairCost);
  return damage || repair;
}

export function incidentDisasterTypes(inc) {
  if (formTypeOf(inc) === 'building') {
    const t = String(inc.disaster?.calamityType || '').trim();
    return t ? [t] : ['Earthquake'];
  }
  return Array.isArray(inc.profile?.disasterTypes) ? inc.profile.disasterTypes : [];
}

/** Every damage register row across the assessments, with its context. */
export function collectRegisterRows(incidents = []) {
  const rows = [];
  for (const inc of sortIncidentsLatestFirst(incidents)) {
    const type = formTypeOf(inc);
    const place = incidentPlace(inc);
    const count = Number(inc.assessmentCount) || 1;
    if (type === 'building') {
      if (!isFilledBuilding(inc)) continue;
      const b = inc.building || {};
      const d = inc.disaster || {};
      const c = inc.classification || {};
      const s = inc.structure || {};
      const co = inc.condition || {};
      const a = inc.assessment || {};
      const damageCost = numOr(inc.cost?.damageCost);
      const repairCost = numOr(inc.cost?.repairCost);
      const cost = damageCost || repairCost;
      const sev = String(s.severity || '').toLowerCase();
      const usability = String(co.usabilityStatus || '').toLowerCase();
      const damageLevel =
        sev === 'totally'
          ? 'Totally Damaged'
          : sev === 'severe' || usability.includes('unsafe')
          ? 'Severe'
          : sev === 'moderate' || usability.includes('restricted')
          ? 'Moderate'
          : 'Low';
      rows.push({
        id: `${inc.id}-reg`,
        incidentId: inc.id,
        formType: 'building',
        assessmentCount: count,
        incidentTitle: b.buildingName || place.barangay || 'Building Assessment',
        barangay: place.barangay,
        purok: place.purok,
        municipality: place.municipality,
        province: place.province,
        buildingType: c.buildingClassification || b.buildingOccupancy || 'Residential House',
        buildingName: b.buildingName || 'Assessed Building',
        structureType: b.buildingType || c.buildingType || 'Concrete (Reinforced Concrete / CHB)',
        floors: b.floors || '',
        occupants: numOr(b.occupants),
        affectedIndividuals: numOr(b.affectedIndividuals) || numOr(b.occupants),
        damageLevel,
        severityRaw: s.severity || '',
        usabilityStatus: co.usabilityStatus || '',
        recommendedActions: co.recommendedActions || '',
        components: Array.isArray(s.components) ? s.components : [],
        otherComponent: s.otherComponent || '',
        calamityType: d.calamityType || 'Earthquake',
        dateOfCalamity: d.dateOfCalamity || '',
        magnitude: d.magnitude || '',
        intensity: d.intensity || '',
        windSignal: d.windSignal || '',
        rainfallWarning: d.rainfallWarning || '',
        impactDescription: d.impactDescription || '',
        units: 1,
        estimatedCost: cost,
        damageCost,
        repairCost,
        assessorName: a.assessorName || '',
        office: a.office || '',
        designation: a.designation || '',
        assessmentDate: a.date || '',
        updatedAt: inc.updatedAt || '',
        createdAt: inc.createdAt || '',
        remarks: s.findings || co.recommendedActions || d.impactDescription || ''
      });
      continue;
    }
    if (type !== 'phase1') continue;
    const structures = inc.damage?.structures || [];
    for (const s of structures) {
      if (!isFilledRow(s)) continue;
      rows.push({
        ...s,
        incidentId: inc.id,
        formType: 'phase1',
        assessmentCount: count,
        incidentTitle: inc.profile?.siteLocation || place.barangay || 'Assessment',
        barangay: resolveBarangayName(s.barangay) || place.barangay,
        purok: s.purok || place.purok,
        municipality: place.municipality,
        province: place.province,
        updatedAt: inc.updatedAt || '',
        createdAt: inc.createdAt || '',
        occurrenceTime: inc.profile?.occurrenceTime || ''
      });
    }
  }
  return sortLatestFirst(rows);
}

/** Every barangay damage profile row across the assessments. */
export function collectProfileRows(incidents = []) {
  const rows = [];
  for (const inc of sortIncidentsLatestFirst(incidents)) {
    const type = formTypeOf(inc);
    const place = incidentPlace(inc);
    const count = Number(inc.assessmentCount) || 1;
    if (type === 'building') {
      if (!isFilledBuilding(inc)) continue;
      const b = inc.building || {};
      const cost = numOr(inc.cost?.damageCost) || numOr(inc.cost?.repairCost);
      const isTotal = String(inc.structure?.severity || '').toLowerCase() === 'totally';
      const indiv = numOr(b.affectedIndividuals) || numOr(b.occupants);
      const families = indiv > 0 ? Math.max(1, Math.ceil(indiv / 5)) : 1;
      rows.push({
        id: `${inc.id}-prof`,
        incidentId: inc.id,
        formType: 'building',
        assessmentCount: count,
        barangay: place.barangay,
        purok: place.purok,
        municipality: place.municipality,
        province: place.province,
        totalHouses: 1,
        damagedHouses: 1,
        totallyDamaged: isTotal ? 1 : 0,
        partiallyDamaged: isTotal ? 0 : 1,
        affectedFamilies: families,
        estimatedCost: cost,
        assessmentDate: inc.assessment?.date || '',
        updatedAt: inc.updatedAt || '',
        createdAt: inc.createdAt || '',
        remarks: b.buildingName || inc.structure?.findings || ''
      });
      continue;
    }
    if (type !== 'phase1') continue;
    const profiles = inc.damage?.barangays || [];
    for (const p of profiles) {
      const touched = [
        p.barangay,
        p.totalHouses,
        p.damagedHouses,
        p.totallyDamaged,
        p.partiallyDamaged,
        p.affectedFamilies,
        p.estimatedCost,
        p.remarks
      ].some((v) => v !== '' && v != null);
      if (!touched) continue;
      rows.push({
        ...p,
        incidentId: inc.id,
        formType: 'phase1',
        assessmentCount: count,
        barangay: resolveBarangayName(p.barangay) || place.barangay,
        purok: p.purok || place.purok,
        municipality: place.municipality,
        province: place.province,
        updatedAt: inc.updatedAt || '',
        createdAt: inc.createdAt || ''
      });
    }
  }
  return sortLatestFirst(rows);
}

/* ------------------------------------------------------------------ *
 * Barangay roll-up (the prioritisation table)
 * ------------------------------------------------------------------ */

function mergeBarangayGroups(registerRows, profileRows, incidents = []) {
  const groups = new Map();

  const group = (key, place) => {
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        barangay: place.barangay || 'Unnamed area',
        municipality: place.municipality || '',
        province: place.province || '',
        puroks: new Set(),
        registers: [],
        profiles: [],
        assessments: new Map(),
        notes: []
      };
      groups.set(key, g);
    }
    if (!g.barangay || g.barangay === 'Unnamed area') g.barangay = place.barangay || g.barangay;
    if (!g.municipality && place.municipality) g.municipality = place.municipality;
    if (!g.province && place.province) g.province = place.province;
    return g;
  };

  for (const r of registerRows) {
    const key = keyOf(r.municipality, r.barangay);
    const g = group(key, r);
    g.registers.push(r);
    g.assessments.set(r.incidentId, Number(r.assessmentCount) || 1);
    if (r.purok) g.puroks.add(r.purok);
  }

  for (const p of profileRows) {
    const key = keyOf(p.municipality, p.barangay);
    const g = group(key, p);
    g.profiles.push(p);
    g.assessments.set(p.incidentId, Number(p.assessmentCount) || 1);
    if (p.purok) g.puroks.add(p.purok);
    if (p.remarks) g.notes.push(p.remarks);
  }

  for (const inc of incidents) {
    const place = incidentPlace(inc);
    if (!place.barangay) continue;
    const key = keyOf(place.municipality, place.barangay);
    const g = group(key, place);
    if (!g.assessments.has(inc.id)) {
      g.assessments.set(inc.id, Number(inc.assessmentCount) || 1);
    }
    if (place.purok) g.puroks.add(place.purok);
  }

  return [...groups.values()];
}

function summarizeBarangay(g) {
  const reg = registerTotals(g.registers);
  const notes = [];

  /* Did the assessor actually write a figure in the barangay profile?
     If not, the register rows are the only source of truth. */
  const profileHasDamage = g.profiles.some((p) => num(p.damagedHouses) !== null);
  const profileHasCost = g.profiles.some((p) => num(p.estimatedCost) !== null);

  /* --- figures taken from the barangay profile --------------------- */
  const acc = g.profiles.reduce(
    (a, p) => {
      const pm = profileMetrics(p);
      a.total += pm.total;
      a.damaged += pm.damaged;
      a.totalLoss += pm.totalLoss;
      a.partial += pm.partial;
      a.cost += pm.cost;
      a.families += numOr(p.affectedFamilies);
      return a;
    },
    { total: 0, damaged: 0, totalLoss: 0, partial: 0, cost: 0, families: 0 }
  );

  const hasProfile = g.profiles.length > 0;

  /* The register is the detail behind the profile. It only takes over
     when the profile left the figure blank, so the same damage is never
     counted twice. */
  const damaged = hasProfile && profileHasDamage ? acc.damaged : reg.damagedUnits;
  const cost = hasProfile && profileHasCost ? acc.cost : reg.cost;
  const total = acc.total;

  /* "% of houses damaged" needs the housing stock, so it is only
     available when a barangay profile supplied it. */
  const damagePct = hasProfile && total > 0 ? Math.min(100, (damaged / total) * 100) : null;
  const totalLossPct = hasProfile && damaged > 0 ? Math.min(100, (acc.totalLoss / damaged) * 100) : null;

  const severity =
    damagePct !== null ? severityOf(damagePct) : severityFromIndex(reg.damageIndex);

  const metrics = {
    total,
    damaged,
    totalLoss: hasProfile ? acc.totalLoss : 0,
    partial: hasProfile ? acc.partial : 0,
    cost,
    families: acc.families,
    damagePct,
    totalLossPct,
    severity,
    priority: priorityFor({ severity, totalLossPct, cost }),
    priorityScore: priorityScore({
      damagePct: damagePct !== null ? damagePct : reg.damageIndex,
      totalLossPct: totalLossPct || 0,
      cost
    }),
    hasProfile
  };

  const assessmentCount = [...g.assessments.values()].reduce((a, n) => a + (Number(n) || 1), 0);

  return {
    key: g.key,
    barangay: g.barangay,
    municipality: g.municipality,
    province: g.province,
    puroks: [...g.puroks],
    assessments: assessmentCount,
    registerUnits: reg.units,
    registerDamagedUnits: reg.damagedUnits,
    registerCost: reg.cost,
    damageIndex: reg.damageIndex,
    levels: damageLevelTotals(g.registers),
    notes: g.notes,
    ...metrics,
    /* The barangay profile is the assessor's own summary of that
       barangay, and the register rows are the detail behind it. Adding
       the two would count the same damage twice, so the profile wins
       when it has a figure and the register is the fallback. */
    totalCost: metrics.cost
  };
}

/* ------------------------------------------------------------------ *
 * Distribution helpers
 * ------------------------------------------------------------------ */

function colorFor(index, palette = CHART_PALETTE) {
  return palette[index % palette.length];
}

/* ------------------------------------------------------------------ *
 * The public entry point
 * ------------------------------------------------------------------ */

/**
 * Build the full dashboard payload from a list of incident records.
 * The caller filters the records first (by form type, municipality,
 * hazard type, …) so every number here reflects the current filter.
 */
export function buildAnalytics(incidents = []) {
  const registerRows = collectRegisterRows(incidents);
  const profileRows = collectProfileRows(incidents);

  const groups = mergeBarangayGroups(registerRows, profileRows, incidents);
  const barangays = groups
    .map(summarizeBarangay)
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        (b.damagePct || 0) - (a.damagePct || 0) ||
        b.totalCost - a.totalCost ||
        a.barangay.localeCompare(b.barangay)
    )
    .map((b, i) => ({ ...b, rank: i + 1 }));

  /* --- headline totals ------------------------------------------- */
  const regTotals = registerTotals(registerRows);
  const profileTotals = profileRows.reduce(
    (a, p) => {
      const m = profileMetrics(p);
      a.total += m.total;
      a.damaged += m.damaged;
      a.totalLoss += m.totalLoss;
      a.families += numOr(p.affectedFamilies);
      a.cost += m.cost;
      return a;
    },
    { total: 0, damaged: 0, totalLoss: 0, families: 0, cost: 0 }
  );

  let personsAffected = 0;
  let displaced = 0;
  let dead = 0;
  let injured = 0;
  let census = 0;
  const hazardMap = new Map();
  const municipalityMap = new Map();
  const purokMap = new Map();

  for (const inc of incidents) {
    const count = Number(inc.assessmentCount) || 1;
    if (formTypeOf(inc) === 'building') {
      if (!isFilledBuilding(inc)) continue;
      const b = inc.building || {};
      const indiv = buildingAffectedIndividuals(inc);
      personsAffected += indiv;
      census += numOr(b.occupants) || indiv;
      if (isBuildingDisplaced(inc)) {
        displaced += indiv;
      }
    } else {
      const eff = inc.initialEffects || {};
      personsAffected += numOr(eff.affected?.total);
      displaced += numOr(eff.displaced?.total);
      dead += numOr(eff.dead?.total);
      injured += numOr(eff.injured?.total);
      census += numOr(eff.populationCensus?.total);
    }

    const types = incidentDisasterTypes(inc);
    for (const t of types) hazardMap.set(t, (hazardMap.get(t) || 0) + count);

    const place = incidentPlace(inc);
    if (place.municipality) {
      municipalityMap.set(place.municipality, (municipalityMap.get(place.municipality) || 0) + count);
    }
  }

  for (const r of registerRows) {
    if (r.purok) purokMap.set(r.purok, (purokMap.get(r.purok) || 0) + numOr(r.units));
  }

  /* --- earthquake-specific roll-up --------------------------------- */
  const earthquakeIncidents = incidents.filter((inc) => {
    if (formTypeOf(inc) === 'building' && !isFilledBuilding(inc)) return false;
    const types = incidentDisasterTypes(inc);
    return types.some((t) => String(t).toLowerCase() === 'earthquake');
  });
  const earthquakeIds = new Set(earthquakeIncidents.map((inc) => inc.id));
  const earthquakeRegisterRows = registerRows.filter((r) => earthquakeIds.has(r.incidentId));
  const earthquakeProfileRows = profileRows.filter((r) => earthquakeIds.has(r.incidentId));

  const earthquakeEffects = earthquakeIncidents.reduce(
    (a, inc) => {
      if (formTypeOf(inc) === 'building') {
        const indiv = buildingAffectedIndividuals(inc);
        a.affected += indiv;
        if (isBuildingDisplaced(inc)) {
          a.displaced += indiv;
        }
        return a;
      }
      const eff = inc.initialEffects || {};
      a.affected += numOr(eff.affected?.total);
      a.displaced += numOr(eff.displaced?.total);
      a.dead += numOr(eff.dead?.total);
      a.injured += numOr(eff.injured?.total);
      return a;
    },
    { affected: 0, displaced: 0, dead: 0, injured: 0 }
  );

  const earthquakeHasProfileCost = earthquakeProfileRows.some((p) => num(p.estimatedCost) !== null);
  const earthquakeCost = earthquakeHasProfileCost
    ? earthquakeProfileRows.reduce((a, p) => a + numOr(p.estimatedCost), 0)
    : earthquakeRegisterRows.reduce((a, r) => a + numOr(r.estimatedCost), 0);

  const countAssessments = (list) =>
    list.reduce((sum, inc) => {
      if (formTypeOf(inc) === 'building' && !isFilledBuilding(inc)) return sum;
      return sum + (Number(inc.assessmentCount) || 1);
    }, 0);

  const earthquake = {
    assessments: countAssessments(earthquakeIncidents),
    families: earthquakeProfileRows.reduce((a, p) => a + numOr(p.affectedFamilies), 0),
    cost: earthquakeCost,
    ...earthquakeEffects
  };

  /* Latest Building Structure assessment first — the overview table and
     every report list render this array top-to-bottom. */
  const buildingAssessments = sortLatestFirst(
    registerRows.filter((r) => r.formType === 'building')
  );

  /* Explicit Building Structure roll-up, computed straight from the saved
     building records (not via the barangay merge). The KPI cards and the
     Damage & Services cards show this as their "from Building Structures"
     breakdown, so a save is visibly reflected in every headline number
     even when a Phase 1 profile for the same barangay exists. */
  const filledBuildings = sortIncidentsLatestFirst(
    incidents.filter((inc) => formTypeOf(inc) === 'building' && isFilledBuilding(inc))
  );
  const buildingTotals = filledBuildings.reduce(
    (a, inc) => {
      const indiv = buildingAffectedIndividuals(inc);
      const families = buildingFamilies(inc);
      const cost = buildingCost(inc);
      const isTotal = String(inc.structure?.severity || '').trim().toLowerCase() === 'totally';
      const isEarthquake = incidentDisasterTypes(inc).some(
        (t) => String(t).toLowerCase() === 'earthquake'
      );
      a.assessments += Number(inc.assessmentCount) || 1;
      a.cost += cost;
      a.families += families;
      a.personsAffected += indiv;
      a.occupants += numOr(inc.building?.occupants) || indiv;
      if (isBuildingDisplaced(inc)) a.displaced += indiv;
      a.damagedUnits += 1;
      if (isTotal) a.totallyDamaged += 1;
      else a.partiallyDamaged += 1;
      if (isEarthquake) {
        a.earthquakeAssessments += Number(inc.assessmentCount) || 1;
        a.earthquakeCost += cost;
        a.earthquakeFamilies += families;
        a.earthquakeAffected += indiv;
        if (isBuildingDisplaced(inc)) a.earthquakeDisplaced += indiv;
      }
      a.latestUpdatedAt = a.latestUpdatedAt || inc.updatedAt || inc.assessment?.date || '';
      a.latestBuildingName = a.latestBuildingName || inc.building?.buildingName || '';
      return a;
    },
    {
      assessments: 0,
      cost: 0,
      families: 0,
      personsAffected: 0,
      occupants: 0,
      displaced: 0,
      damagedUnits: 0,
      totallyDamaged: 0,
      partiallyDamaged: 0,
      earthquakeAssessments: 0,
      earthquakeCost: 0,
      earthquakeFamilies: 0,
      earthquakeAffected: 0,
      earthquakeDisplaced: 0,
      latestUpdatedAt: '',
      latestBuildingName: ''
    }
  );

  const damagedUnits = barangays.reduce((a, b) => a + (b.damaged || 0), 0);
  const totalCost = barangays.reduce((a, b) => a + (b.totalCost || 0), 0);

  /* The housing-stock damage rate only counts the barangays that have
     a profile, because the register alone cannot say how many houses
     a barangay has in total. */
  const housesTotal = barangays.reduce((a, b) => a + b.total, 0);
  const housesDamaged = barangays.reduce((a, b) => a + (b.damagePct !== null ? b.damaged : 0), 0);
  const overallPct = housesTotal > 0 ? (housesDamaged / housesTotal) * 100 : null;

  /* --- severity distribution ------------------------------------- */
  const severityCounts = SEVERITY_ORDER.map((k) => ({
    key: k,
    label: k,
    value: barangays.filter((b) => b.severity === k).length,
    color: SEVERITY_COLORS[k]
  })).filter((s) => s.value > 0);

  const severityUnits = SEVERITY_ORDER.map((k) => ({
    key: k,
    label: k,
    value: barangays
      .filter((b) => b.severity === k)
      .reduce((a, b) => a + (b.damaged || 0), 0),
    color: SEVERITY_COLORS[k]
  })).filter((s) => s.value > 0);

  /* --- structure types & damage levels ---------------------------- */
  const structureTypes = structureTypeTotals(registerRows).map((s, i) => ({
    ...s,
    value: s.damagedUnits,
    color: colorFor(i)
  }));

  const damageLevels = damageLevelTotals(registerRows).map((l) => ({
    ...l,
    color: DAMAGE_LEVEL_COLORS[l.key] || '#9CA3AF'
  }));

  const buildingTypes = (() => {
    const map = new Map();
    for (const r of registerRows) {
      const k = r.buildingType || 'Unspecified';
      const cur = map.get(k) || { key: k, label: k, value: 0, cost: 0 };
      cur.value += numOr(r.units);
      cur.cost += numOr(r.estimatedCost);
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  })();

  /* --- locations & hazards ---------------------------------------- */
  const locations = [...municipalityMap.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value)
    .map((d, i) => ({ ...d, color: colorFor(i) }));

  const puroks = [...purokMap.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((d, i) => ({ ...d, color: colorFor(i) }));

  const hazards = [...hazardMap.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value)
    .map((d, i) => ({ ...d, color: colorFor(i) }));

  const priorityCounts = PRIORITY_ORDER.map((k) => ({
    key: k,
    label: k,
    value: barangays.filter((b) => b.priority === k).length,
    color: PRIORITY_COLORS[k]
  })).filter((s) => s.value > 0);

  const totals = {
    assessments: countAssessments(incidents),
    withDamage: new Set([...registerRows, ...profileRows].map((r) => r.incidentId)).size,
    registerRows: registerRows.length,
    profileRows: profileRows.length,
    barangays: barangays.length,
    totalUnits: regTotals.units,
    damagedUnits,
    damagedPct: overallPct,
    damageIndex: regTotals.damageIndex,
    totalHouses: profileTotals.total,
    totalLoss: profileTotals.totalLoss,
    families: profileTotals.families,
    cost: totalCost,
    personsAffected,
    displaced,
    dead,
    injured,
    census,
    critical: barangays.filter((b) => b.priority === 'Critical').length,
    high: barangays.filter((b) => b.priority === 'High').length
  };

  return {
    hasData: registerRows.length > 0 || profileRows.length > 0,
    totals,
    earthquake,
    buildingAssessments,
    buildingTotals,
    severity: severityCounts,
    severityUnits,
    priority: priorityCounts,
    structureTypes,
    damageLevels,
    buildingTypes,
    locations,
    puroks,
    hazards,
    barangays,
    registerRows,
    profileRows,
    keypoints: buildKeypoints({
      totals,
      barangays,
      structureTypes,
      damageLevels,
      hazards,
      registerRows
    })
  };
}

/* ------------------------------------------------------------------ *
 * Key points — the short, decision-ready bullets under the charts
 * ------------------------------------------------------------------ */

function buildKeypoints({ totals, barangays, structureTypes, damageLevels, hazards, registerRows }) {
  const out = [];

  if (!totals.withDamage) {
    out.push({
      tone: 'info',
      text: 'No damage records yet. Open a Phase 1 assessment and fill Section VII (Damage Register) or Section VIII (Barangay Damage Profile) to populate this dashboard.'
    });
    return out;
  }

  const top = barangays[0];
  if (top) {
    const pctText =
      top.damagePct !== null
        ? `${top.damagePct.toFixed(0)}% of ${top.total.toLocaleString()} houses damaged`
        : `damage index ${top.damageIndex.toFixed(0)}%`;
    out.push({
      tone: top.priority === 'Critical' ? 'error' : 'warning',
      text: `Priority #1 — ${top.barangay}${top.municipality ? `, ${top.municipality}` : ''}: ${pctText}, category ${top.severity}, priority ${top.priority}.`
    });
  }

  const highCount = barangays.filter((b) => b.severity === 'High').length;
  if (highCount) {
    out.push({
      tone: 'error',
      text: `${highCount} barangay${highCount === 1 ? ' falls' : 's fall'} in the High damage category (over 30% of houses damaged) and should be served first.`
    });
  }

  const totallyLost = damageLevels
    .filter((l) => l.key === 'Totally Damaged')
    .reduce((a, l) => a + l.value, 0);
  if (totallyLost > 0) {
    out.push({
      tone: 'warning',
      text: `${totallyLost.toLocaleString()} structure${totallyLost === 1 ? '' : 's'} recorded as totally damaged — these need replacement, not repair.`
    });
  }

  const topMaterial = structureTypes[0];
  if (topMaterial && topMaterial.value > 0) {
    out.push({
      tone: 'info',
      text: `Most damaged structure type: ${topMaterial.label} (${topMaterial.value.toLocaleString()} unit${topMaterial.value === 1 ? '' : 's'}). This drives the shelter and reconstruction materials request.`
    });
  }

  if (totals.cost > 0) {
    out.push({
      tone: 'info',
      text: `Total estimated damage cost recorded: ${formatPesoPlain(totals.cost)}. Submit this figure with the RDANA report for the calamity fund.`
    });
  }

  if (totals.displaced > 0) {
    out.push({
      tone: 'warning',
      text: `${totals.displaced.toLocaleString()} persons displaced and ${totals.families.toLocaleString()} families affected — shelter and food requirements follow from this.`
    });
  }

  const topHazard = hazards[0];
  if (topHazard) {
    out.push({
      tone: 'info',
      text: `Most common hazard in these records: ${topHazard.label} (${topHazard.value} assessment${topHazard.value === 1 ? '' : 's'}).`
    });
  }

  const vague = registerRows.filter((r) => !r.remarks).length;
  if (vague > 0 && vague < registerRows.length) {
    out.push({
      tone: 'info',
      text: `${vague} damage row${vague === 1 ? '' : 's'} still has no remarks — the print report and the LGU handover read better with a short description of each damaged structure.`
    });
  }

  return out;
}

function formatPesoPlain(v) {
  const n = num(v) || 0;
  return `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ *
 * Filter helpers used by the Dashboard controls
 * ------------------------------------------------------------------ */

export function collectFilterOptions(incidents = []) {
  const municipalities = new Set();
  const hazards = new Set();
  const barangays = new Set();

  for (const inc of incidents) {
    const place = incidentPlace(inc);
    if (place.municipality) municipalities.add(place.municipality);
    if (place.barangay) barangays.add(place.barangay);
    const types = incidentDisasterTypes(inc);
    for (const t of types) hazards.add(t);
  }

  // Ensure all known Tagbina barangays are present even if no data yet
  for (const b of TAGBINA_BARANGAYS) {
    barangays.add(b);
  }

  const sorted = (set) => [...set].sort((a, b) => a.localeCompare(b));

  return {
    municipalities: sorted(municipalities),
    hazards: sorted(hazards),
    barangays: sorted(barangays)
  };
}

export function buildIncidentOptions(incidents = []) {
  const seen = new Map();
  return incidents.map((inc) => {
    const p = inc.profile || {};
    const b = inc.building || {};
    const resolvedPlace = incidentPlace(inc);
    const buildingLabel =
      b.buildingName || (inc.source === 'dataset' ? p.siteLocation : '') || '';
    const place = buildingLabel
      ? `${buildingLabel}${resolvedPlace.barangay ? ` (${resolvedPlace.barangay})` : ''}`
      : resolvedPlace.barangay || resolvedPlace.municipality || p.siteLocation || 'Unnamed area';
    const types =
      (Array.isArray(p.disasterTypes) && p.disasterTypes.length
        ? p.disasterTypes
        : inc.disaster?.calamityType
        ? [inc.disaster.calamityType]
        : formTypeOf(inc) === 'building'
        ? ['Earthquake']
        : []
      ).join(' + ') || 'Unclassified';
    const rawDate = p.occurrenceTime || inc.disaster?.dateOfCalamity || inc.assessment?.date || '';
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const when =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString(undefined, { dateStyle: 'medium' })
        : rawDate;
    const parts = [place, types, when].filter(Boolean);
    let label = parts.join(' · ');
    const n = (seen.get(label) || 0) + 1;
    seen.set(label, n);
    if (n > 1) label += ` (#${n})`;
    return { id: inc.id, label };
  });
}

export function applyFilters(incidents = [], filters = {}) {
  const { formType = 'all', municipality = 'all', hazard = 'all', barangay = 'all' } = filters;
  return incidents.filter((inc) => {
    if (formType !== 'all' && formTypeOf(inc) !== formType) return false;
    const place = incidentPlace(inc);
    if (municipality !== 'all' && place.municipality !== municipality) return false;
    if (barangay !== 'all' && place.barangay !== barangay) return false;
    if (hazard !== 'all') {
      const types = incidentDisasterTypes(inc);
      const wanted = String(hazard).toLowerCase();
      if (!types.some((type) => String(type).toLowerCase() === wanted)) return false;
    }
    return true;
  });
}
