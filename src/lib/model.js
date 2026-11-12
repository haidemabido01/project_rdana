import { LIFELINES, CLUSTERS } from './constants';

export function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function blankMetric() {
  // totalManual: false = Total is computed from the five disaggregation columns.
  // Once the assessor unlocks the cell, it is set true and the sum is left alone.
  return { total: '', totalManual: false, men: '', women: '', children: '', elderly: '', pwds: '' };
}

export function partSum(metric = {}) {
  return ['men', 'women', 'children', 'elderly', 'pwds'].reduce(
    (a, k) => a + (Number(metric[k]) || 0),
    0
  );
}

export function hasParts(metric = {}) {
  return ['men', 'women', 'children', 'elderly', 'pwds'].some((k) => metric[k] !== '' && metric[k] != null);
}

export function blankLifeline(key, label) {
  return { id: uid(), key, label, status: '', observation: '' };
}

export function defaultLifelines() {
  return LIFELINES.map((l) => blankLifeline(l.key, l.label));
}

export function blankNeeds(key, label) {
  return { id: uid(), key, label, priorityNeeds: '' };
}

export function defaultNeeds() {
  return CLUSTERS.map((c) => blankNeeds(c.key, c.label));
}

/* ------------------------------------------------------------------ *
 * Damage register — the digital supplement to Form 1.
 *
 * `structures` is one row per damaged structure group (how many units,
 * what material, how bad, what it costs). `barangays` is the
 * roll-up per barangay that drives severity and prioritisation.
 * ------------------------------------------------------------------ */

export function blankStructure() {
  return {
    id: uid(),
    barangay: '',
    purok: '',
    buildingType: '',
    buildingName: '',
    structureType: '',
    damageLevel: '',
    units: '',
    estimatedCost: '',
    remarks: ''
  };
}

export function blankBarangayProfile() {
  return {
    id: uid(),
    barangay: '',
    purok: '',
    totalHouses: '',
    damagedHouses: '',
    totallyDamaged: '',
    partiallyDamaged: '',
    affectedFamilies: '',
    estimatedCost: '',
    remarks: ''
  };
}

export function blankDamage() {
  return {
    structures: [blankStructure()],
    barangays: [blankBarangayProfile()],
    notes: ''
  };
}

/**
 * Records saved before the damage register existed have no `damage`
 * block. Adding the blank shape here keeps every reader (editor,
 * report, dashboard) from having to null-check its way through.
 */
export function ensureDamage(inc = {}) {
  if (inc.damage && typeof inc.damage === 'object') {
    const d = inc.damage;
    return {
      ...inc,
      damage: {
        structures: Array.isArray(d.structures) ? d.structures : [],
        barangays: Array.isArray(d.barangays) ? d.barangays : [],
        notes: d.notes || ''
      }
    };
  }
  return { ...inc, damage: blankDamage() };
}

export function createIncident() {
  return {
    id: uid(),
    formType: 'phase1',
    // Deferred seam: linking a Phase 2 record to its Phase 1 incident. Not wired yet.
    caseId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profile: {
      siteLocation: '',
      country: 'Philippines',
      region: '',
      province: '',
      municipality: '',
      barangay: '',
      purok: '',
      timeArrival: '',
      timeDeparture: '',
      interviewees: [{ id: uid(), name: '' }],
      gpsLat: '',
      gpsLng: '',
      gpsAccuracy: '',
      disasterTypes: [],
      occurrenceTime: '',
      summary: ''
    },
    initialEffects: {
      populationCensus: blankMetric(),
      affected: blankMetric(),
      displaced: blankMetric(),
      dead: blankMetric(),
      injured: blankMetric(),
      missing: blankMetric()
    },
    lifelines: defaultLifelines(),
    issues: [{ id: uid(), healthIssue: '', nonHealthIssue: '' }],
    responseActions: [{ id: uid(), groupInvolved: '', assetsDeployed: '', assistanceExtent: '', familiesServed: '' }],
    needs: defaultNeeds(),
    damage: blankDamage()
  };
}