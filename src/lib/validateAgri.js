const num = (v) => {
  const n = Number(v);
  return v === '' || v == null || !Number.isFinite(n) ? null : n;
};

const isBlank = (v) => v === '' || v == null || (Array.isArray(v) && v.length === 0);

const warn = (section, message) => ({ section, level: 'warning', message });

export function validateAgriculture(inc = {}) {
  const issues = [];
  const h = inc.header || {};

  if (isBlank(h.typeOfDisaster)) issues.push(warn('1', 'Type of Disaster is empty.'));
  if (isBlank(h.occurrenceDateTime)) issues.push(warn('1', 'Date and Time of Occurrence is not set.'));
  if (isBlank(h.location)) issues.push(warn('1', 'Location is empty.'));
  if (isBlank(h.affectedFarmers)) issues.push(warn('1', 'Affected number of farmers/fisherfolks is empty.'));

  (inc.infrastructure || []).forEach((r, i) => {
    const touched = [r.degree, r.remarks].some((v) => (Array.isArray(v) ? v.length : v !== '' && v != null));
    if (!touched) return;
    if (isBlank(r.degree)) issues.push(warn('2', `Infrastructure row ${i + 1} (${r.facility}): no degree of damage selected.`));
  });

  (inc.crops || []).forEach((r, i) => {
    const touched = [r.totallyDamaged, r.partiallyDamaged, r.farmersAffected, r.remarks].some((v) => v !== '' && v != null);
    if (!touched) return;
    for (const f of ['totallyDamaged', 'partiallyDamaged', 'farmersAffected']) {
      const v = num(r[f]);
      if (v !== null && v < 0) issues.push(warn('3', `Crop row ${i + 1} (${r.crop}): ${f} cannot be negative.`));
    }
  });

  (inc.animals || []).forEach((r, i) => {
    const touched = [r.animal, r.dead, r.partiallyDamaged, r.missing, r.injured, r.remarks].some((v) => v !== '' && v != null);
    if (!touched) return;
    if (isBlank(r.animal)) issues.push(warn('4', `Animal row ${i + 1}: animal type is empty.`));
    for (const f of ['dead', 'partiallyDamaged', 'missing', 'injured']) {
      const v = num(r[f]);
      if (v !== null && v < 0) issues.push(warn('4', `Animal row ${i + 1}: ${f} cannot be negative.`));
    }
  });

  (inc.fisheries || []).forEach((r, i) => {
    const touched = [r.partiallyDamaged, r.totallyDamaged, r.units, r.farmersAffected, r.remarks].some((v) => v !== '' && v != null);
    if (!touched) return;
    for (const f of ['partiallyDamaged', 'totallyDamaged', 'farmersAffected']) {
      const v = num(r[f]);
      if (v !== null && v < 0) issues.push(warn('5', `Fishery row ${i + 1} (${r.resource}): ${f} cannot be negative.`));
    }
  });

  (inc.machineries || []).forEach((r, i) => {
    const touched = [r.partiallyDamaged, r.totallyDamaged, r.remarks].some((v) => v !== '' && v != null);
    if (!touched) return;
    for (const f of ['partiallyDamaged', 'totallyDamaged']) {
      const v = num(r[f]);
      if (v !== null && v < 0) issues.push(warn('6', `Machinery row ${i + 1} (${r.machinery}): ${f} cannot be negative.`));
    }
  });

  return issues;
}
