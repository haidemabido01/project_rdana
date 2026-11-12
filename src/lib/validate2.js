/* Advisory validation for RDANA Form 2. Never blocks saving — mirrors the
   Form 1 behaviour, where issues are surfaced as warnings on the chip strip. */

const num = (v) => {
  const n = Number(v);
  return v === '' || v == null || !Number.isFinite(n) ? null : n;
};

const isBlank = (v) => v === '' || v == null || (Array.isArray(v) && v.length === 0);

const warn = (section, message) => ({ section, level: 'warning', message });

/* A repeatable row counts as empty when every tracked field is blank.
   Returns the warnings so callers can collect them; nothing is pushed to a
   shared array from in here. */
function emptyRows(section, list, fields, label) {
  return (list || [])
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => fields.every((f) => isBlank(r?.[f])))
    .map(({ i }) => warn(section, `${label}: row ${i + 1} is completely blank and will print as an empty row.`));
}

const NEED_FIELDS = ['needs', 'assessedNeeds', 'quantity', 'families', 'observations'];

export function validateForm2(inc = {}) {
  const issues = [];
  const h = inc.header || {};
  const s1 = inc.s1 || {};
  const s2 = inc.s2 || {};
  const s3 = inc.s3 || {};
  const s5 = inc.s5 || {};
  const s6 = inc.s6 || {};
  const s7 = inc.s7 || {};
  const s8 = inc.s8 || {};
  const s9 = inc.s9 || {};
  const s10 = inc.s10 || {};
  const s11 = inc.s11 || {};
  const s12 = inc.s12 || {};
  const s13 = inc.s13 || {};

  /* ---- Page 1: identification + situation before ---- */
  if (isBlank(h.incidentName)) issues.push(warn('1', 'Name of Incident is empty.'));
  if (isBlank(h.affectedMunicipality)) issues.push(warn('1', 'Affected Municipality / City is empty.'));
  if (isBlank(h.reportDate)) issues.push(warn('1', 'Assessment / Report Date is empty.'));
  if (isBlank(h.eventDateTime)) issues.push(warn('1', 'Date and Time of Event is empty.'));

  const tPop = num(s1.totalPopulation);
  const m = num(s1.men);
  const w = num(s1.women);
  if (tPop !== null && (m !== null || w !== null) && m + w !== tPop)
    issues.push(warn('1', `Men + Women (${(m || 0) + (w || 0)}) does not match Total Population (${tPop}).`));

  /* ---- Page 2: situation after ---- */
  const pAff = num(s2.personsAffected);
  const fAff = num(s2.familiesAffected);
  const pDis = num(s2.personsDisplaced);
  const fDis = num(s2.familiesDisplaced);
  if (pAff !== null && pDis !== null && pDis > pAff)
    issues.push(warn('2', 'Persons displaced exceeds persons affected.'));
  if (fAff !== null && fDis !== null && fDis > fAff)
    issues.push(warn('2', 'Families displaced exceeds families affected.'));
  for (const k of ['deaths', 'injured', 'missing']) {
    const v = num(s2[k]);
    if (pAff !== null && v !== null && v > pAff)
      issues.push(warn('2', `${k} exceeds the number of persons affected.`));
  }

  /* ---- Page 3: roads, bridges, accessibility ---- */
  issues.push(
    ...emptyRows('3', s3.roads, ['classification', 'areaLocation', 'damageDescription', 'status'], 'Affected roads'),
    ...emptyRows('3', s3.bridges, ['areaLocation', 'bridgeName', 'damageDescription', 'status'], 'Affected bridges')
  );

  /* ---- Page 4: electricity, communication, fuel ---- */
  (s5.services || []).forEach((r) => {
    const ticked = r.status || [];
    if (!ticked.length) return;
    if (ticked.includes('Operational/Normal') && ticked.includes('Non-operational'))
      issues.push(warn('4', `${r.label}: both Operational/Normal and Non-operational are ticked — these contradict each other.`));
    if (ticked.includes('Non-operational') && isBlank(r.why))
      issues.push(warn('4', `${r.label}: marked Non-operational but “Why?” is empty.`));
  });

  /* ---- Page 5: health ---- */
  if (isBlank(s6.impact)) issues.push(warn('5', 'Impact on Health has not been rated.'));
  (s6.facilities || []).forEach((f, i) => {
    if (!isBlank(f.facilityName)) {
      const op = num(f.operationalNo) || 0;
      const nop = num(f.nonOperationalNo) || 0;
      if (op === 0 && nop === 0)
        issues.push(warn('5', `Health facilities row ${i + 1} (${f.facilityName}): both operational and non-operational counts are 0.`));
    }
  });
  issues.push(
    ...emptyRows('5', s6.facilities, ['facilityName', 'category', 'operationalNo', 'nonOperationalNo', 'bedsAvailable'], 'Health facilities')
  );

  /* ---- Page 6: WASH ---- */
  const waterPct = (num(s7.sufficientPct) || 0) + (num(s7.poorPct) || 0) + (num(s7.nonePct) || 0);
  if (waterPct > 0 && Math.round(waterPct) !== 100)
    issues.push(warn('6', `Water adequacy should total 100% — currently ${Math.round(waterPct)}%.`));
  if (isBlank(s7.impactWater)) issues.push(warn('6', 'Impact on Water Supply has not been rated.'));
  if (isBlank(s7.impactSanitation)) issues.push(warn('6', 'Impact on Sanitation has not been rated.'));
  issues.push(...emptyRows('6', s7.sanitationNeeds, NEED_FIELDS, 'Main sanitation needs'));

  /* ---- Page 7: food and nutrition ---- */
  if (isBlank(s8.impact)) issues.push(warn('7', 'Impact on Food and Nutrition has not been rated.'));
  issues.push(...emptyRows('7', s8.foodNeeds, NEED_FIELDS, 'Main food and nutrition needs'));
  (s8.interventions || []).forEach((r, i) => {
    if (isBlank(r.donorSource) && isBlank(r.productsDistributed) && isBlank(r.availableInventory))
      issues.push(warn('7', `Food interventions row ${i + 1} is completely blank.`));
  });

  /* ---- Page 8: shelter and livelihood ---- */
  if (isBlank(s9.impact)) issues.push(warn('8', 'Impact on Shelter has not been rated.'));
  if (isBlank(s10.impact)) issues.push(warn('8', 'Impact on Livelihood has not been rated.'));
  issues.push(
    ...emptyRows('8', s9.shelterNeeds, NEED_FIELDS, 'Shelter needs'),
    ...emptyRows('8', s10.livelihoodNeeds, NEED_FIELDS, 'Livelihood needs')
  );

  /* ---- Page 9: protection and education ---- */
  if (isBlank(s11.impact)) issues.push(warn('9', 'Impact on Protection has not been rated.'));
  if (isBlank(s12.impact)) issues.push(warn('9', 'Impact on Education has not been rated.'));
  issues.push(
    ...emptyRows('9', s11.protectionNeeds, NEED_FIELDS, 'Protection needs'),
    ...emptyRows('9', s12.educationNeeds, NEED_FIELDS, 'Education needs')
  );
  (s12.schools || []).forEach((r) => {
    if (r.key !== 'classrooms' && r.key !== 'students') {
      for (const f of ['partiallyDamaged', 'totallyDamaged']) {
        const v = num(r[f]);
        if (v !== null && (v < 0 || v > 100))
          issues.push(warn('9', `${r.label}: ${f} should be a percentage between 0 and 100 (entered ${v}).`));
      }
    }
  });
  (s11.children || []).forEach((r) => {
    const t = num(r.total);
    const b = num(r.boys) || 0;
    const g = num(r.girls) || 0;
    if (t !== null && b + g !== t)
      issues.push(warn('9', `${r.label}: Boys + Girls (${b + g}) does not match the Total Number (${t}).`));
  });

  /* ---- Page 10: organization and coordination ---- */
  if (isBlank(s13.impact)) issues.push(warn('10', 'Impact on Coordination has not been rated.'));

  return issues;
}