/* ------------------------------------------------------------------ *
 * Damage register — picklists, thresholds and computation helpers.
 *
 * The paper RDANA Form 1 has no house-level damage table, so this file
 * backs a digital supplement to the official form:
 *
 *   1. a Damage Register  — one row per damaged structure group
 *      (how many units, what material, how bad, what it costs)
 *   2. a Barangay Profile — one row per barangay roll-up
 *      (total houses vs damaged houses -> % damage -> severity -> priority)
 *
 * Everything here is pure so the same numbers back the editor, the
 * printed report and the dashboard. No imports on purpose: model.js
 * owns the row factories (it owns uid()), and this module must stay
 * importable from anywhere without creating a cycle.
 * ------------------------------------------------------------------ */

/* Material of the structure. The order matches how assessors say it
   out loud in the field: "concrete, semi-concrete, wood, kubo". */
export const STRUCTURE_TYPES = [
  'Concrete (Reinforced Concrete / CHB)',
  'Semi-Concrete',
  'Wood / Timber',
  'Bamboo / Kubo',
  'Light Materials (GI Sheet, Coconet, etc.)',
  'Mixed Materials',
  'Other (specify in remarks)'
];

/* What kind of building it is. Covers houses plus the public
   facilities that get named in a "principal office" remark. */
export const BUILDING_TYPES = [
  'Residential House',
  'Barangay Hall / Principal Office',
  'Elementary / High School',
  'Health Center / RHU',
  'Multi-Purpose Building',
  'Evacuation Center / Shelter',
  'Commercial Store / Market Stall',
  'Church / Religious Building',
  'Farmhouse / Poultry Pen / Fish Shelter',
  'Roads, Bridges & Other Infrastructure',
  'Other (specify in remarks)'
];

/* Damage severity of a single structure. `weight` is the fraction of
   the structure that is lost, used to build the damage index:
   Low = a quarter lost, Moderate = three fifths, Severe = nine
   tenths, Totally Damaged = completely gone. */
export const DAMAGE_LEVELS = [
  { key: 'Undamaged', weight: 0 },
  { key: 'Low', weight: 0.25 },
  { key: 'Moderate', weight: 0.6 },
  { key: 'Severe', weight: 0.9 },
  { key: 'Totally Damaged', weight: 1 }
];

export const DAMAGE_LEVEL_KEYS = DAMAGE_LEVELS.map((d) => d.key);

export const DAMAGE_WEIGHT = DAMAGE_LEVELS.reduce((acc, d) => {
  acc[d.key] = d.weight;
  return acc;
}, {});

export const DAMAGE_LEVEL_COLORS = {
  Undamaged: '#9CA3AF',
  Low: '#10B981',
  Moderate: '#F59E0B',
  Severe: '#F97316',
  'Totally Damaged': '#EF4444'
};

/* Barangay-level damage category. Thresholds are the share of the
   barangay's housing stock that was damaged. */
export const SEVERITY_THRESHOLDS = { low: 10, moderate: 30 };

export const SEVERITY_ORDER = ['No Damage', 'Low', 'Moderate', 'High'];

export const SEVERITY_COLORS = {
  'No Damage': '#9CA3AF',
  Low: '#10B981',
  Moderate: '#F59E0B',
  High: '#EF4444'
};

/* Prioritisation tier — the "who gets helped first" ranking used by
   the dashboard. Severity drives it; the cost and the share of total
   losses push a barangay one tier up. */
export const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

export const PRIORITY_COLORS = {
  Critical: '#B91C1C',
  High: '#EA580C',
  Medium: '#F59E0B',
  Low: '#3B6CB0'
};

/* Palette for the categorical charts (structure type, location…). */
export const CHART_PALETTE = [
  '#F97316',
  '#1B3470',
  '#3B6CB0',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#64748B'
];

/* ------------------------------------------------------------------ *
 * Small numeric helpers
 * ------------------------------------------------------------------ */

/** Parse a stored cell into a number, or null when it is blank/invalid. */
export function num(v) {
  if (v === '' || v === null || v === undefined) return null;
  /* Building cost / occupant fields are plain number inputs, but a value
     pasted as "₱50,000" must still count toward the totals instead of
     silently becoming NaN and dropping out of every KPI. */
  const cleaned = typeof v === 'string' ? v.replace(/[₱,\s]/g, '') : v;
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse a stored cell into a number, falling back to 0. */
export function numOr(v, fallback = 0) {
  const n = num(v);
  return n === null ? fallback : n;
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

/** Damage category for a percentage of damaged housing stock. */
export function severityOf(pct) {
  const p = numOr(pct);
  if (p <= 0) return 'No Damage';
  if (p < SEVERITY_THRESHOLDS.low) return 'Low';
  if (p < SEVERITY_THRESHOLDS.moderate) return 'Moderate';
  return 'High';
}

/** Damage category for a weighted damage index (0-100) used when the
    total housing stock is unknown but the structure damage is known. */
export function severityFromIndex(index) {
  const i = numOr(index);
  if (i <= 0) return 'No Damage';
  if (i < 25) return 'Low';
  if (i < 60) return 'Moderate';
  return 'High';
}

/** Prioritisation tier for a barangay. */
export function priorityFor({ severity, totalLossPct = 0, cost = 0 } = {}) {
  const loss = numOr(totalLossPct);
  const c = numOr(cost);
  if (severity === 'High') {
    if (loss >= 30 || c >= 500000) return 'Critical';
    return 'High';
  }
  if (severity === 'Moderate') {
    if (loss >= 50 || c >= 250000) return 'High';
    return 'Medium';
  }
  if (severity === 'Low') {
    if (loss >= 50 || c >= 500000) return 'Medium';
    return 'Low';
  }
  return 'Low';
}

/**
 * Ranking number for the priority table.
 * 50% of the score is the damage rate, 30% the share of total losses,
 * and the last 20 points are the cost of the damage (capped, so a
 * single expensive facility cannot swamp the ranking).
 */
export function priorityScore({ damagePct = 0, totalLossPct = 0, cost = 0 } = {}) {
  const raw = numOr(damagePct) * 0.5 + numOr(totalLossPct) * 0.3 + Math.min(20, numOr(cost) / 25000);
  return Math.round(raw * 10) / 10;
}

/* ------------------------------------------------------------------ *
 * Row-level metrics
 * ------------------------------------------------------------------ */

/**
 * Metrics for one barangay profile row.
 * `damagePct`  — share of the barangay's houses that were damaged
 * `totalLossPct` — share of the damaged houses that were totally lost
 */
export function profileMetrics(p = {}) {
  const total = numOr(p.totalHouses);
  const damaged = numOr(p.damagedHouses);
  const totalLoss = numOr(p.totallyDamaged);
  const partial = numOr(p.partiallyDamaged);
  const cost = numOr(p.estimatedCost);

  const damagePct = total > 0 ? Math.min(100, (damaged / total) * 100) : damaged > 0 ? 100 : 0;
  const totalLossPct = damaged > 0 ? Math.min(100, (totalLoss / damaged) * 100) : 0;
  const severity = severityOf(damagePct);
  const priority = priorityFor({ severity, totalLossPct, cost });

  return {
    total,
    damaged,
    totalLoss,
    partial,
    cost,
    damagePct,
    totalLossPct,
    severity,
    priority,
    priorityScore: priorityScore({ damagePct, totalLossPct, cost })
  };
}

/**
 * Roll-up of a set of damage register rows.
 * `damageIndex` is the weighted average loss across every unit listed
 * (0-100): a hundred totally damaged concrete houses score 100.
 */
export function registerTotals(rows = []) {
  let units = 0;
  let damagedUnits = 0;
  let cost = 0;
  let weighted = 0;

  for (const r of rows) {
    const u = numOr(r.units);
    units += u;
    const w = DAMAGE_WEIGHT[r.damageLevel];
    if (w !== undefined && w > 0) {
      damagedUnits += u;
      weighted += u * w;
    }
    cost += numOr(r.estimatedCost);
  }

  return {
    rows: rows.length,
    units,
    damagedUnits,
    cost,
    damagedPct: units > 0 ? (damagedUnits / units) * 100 : 0,
    damageIndex: units > 0 ? (weighted / units) * 100 : 0
  };
}

/** Units and cost per type of structure (concrete, bamboo, …). */
export function structureTypeTotals(rows = []) {
  const map = new Map();
  for (const r of rows) {
    const key = r.structureType || 'Unspecified';
    const cur = map.get(key) || { key, label: key, units: 0, damagedUnits: 0, cost: 0 };
    const u = numOr(r.units);
    cur.units += u;
    const w = DAMAGE_WEIGHT[r.damageLevel];
    if (w !== undefined && w > 0) cur.damagedUnits += u;
    cur.cost += numOr(r.estimatedCost);
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.damagedUnits - a.damagedUnits || b.cost - a.cost);
}

/** Units per damage level (the "status / remarks percentage" split). */
export function damageLevelTotals(rows = []) {
  const map = new Map();
  for (const r of rows) {
    const key = r.damageLevel || 'Unspecified';
    const cur = map.get(key) || { key, label: key, units: 0, cost: 0 };
    cur.units += numOr(r.units);
    cur.cost += numOr(r.estimatedCost);
    map.set(key, cur);
  }
  const order = [...DAMAGE_LEVEL_KEYS, 'Unspecified'];
  return order
    .filter((k) => map.has(k))
    .map((k) => map.get(k));
}

/** True when a register row holds anything worth keeping. */
export function isFilledRow(r = {}) {
  return [
    r.barangay,
    r.purok,
    r.buildingType,
    r.buildingName,
    r.structureType,
    r.damageLevel,
    r.units,
    r.estimatedCost,
    r.remarks
  ].some((v) => v !== '' && v != null);
}

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

const PESO = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
});

/** Philippine peso, rounded to the peso. Falls back to "—" for blanks. */
export function formatPeso(v) {
  const n = num(v);
  return n === null ? '—' : PESO.format(n);
}

/** Compact peso for chart labels: ₱1.2M, ₱340K, ₱820. */
export function formatPesoShort(v) {
  const n = num(v);
  if (n === null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000000) return `₱${(n / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M`;
  if (abs >= 1000) return `₱${Math.round(n / 1000)}K`;
  return `₱${Math.round(n)}`;
}

/** Whole-number percentage with no decimals; "—" for blanks. */
export function formatPct(v, digits = 1) {
  const n = num(v);
  if (n === null) return '—';
  return `${n.toFixed(digits)}%`;
}
