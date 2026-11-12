const isBlank = (v) => v === '' || v == null || (Array.isArray(v) && v.length === 0);

const warn = (section, message) => ({ section, level: 'warning', message });

export function validateBuilding(inc = {}) {
  const issues = [];
  const d = inc.disaster || {};
  const c = inc.classification || {};
  const b = inc.building || {};
  const s = inc.structure || {};
  const co = inc.condition || {};
  const cost = inc.cost || {};
  const a = inc.assessment || {};

  if (isBlank(d.calamityType)) issues.push(warn('1', 'Calamity Type is empty.'));
  if (isBlank(d.dateOfCalamity)) issues.push(warn('1', 'Date of Calamity is not set.'));
  if (isBlank(d.impactDescription)) issues.push(warn('1', 'Impact / Description is empty.'));

  /* Intensity / Magnitude follows the calamity type, exactly as the paper
     form lays it out: magnitude + intensity for earthquakes, wind signal for
     typhoons, rainfall warning for floods, a general scale for the rest. */
  if (d.calamityType === 'Earthquake') {
    if (isBlank(d.magnitude)) issues.push(warn('1', 'Magnitude is not set.'));
    if (isBlank(d.intensity)) issues.push(warn('1', 'Intensity is not set.'));
  } else if (d.calamityType === 'Typhoon') {
    if (isBlank(d.windSignal)) issues.push(warn('1', 'Wind Signal is not set.'));
  } else if (d.calamityType === 'Flood') {
    if (isBlank(d.rainfallWarning)) issues.push(warn('1', 'Rainfall Warning is not set.'));
  } else if (!isBlank(d.calamityType)) {
    if (isBlank(d.intensity)) issues.push(warn('1', 'Intensity / Magnitude is not set.'));
  }

  if (isBlank(c.buildingClassification)) issues.push(warn('2', 'Building Classification is empty.'));

  if (isBlank(b.buildingName)) issues.push(warn('3', 'Building Name is empty.'));
  if (isBlank(b.province)) issues.push(warn('3', 'Province is empty.'));
  if (isBlank(b.municipality)) issues.push(warn('3', 'Municipality / City is empty.'));
  if (isBlank(b.barangay)) issues.push(warn('3', 'Barangay is empty.'));

  if (isBlank(s.findings)) issues.push(warn('4', 'Observed Findings / Damage is empty.'));
  if (isBlank(s.severity)) issues.push(warn('4', 'Damage Severity is not set.'));

  if (isBlank(co.usabilityStatus)) issues.push(warn('5', 'Building Usability / Safety Status is not set.'));

  if (isBlank(cost.damageCost)) issues.push(warn('6', 'Estimated Damage Cost is empty.'));

  if (isBlank(a.date)) issues.push(warn('7', 'Date of Assessment is not set.'));
  if (isBlank(a.assessorName)) issues.push(warn('7', 'Name of Assessor is empty.'));

  return issues;
}