import {
  AlertTriangle,
  Beef,
  Building2,
  ClipboardList,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  School,
  ShieldAlert,
  Sprout,
  Users,
  Wheat
} from 'lucide-react';
import {
  buildingAffectedIndividuals,
  buildingCost,
  formTypeOf,
  incidentPlace,
  isFilledBuilding
} from './analytics';
import { CHART_PALETTE, formatPesoShort, numOr } from './damage';

const fmt = (value) => Number(numOr(value)).toLocaleString();
const fmtHa = (value) =>
  `${Number(numOr(value)).toLocaleString('en-PH', { maximumFractionDigits: 1 })} ha`;

function areaLabel(inc) {
  const type = formTypeOf(inc);
  if (type === 'phase2') {
    return (
      String(inc.header?.areaAssessed || '').trim() ||
      String(inc.header?.affectedMunicipality || '').trim() ||
      'Unassigned area'
    );
  }
  if (type === 'agriculture') {
    return String(inc.header?.location || '').trim() || 'Unassigned area';
  }
  const place = incidentPlace(inc);
  return place.barangay || place.municipality || 'Unassigned area';
}

function isSchoolBuilding(inc) {
  const label = `${inc.classification?.buildingClassification || ''} ${
    inc.building?.buildingOccupancy || ''
  }`.toLowerCase();
  return label.includes('school') || label.includes('education');
}

function isHealthBuilding(inc) {
  const label = `${inc.classification?.buildingClassification || ''} ${
    inc.building?.buildingOccupancy || ''
  }`.toLowerCase();
  return label.includes('health') || label.includes('rhu') || label.includes('hospital');
}

function isFarmBuilding(inc) {
  const label = `${inc.classification?.buildingClassification || ''} ${
    inc.building?.buildingOccupancy || ''
  }`.toLowerCase();
  return (
    label.includes('farmhouse') ||
    label.includes('poultry') ||
    label.includes('fish shelter') ||
    label.includes('agricultur')
  );
}

function blankArea() {
  return {
    families: 0,
    displaced: 0,
    persons: 0,
    injured: 0,
    dead: 0,
    schoolPartial: 0,
    schoolTotal: 0,
    schoolStudents: 0,
    schoolCost: 0,
    healthFacilities: 0,
    healthDown: 0,
    cropTotal: 0,
    cropPartial: 0,
    cropFarmers: 0,
    headerFarmers: 0,
    livestock: 0,
    agriCost: 0
  };
}

function bump(map, area) {
  const key = String(area || 'Unassigned area').trim() || 'Unassigned area';
  const current = map.get(key) || blankArea();
  map.set(key, current);
  return current;
}

function collectSector(incidents = []) {
  const byArea = new Map();

  for (const inc of incidents) {
    const type = formTypeOf(inc);
    const area = bump(byArea, areaLabel(inc));

    if (type === 'building') {
      if (!isFilledBuilding(inc)) continue;
      const total = String(inc.structure?.severity || '').trim().toLowerCase() === 'totally';
      const indiv = buildingAffectedIndividuals(inc);
      const cost = buildingCost(inc);
      area.families += Math.max(1, Math.ceil(indiv / 5) || 1);
      area.persons += indiv;

      if (isSchoolBuilding(inc)) {
        if (total) area.schoolTotal += 1;
        else area.schoolPartial += 1;
        area.schoolStudents += indiv;
        area.schoolCost += cost;
      }
      if (isHealthBuilding(inc)) {
        area.healthFacilities += 1;
        const usability = String(inc.condition?.usabilityStatus || '').toLowerCase();
        if (total || usability.includes('unsafe') || usability.includes('non')) area.healthDown += 1;
      }
      if (isFarmBuilding(inc)) {
        if (total) area.cropTotal += 1;
        else area.cropPartial += 1;
        area.livestock += indiv;
      }
      continue;
    }

    if (type === 'phase2') {
      const s6 = inc.s6 || {};
      for (const facility of s6.facilities || []) {
        const name = String(facility.facilityName || '').trim();
        const category = String(facility.category || '').trim();
        const down = numOr(facility.nonOperationalNo) || (facility.damageType ? 1 : 0);
        if (!name && !category && !down) continue;
        area.healthFacilities += 1;
        if (down) area.healthDown += 1;
      }

      const schools = inc.s12?.schools || [];
      for (const row of schools) {
        const partial = numOr(row.partiallyDamaged);
        const total = numOr(row.totallyDamaged);
        if (row.key === 'students') {
          area.schoolStudents += partial + total;
          continue;
        }
        area.schoolPartial += partial;
        area.schoolTotal += total;
      }
      continue;
    }

    if (type === 'agriculture') {
      area.headerFarmers += numOr(inc.header?.affectedFarmers);
      area.cropFarmers += numOr(inc.header?.affectedFarmers);
      area.agriCost += numOr(inc.costing?.estimatedAmount);
      for (const row of inc.crops || []) {
        area.cropTotal += numOr(row.totallyDamaged);
        area.cropPartial += numOr(row.partiallyDamaged);
        area.cropFarmers += numOr(row.farmersAffected);
      }
      for (const row of inc.animals || []) {
        area.livestock +=
          numOr(row.dead) + numOr(row.partiallyDamaged) + numOr(row.missing) + numOr(row.injured);
      }
      for (const row of inc.fisheries || []) {
        area.cropTotal += numOr(row.totallyDamaged);
        area.cropPartial += numOr(row.partiallyDamaged);
        area.cropFarmers += numOr(row.farmersAffected);
      }
      continue;
    }

    const eff = inc.initialEffects || {};
    const brgyFamilies = (inc.damage?.barangays || []).reduce(
      (sum, b) => sum + numOr(b.affectedFamilies),
      0
    );
    area.families +=
      numOr(inc.profile?.affectedFamilies) || numOr(eff.families?.total) || brgyFamilies;
    area.persons += numOr(eff.affected?.total);
    area.displaced += numOr(eff.displaced?.total);
    area.injured += numOr(eff.injured?.total);
    area.dead += numOr(eff.dead?.total);

    for (const s of inc.damage?.structures || []) {
      const label = `${s.buildingType || ''} ${s.buildingName || ''}`.toLowerCase();
      const units = Math.max(1, numOr(s.units));
      const isTotal = String(s.damageLevel || '').toLowerCase().includes('total');
      const sCost = numOr(s.estimatedCost);
      if (label.includes('school') || label.includes('education')) {
        if (isTotal) area.schoolTotal += units;
        else area.schoolPartial += units;
        area.schoolCost += sCost;
      } else if (label.includes('health') || label.includes('rhu') || label.includes('hospital')) {
        area.healthFacilities += units;
        if (isTotal || String(s.damageLevel || '').toLowerCase() === 'severe') {
          area.healthDown += units;
        }
      } else if (
        label.includes('farm') ||
        label.includes('poultry') ||
        label.includes('fish') ||
        label.includes('agri')
      ) {
        if (isTotal) area.cropTotal += units;
        else area.cropPartial += units;
        area.agriCost += sCost;
      }
    }
  }

  return byArea;
}

function sumArea(map, key) {
  let total = 0;
  for (const row of map.values()) total += numOr(row[key]);
  return total;
}

function topAreas(map, key, count = 4, secondaryKey = key) {
  return [...map.entries()]
    .map(([label, row]) => ({
      label,
      row,
      value: numOr(row[key]) + numOr(row[secondaryKey])
    }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}

export function axisTicks(maxValue, count = 5) {
  const top = Math.max(1, Number(maxValue) || 0);
  const rawStep = top / Math.max(1, count);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const normalized = rawStep / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const ceiling = Math.ceil(top / step) * step;
  const ticks = [];
  for (let value = 0; value <= ceiling + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return ticks;
}

function seriesForAreas(entries, primary, secondary, primaryLabel, secondaryLabel) {
  const series = [];
  entries.forEach((entry, index) => {
    const color = CHART_PALETTE[index % CHART_PALETTE.length];
    series.push({
      key: `${entry.label}-${primary}`,
      label: `${entry.label} — ${primaryLabel}`,
      value: numOr(entry.row[primary]),
      color,
      group: entry.label
    });
    series.push({
      key: `${entry.label}-${secondary}`,
      label: `${entry.label} — ${secondaryLabel}`,
      value: numOr(entry.row[secondary]),
      color: CHART_PALETTE[(index + 3) % CHART_PALETTE.length],
      group: entry.label
    });
  });
  return series;
}

function chartPayload({ title, subtitle, totalLabel, series, legend, note }) {
  const max = series.reduce((m, bar) => Math.max(m, numOr(bar.value)), 0);
  const ticks = axisTicks(max);
  const groupTotals = new Map();
  for (const bar of series) {
    groupTotals.set(bar.group, (groupTotals.get(bar.group) || 0) + numOr(bar.value));
  }
  const total = [...groupTotals.values()].reduce((a, b) => a + b, 0);
  const bars = [...groupTotals.entries()].map(([label, value], index) => ({
    label,
    pct: total > 0 ? Math.round((value / total) * 100) : 0,
    countText: `${fmt(value)} recorded`,
    color: CHART_PALETTE[index % CHART_PALETTE.length]
  }));

  return {
    title,
    subtitle,
    totalLabel,
    ticks,
    series,
    legend,
    disclaimer:
      'Live totals from saved RDANA records. Bars update automatically when an assessment is saved.',
    bars,
    note
  };
}

function housingChart(ctx) {
  const housing = ctx.service?.housing || { partiallyDamaged: 0, totallyDamaged: 0, total: 0 };
  const series = [
    {
      key: 'housing-partial',
      label: 'Partially damaged units',
      value: numOr(housing.partiallyDamaged),
      color: CHART_PALETTE[0],
      group: 'Partially damaged'
    },
    {
      key: 'housing-total',
      label: 'Totally damaged units',
      value: numOr(housing.totallyDamaged),
      color: CHART_PALETTE[1],
      group: 'Totally damaged'
    }
  ];
  return chartPayload({
    title: 'Housing Damage – Live Analytics',
    subtitle: `${fmt(housing.total)} damaged housing units recorded`,
    totalLabel: `${fmt(housing.total)} units`,
    series,
    legend: { color: CHART_PALETTE[0], label: 'Damaged housing units by severity' },
    note: 'Housing figures include Phase 1 damage profiles.'
  });
}

function healthChart(ctx, sector) {
  const facilities = sumArea(sector, 'healthFacilities');
  const down = sumArea(sector, 'healthDown');
  const operational = Math.max(0, facilities - down);
  const series = [
    {
      key: 'health-operational',
      label: 'Operational facilities',
      value: operational,
      color: CHART_PALETTE[3],
      group: 'Operational'
    },
    {
      key: 'health-down',
      label: 'Non-operational facilities',
      value: down,
      color: CHART_PALETTE[0],
      group: 'Non-operational'
    },
    {
      key: 'health-injured',
      label: 'Injured persons recorded',
      value: numOr(ctx.data?.totals?.injured),
      color: CHART_PALETTE[5],
      group: 'Casualties'
    },
    {
      key: 'health-dead',
      label: 'Deaths recorded',
      value: numOr(ctx.data?.totals?.dead),
      color: CHART_PALETTE[6],
      group: 'Casualties'
    }
  ];
  return chartPayload({
    title: 'Health Facilities & Casualties – Live Analytics',
    subtitle: `${fmt(facilities)} health facilities assessed`,
    totalLabel: `${fmt(facilities)} facilities`,
    series,
    legend: { color: CHART_PALETTE[3], label: 'Health facility status and recorded casualties' },
    note: 'Facility counts come from Phase 2 health establishments.'
  });
}

function schoolChart(sector) {
  const partial = sumArea(sector, 'schoolPartial');
  const total = sumArea(sector, 'schoolTotal');
  const students = sumArea(sector, 'schoolStudents');
  const series = [
    {
      key: 'school-partial',
      label: 'Partially damaged school units',
      value: partial,
      color: CHART_PALETTE[0],
      group: 'Partially damaged'
    },
    {
      key: 'school-total',
      label: 'Totally damaged school units',
      value: total,
      color: CHART_PALETTE[1],
      group: 'Totally damaged'
    },
    {
      key: 'school-students',
      label: 'Students affected',
      value: students,
      color: CHART_PALETTE[2],
      group: 'Learners'
    }
  ];
  return chartPayload({
    title: 'School Damage – Live Analytics',
    subtitle: `${fmt(partial + total)} damaged school units recorded`,
    totalLabel: `${fmt(partial + total)} units`,
    series,
    legend: { color: CHART_PALETTE[0], label: 'School damage and affected learners' },
    note: 'School counts come from the Phase 2 education section.'
  });
}

function agricultureChart(sector) {
  const cropTotal = sumArea(sector, 'cropTotal');
  const cropPartial = sumArea(sector, 'cropPartial');
  const farmers = sumArea(sector, 'cropFarmers');
  const livestock = sumArea(sector, 'livestock');
  const series = [
    {
      key: 'crop-total',
      label: 'Totally damaged crops (ha)',
      value: cropTotal,
      color: CHART_PALETTE[1],
      group: 'Crops'
    },
    {
      key: 'crop-partial',
      label: 'Partially damaged crops (ha)',
      value: cropPartial,
      color: CHART_PALETTE[3],
      group: 'Crops'
    },
    {
      key: 'farmers',
      label: 'Affected farmers',
      value: farmers,
      color: CHART_PALETTE[4],
      group: 'Farmers'
    },
    {
      key: 'livestock',
      label: 'Affected livestock',
      value: livestock,
      color: CHART_PALETTE[5],
      group: 'Livestock'
    }
  ];
  return chartPayload({
    title: 'Agricultural Damage – Live Analytics',
    subtitle: `${fmtHa(cropTotal + cropPartial)} of damaged crops recorded`,
    totalLabel: fmtHa(cropTotal + cropPartial),
    series,
    legend: { color: CHART_PALETTE[1], label: 'Crop damage, affected farmers and livestock' },
    note: 'Agriculture figures come from Form 1 and Form 2 records.'
  });
}

function areaChart(ctx, primary, secondary, primaryLabel, secondaryLabel, title, subtitle) {
  const entries = topAreas(
    ctx.data?.barangays ? new Map(ctx.data.barangays.map((b) => [b.barangay, b])) : new Map(),
    primary,
    5,
    secondary
  );
  const series = seriesForAreas(entries, primary, secondary, primaryLabel, secondaryLabel);
  return chartPayload({
    title,
    subtitle,
    totalLabel: `${entries.length} areas`,
    series,
    legend: { color: CHART_PALETTE[0], label: `${primaryLabel} and ${secondaryLabel} per area` },
    note: 'Areas are ranked by recorded impact; the leftmost bars are the first to respond to.'
  });
}

function overviewChart(agencyId, ctx, sector) {
  if (agencyId === 'mdrrmo') {
    return areaChart(
      ctx,
      'families',
      'damaged',
      'affected families',
      'damaged units',
      'Barangay Impact Summary – Live Analytics',
      `${fmt(ctx.data?.totals?.families)} affected families recorded`
    );
  }
  if (agencyId === 'mho') {
    const entries = topAreas(sector, 'injured', 4, 'dead');
    const series = seriesForAreas(entries, 'injured', 'dead', 'injured persons', 'deaths');
    return chartPayload({
      title: 'Casualties by Area – Live Analytics',
      subtitle: `${fmt(ctx.data?.totals?.injured)} injured · ${fmt(ctx.data?.totals?.dead)} dead`,
      totalLabel: `${fmt(ctx.data?.totals?.injured + ctx.data?.totals?.dead)} cases`,
      series,
      legend: { color: CHART_PALETTE[0], label: 'Injuries and deaths recorded per area' },
      note: 'Casualty counts come from Phase 1 initial-effects sections.'
    });
  }
  if (agencyId === 'deped') {
    const entries = [...sector.entries()]
      .map(([label, row]) => ({
        label,
        row,
        value: numOr(row.schoolPartial) + numOr(row.schoolTotal) + numOr(row.schoolStudents)
      }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
    const series = seriesForAreas(
      entries,
      'schoolPartial',
      'schoolTotal',
      'partially damaged units',
      'totally damaged units'
    );
    return chartPayload({
      title: 'School Damage by Area – Live Analytics',
      subtitle: `${fmt(sumArea(sector, 'schoolPartial') + sumArea(sector, 'schoolTotal'))} damaged school units`,
      totalLabel: `${entries.length} areas`,
      series,
      legend: { color: CHART_PALETTE[0], label: 'Damaged school units per area' },
      note: 'School rows come from the Phase 2 education section.'
    });
  }
  if (agencyId === 'omag') {
    const entries = [...sector.entries()]
      .map(([label, row]) => ({
        label,
        row,
        value: numOr(row.cropTotal) + numOr(row.cropPartial)
      }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
    const series = seriesForAreas(
      entries,
      'cropTotal',
      'cropPartial',
      'totally damaged (ha)',
      'partially damaged (ha)'
    );
    return chartPayload({
      title: 'Crop Damage by Area – Live Analytics',
      subtitle: `${fmtHa(sumArea(sector, 'cropTotal') + sumArea(sector, 'cropPartial'))} damaged`,
      totalLabel: fmtHa(sumArea(sector, 'cropTotal') + sumArea(sector, 'cropPartial')),
      series,
      legend: { color: CHART_PALETTE[1], label: 'Damaged crop area per location' },
      note: 'Crop figures come from Form 1 and Form 2 records.'
    });
  }
  return areaChart(
    ctx,
    'families',
    'damaged',
    'affected families',
    'damaged units',
    'Municipal Impact Summary – Live Analytics',
    `${fmt(ctx.data?.totals?.families)} affected families recorded`
  );
}

export function buildAgencyChart(agencyId, ctx) {
  const sector = collectSector(ctx.incidents || []);
  const overview = overviewChart(agencyId, ctx, sector);
  let impact;
  if (agencyId === 'mho') impact = healthChart(ctx, sector);
  else if (agencyId === 'deped') impact = schoolChart(sector);
  else if (agencyId === 'omag') impact = agricultureChart(sector);
  else impact = housingChart(ctx);
  return { overview, impact };
}

export function buildAgencyMetrics(agencyId, ctx) {
  const totals = ctx.data?.totals || {};
  const sector = collectSector(ctx.incidents || []);
  const schoolUnits = sumArea(sector, 'schoolPartial') + sumArea(sector, 'schoolTotal');
  const schoolStudents = sumArea(sector, 'schoolStudents');
  const schoolCost =
    sumArea(sector, 'schoolCost') ||
    numOr((ctx.data?.buildingTypes || []).find((b) => /school/i.test(b.label))?.cost);
  const healthFacilities = sumArea(sector, 'healthFacilities');
  const healthDown = sumArea(sector, 'healthDown');
  const cropTotal = sumArea(sector, 'cropTotal');
  const cropPartial = sumArea(sector, 'cropPartial');
  const cropFarmers = sumArea(sector, 'cropFarmers');
  const headerFarmers = sumArea(sector, 'headerFarmers');
  const affectedFarmers = headerFarmers || cropFarmers;
  const livestock = sumArea(sector, 'livestock');
  const agriCost = sumArea(sector, 'agriCost');

  if (agencyId === 'mdrrmo') {
    return [
      {
        id: 'families',
        label: 'Affected Families',
        value: fmt(totals.families),
        icon: Users,
        tone: 'red',
        change: `${fmt(totals.personsAffected)} individuals`,
        status: 'critical',
        desc: `${fmt(totals.barangays)} barangays with recorded impact`
      },
      {
        id: 'displaced',
        label: 'Displaced Persons',
        value: fmt(totals.displaced),
        icon: House,
        tone: 'brand',
        change: `${fmt(totals.dead)} dead · ${fmt(totals.injured)} injured`,
        status: 'warning',
        desc: 'Evacuation and shelter requirements follow from this figure'
      },
      {
        id: 'housing',
        label: 'Damaged Housing Units',
        value: fmt(totals.damagedUnits),
        icon: Landmark,
        tone: 'blue',
        change: `${fmt(ctx.service?.housing?.totallyDamaged)} totally damaged`,
        status: 'info',
        desc: `${fmt(ctx.service?.housing?.partiallyDamaged)} partially damaged units`
      },
      {
        id: 'cost',
        label: 'Estimated Damage Cost',
        value: formatPesoShort(totals.cost),
        icon: ShieldAlert,
        tone: 'yellow',
        change: `${fmt(totals.assessments)} assessments`,
        status: 'neutral',
        desc: 'Consolidated value across all recorded damage'
      }
    ];
  }

  if (agencyId === 'mho') {
    return [
      {
        id: 'injured',
        label: 'Reported Injuries',
        value: fmt(totals.injured),
        icon: HeartPulse,
        tone: 'red',
        change: `${fmt(totals.dead)} reported deaths`,
        status: 'critical',
        desc: 'Injured persons recorded in Phase 1 assessments'
      },
      {
        id: 'deaths',
        label: 'Reported Deaths',
        value: fmt(totals.dead),
        icon: AlertTriangle,
        tone: 'purple',
        change: 'Phase 1 records',
        status: 'critical',
        desc: 'Deaths recorded in the initial effects section'
      },
      {
        id: 'facilities',
        label: 'Affected Health Facilities',
        value: fmt(healthFacilities),
        icon: Building2,
        tone: 'blue',
        change: `${fmt(healthDown)} non-operational`,
        status: 'warning',
        desc: 'Phase 2 health establishments'
      },
      {
        id: 'displaced',
        label: 'Displaced Persons',
        value: fmt(totals.displaced),
        icon: Users,
        tone: 'green',
        change: `${fmt(totals.personsAffected)} individuals affected`,
        status: 'info',
        desc: 'Health services must follow the displaced population'
      }
    ];
  }

  if (agencyId === 'deped') {
    return [
      {
        id: 'schools',
        label: 'Damaged School Facilities',
        value: fmt(schoolUnits),
        icon: School,
        tone: 'brand',
        change: `${fmt(sumArea(sector, 'schoolTotal'))} totally damaged`,
        status: 'critical',
        desc: 'School buildings recorded across all assessments'
      },
      {
        id: 'units',
        label: 'Affected School Units',
        value: fmt(schoolUnits),
        icon: Building2,
        tone: 'blue',
        change: `${fmt(sumArea(sector, 'schoolPartial'))} partially damaged`,
        status: 'warning',
        desc: 'Classrooms and facilities needing repair'
      },
      {
        id: 'learners',
        label: 'Affected Individuals',
        value: fmt(schoolStudents),
        icon: GraduationCap,
        tone: 'purple',
        change: `${fmt(schoolUnits)} school units`,
        status: 'info',
        desc: 'Learners affected by school damage or disruption'
      },
      {
        id: 'cost',
        label: 'School Damage Cost',
        value: formatPesoShort(schoolCost),
        icon: ClipboardList,
        tone: 'yellow',
        change: `${fmt(totals.assessments)} assessments`,
        status: 'neutral',
        desc: 'Estimated repair and replacement value'
      }
    ];
  }

  if (agencyId === 'omag') {
    return [
      {
        id: 'farmers',
        label: 'Affected Farmers',
        value: fmt(affectedFarmers),
        icon: Users,
        tone: 'brand',
        change: `${fmt(affectedFarmers)} registered in records`,
        status: 'critical',
        desc: 'Farmers affected by crop and fisheries damage'
      },
      {
        id: 'crops',
        label: 'Damaged Crops',
        value: fmtHa(cropTotal + cropPartial),
        icon: Sprout,
        tone: 'green',
        change: `${fmtHa(cropTotal)} totally damaged`,
        status: 'warning',
        desc: `${fmtHa(cropPartial)} partially damaged crop area`
      },
      {
        id: 'crop-loss',
        label: 'Crop Loss Estimate',
        value: formatPesoShort(agriCost),
        icon: Wheat,
        tone: 'yellow',
        change: 'Form 1 and Form 2 costing',
        status: 'info',
        desc: 'Estimated production and input losses'
      },
      {
        id: 'livestock',
        label: 'Affected Livestock',
        value: fmt(livestock),
        icon: Beef,
        tone: 'purple',
        change: `${fmt(sumArea(sector, 'cropTotal'))} farm structures`,
        status: 'neutral',
        desc: 'Dead, injured or missing livestock recorded'
      }
    ];
  }

  return [
    {
      id: 'families',
      label: 'Affected Families',
      value: fmt(totals.families),
      icon: Users,
      tone: 'brand',
      change: `${fmt(totals.personsAffected)} individuals`,
      status: 'info',
      desc: 'Consolidated from saved assessments'
    },
    {
      id: 'displaced',
      label: 'Displaced Persons',
      value: fmt(totals.displaced),
      icon: House,
      tone: 'blue',
      change: `${fmt(totals.damagedUnits)} damaged units`,
      status: 'warning',
      desc: 'Shelter and evacuation requirements'
    },
    {
      id: 'assessments',
      label: 'Assessments Filed',
      value: fmt(totals.assessments),
      icon: ClipboardList,
      tone: 'green',
      change: `${fmt(totals.barangays)} barangays`,
      status: 'neutral',
      desc: 'All saved RDANA assessments'
    },
    {
      id: 'cost',
      label: 'Estimated Damage Cost',
      value: formatPesoShort(totals.cost),
      icon: ShieldAlert,
      tone: 'yellow',
      change: 'All sectors',
      status: 'info',
      desc: 'Consolidated damage value'
    }
  ];
}

export function buildAgencyReporting(ctx) {
  const total = (ctx.incidents || []).length;
  const submitted = Math.min(total, numOr(ctx.service?.agencies?.submitted));
  const pending = Math.max(0, total - submitted);
  const complete = total > 0 && pending === 0;
  const status = complete ? 'Complete' : submitted > 0 ? 'In progress' : 'No submissions';
  return {
    title: 'Reporting Status',
    subtitle: 'Assessed against saved agency records',
    submitted,
    total,
    status,
    note:
      total === 0
        ? 'No assessments saved yet.'
        : pending === 0
          ? 'All saved assessments have been submitted.'
          : `${pending} of ${total} assessments still awaiting submission.`
  };
}

export function buildAgencyAssessments(agencyId, ctx) {
  return (ctx.incidents || []).map((inc) => {
    const type = formTypeOf(inc);
    const area = areaLabel(inc);
    const sector =
      type === 'building'
        ? 'Building Structure'
        : type === 'agriculture'
          ? 'Agriculture'
          : type === 'phase2'
            ? 'Phase 2'
            : 'Phase 1';
    let metrics;
    if (agencyId === 'mho') {
      metrics = [
        { label: 'Injured', value: fmt(inc.initialEffects?.injured?.total) },
        { label: 'Dead', value: fmt(inc.initialEffects?.dead?.total) },
        { label: 'Displaced', value: fmt(inc.initialEffects?.displaced?.total) }
      ];
    } else if (agencyId === 'deped') {
      const schools = inc.s12?.schools || [];
      const partial = schools.reduce((a, r) => a + numOr(r.partiallyDamaged), 0);
      const total = schools.reduce((a, r) => a + numOr(r.totallyDamaged), 0);
      metrics = [
        { label: 'Partial', value: fmt(partial) },
        { label: 'Totally damaged', value: fmt(total) },
        { label: 'School units', value: fmt(partial + total) }
      ];
    } else if (agencyId === 'omag') {
      const crops = inc.crops || [];
      const total = crops.reduce((a, r) => a + numOr(r.totallyDamaged), 0);
      const partial = crops.reduce((a, r) => a + numOr(r.partiallyDamaged), 0);
      metrics = [
        { label: 'Farmers', value: fmt(inc.header?.affectedFarmers) },
        { label: 'Crops (ha)', value: fmtHa(total + partial) },
        { label: 'Loss', value: formatPesoShort(inc.costing?.estimatedAmount) }
      ];
    } else {
      const profileRows = (ctx.data?.profileRows || []).filter((r) => r.incidentId === inc.id);
      const registerRows = (ctx.data?.registerRows || []).filter((r) => r.incidentId === inc.id);
      const families =
        numOr(inc.profile?.affectedFamilies) ||
        profileRows.reduce((a, r) => a + numOr(r.affectedFamilies), 0);
      const affected =
        numOr(inc.initialEffects?.affected?.total) ||
        (type === 'building' ? buildingAffectedIndividuals(inc) : 0);
      const cost =
        type === 'building'
          ? buildingCost(inc)
          : profileRows.reduce((a, r) => a + numOr(r.estimatedCost), 0) ||
            registerRows.reduce((a, r) => a + numOr(r.estimatedCost), 0);
      metrics = [
        { label: 'Families', value: fmt(families) },
        { label: 'Affected', value: fmt(affected) },
        { label: 'Cost', value: formatPesoShort(cost) }
      ];
    }
    return {
      id: String(inc.id),
      area,
      sector,
      status: inc.updatedAt ? 'Submitted' : 'Pending',
      metrics
    };
  });
}
