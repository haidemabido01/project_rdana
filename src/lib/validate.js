import { DISAGG_COLUMNS, METRICS } from './constants';
import { num, numOr } from './damage';
import { composeSitePlace } from './format';

export function validateIncident(inc = {}) {
  const issues = [];
  const p = inc.profile || {};

  if ((!p.siteLocation || !p.siteLocation.trim()) && !composeSitePlace(p))
    issues.push({ section: 'I', level: 'warning', message: 'Site Location / Address is empty (pick from the dropdowns or type an address).' });
  const types = Array.isArray(p.disasterTypes) ? p.disasterTypes : [];
  if (types.length === 0)
    issues.push({ section: 'I', level: 'warning', message: 'No Type of Disaster is selected.' });
  if (!p.occurrenceTime)
    issues.push({ section: 'I', level: 'warning', message: 'Date and Time of Occurrence is not set.' });
  if (p.timeArrival && p.timeDeparture && p.timeArrival === p.timeDeparture)
    issues.push({
      section: 'I',
      level: 'error',
      message: 'Time of RDANA Team Arrival and Time of Departure cannot be the same.'
    });

  const eff = inc.initialEffects || {};
  const toNum = (v) => {
    const n = Number(v);
    return v === '' || v == null || !Number.isFinite(n) ? null : n;
  };

  for (const m of METRICS) {
    const row = eff[m.key] || {};
    const values = DISAGG_COLUMNS.map((c) => toNum(row[c.key]));
    if (values.some((v) => v !== null && v < 0))
      issues.push({ section: 'II', level: 'warning', message: `${m.label}: values cannot be negative.` });
    const partSum = values.slice(1).reduce((a, b) => a + (b || 0), 0);
    if (row.totalManual && values[0] !== null && values[0] !== partSum)
      issues.push({
        section: 'II',
        level: 'warning',
        message: `${m.label}: manual Total (${values[0]}) does not match the sum of the columns (${partSum}).`
      });
  }

  const t = (k) => toNum((eff[k] || {}).total);
  const census = t('populationCensus');
  const affected = t('affected');
  const displaced = t('displaced');
  const dead = t('dead');
  const injured = t('injured');

  if (census !== null && affected !== null && affected > census)
    issues.push({ section: 'II', level: 'warning', message: 'Affected exceeds the census population.' });
  if (affected !== null && displaced !== null && displaced > affected)
    issues.push({ section: 'II', level: 'warning', message: 'Displaced exceeds the affected population.' });
  if (affected !== null && dead !== null && dead > affected)
    issues.push({ section: 'II', level: 'warning', message: 'Reported deaths exceed the affected population.' });
  if (affected !== null && injured !== null && injured > affected)
    issues.push({ section: 'II', level: 'warning', message: 'Injured exceed the affected population.' });

  /* ---- VII. Damage register --------------------------------------- */
  const dmg = inc.damage || {};
  const structures = Array.isArray(dmg.structures) ? dmg.structures : [];

  structures.forEach((s, i) => {
    const rowNo = i + 1;
    const touched = [
      s.buildingType,
      s.buildingName,
      s.structureType,
      s.damageLevel,
      s.units,
      s.estimatedCost,
      s.remarks
    ].some((v) => v !== '' && v != null);
    if (!touched) return;

    if (!s.buildingType)
      issues.push({ section: 'VII', level: 'warning', message: `Damage row ${rowNo}: no type of building / facility selected.` });
    if (!s.structureType)
      issues.push({ section: 'VII', level: 'warning', message: `Damage row ${rowNo}: no type of structure (concrete, bamboo, etc.) selected.` });
    if (!s.damageLevel)
      issues.push({ section: 'VII', level: 'warning', message: `Damage row ${rowNo}: no damage level / status selected.` });

    const units = num(s.units);
    if (units !== null && units < 0)
      issues.push({ section: 'VII', level: 'warning', message: `Damage row ${rowNo}: number of units cannot be negative.` });
    if (units === 0 && s.damageLevel && s.damageLevel !== 'Undamaged')
      issues.push({ section: 'VII', level: 'warning', message: `Damage row ${rowNo}: marked as damaged but the number of units is 0.` });

    const cost = num(s.estimatedCost);
    if (cost !== null && cost < 0)
      issues.push({ section: 'VII', level: 'warning', message: `Damage row ${rowNo}: estimated damage cost cannot be negative.` });
  });

  /* ---- VIII. Barangay damage profile ------------------------------- */
  const profiles = Array.isArray(dmg.barangays) ? dmg.barangays : [];

  profiles.forEach((p, i) => {
    const rowNo = i + 1;
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
    if (!touched) return;

    if (!p.barangay)
      issues.push({ section: 'VIII', level: 'warning', message: `Barangay row ${rowNo}: name not set.` });

    const total = numOr(p.totalHouses);
    const damaged = numOr(p.damagedHouses);
    const totalLoss = numOr(p.totallyDamaged);
    const partial = numOr(p.partiallyDamaged);

    if (num(p.totalHouses) !== null && total < 0)
      issues.push({ section: 'VIII', level: 'warning', message: `Barangay row ${rowNo}: total houses cannot be negative.` });
    if (num(p.damagedHouses) !== null && damaged < 0)
      issues.push({ section: 'VIII', level: 'warning', message: `Barangay row ${rowNo}: damaged houses cannot be negative.` });
    if (total > 0 && damaged > total)
      issues.push({ section: 'VIII', level: 'warning', message: `Barangay row ${rowNo}: damaged houses (${damaged}) exceed total houses (${total}).` });
    if (damaged > 0 && totalLoss + partial > damaged)
      issues.push({
        section: 'VIII',
        level: 'warning',
        message: `Barangay row ${rowNo}: totally + partially damaged (${totalLoss + partial}) exceed damaged houses (${damaged}).`
      });
    if (num(p.estimatedCost) !== null && numOr(p.estimatedCost) < 0)
      issues.push({ section: 'VIII', level: 'warning', message: `Barangay row ${rowNo}: estimated damage cost cannot be negative.` });
  });

  return issues;
}

export function issuesBySection(issues) {
  return issues.reduce((acc, it) => {
    acc[it.section] = (acc[it.section] || 0) + 1;
    return acc;
  }, {});
}