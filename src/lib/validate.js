import { DISAGG_COLUMNS, METRICS } from './constants';
import { composeSitePlace } from './format';

export function validateIncident(inc = {}) {
  const issues = [];
  const p = inc.profile || {};

  if ((!p.siteLocation || !p.siteLocation.trim()) && !composeSitePlace(p))
    issues.push({ section: 'I', level: 'warning', message: 'Site Location / Address is empty (pick from the dropdowns or type an address).' });
  if (!p.disasterType || !p.disasterType.trim())
    issues.push({ section: 'I', level: 'warning', message: 'Type of Disaster is not selected.' });
  if (!p.occurrenceTime)
    issues.push({ section: 'I', level: 'warning', message: 'Date and Time of Occurrence is not set.' });

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
    if (values[0] !== null && values[0] !== partSum)
      issues.push({
        section: 'II',
        level: 'warning',
        message: `${m.label}: disaggregated sum (${partSum}) does not match Total (${values[0]}).`
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

  return issues;
}

export function issuesBySection(issues) {
  return issues.reduce((acc, it) => {
    acc[it.section] = (acc[it.section] || 0) + 1;
    return acc;
  }, {});
}