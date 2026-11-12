import * as XLSX from 'xlsx';
import { TAGBINA_BARANGAYS } from './constants';
import { blankMetric, createIncident, uid } from './model';

/* ------------------------------------------------------------------ *
 * Uploaded data set parsing + column summaries + Overview mapping.
 *
 * One code path for every supported file: SheetJS reads CSV and Excel
 * alike, so .csv / .xlsx / .xls all land on the same {columns, rows}
 * shape. Summaries are schema-agnostic — types are inferred per
 * column (number / date / text) so any file can drive analytics.
 * ------------------------------------------------------------------ */

const SUPPORTED = ['csv', 'xlsx', 'xls'];

const HEADER_HINT_RE =
  /barangay|brgy|area|location|incident|disaster|hazard|calamity|famil|affected|displaced|dead|death|casualt|injur|damage|cost|house|structure|building|purok|assessed|recorded/i;

export function isSupportedFile(fileName = '') {
  const ext = String(fileName).split('.').pop().toLowerCase();
  return SUPPORTED.includes(ext);
}

function detectHeaderRowIndex(headerRows) {
  const limit = Math.min(headerRows.length, 10);
  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < limit; i += 1) {
    const row = headerRows[i] || [];
    const nonEmpty = row.map((c) => String(c ?? '').trim()).filter(Boolean);
    if (!nonEmpty.length) continue;
    const hintMatches = nonEmpty.filter((c) => HEADER_HINT_RE.test(c)).length;
    const textCells = nonEmpty.filter((c) => Number.isNaN(Number(c.replace(/[,\s₱$%]/g, '')))).length;
    const score = hintMatches * 5 + textCells * 2 + nonEmpty.length;
    if (i === 0 && nonEmpty.length >= 2 && hintMatches >= 1) {
      return 0;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Read a File into { name, columns, rows } — rows are plain objects. */
export async function parseDatasetFile(file) {
  if (!isSupportedFile(file.name)) {
    throw new Error('Unsupported file type. Use a .csv, .xlsx or .xls file.');
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error('That workbook has no sheets to read.');
  const sheet = workbook.Sheets[firstSheet];

  const headerRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerIdx = detectHeaderRowIndex(headerRows);
  const header = (headerRows[headerIdx] || []).map(
    (h, i) => String(h || '').trim() || `Column ${i + 1}`
  );
  const seen = new Map();
  const columns = header.map((name) => {
    const n = (seen.get(name) || 0) + 1;
    seen.set(name, n);
    return n > 1 ? `${name} (${n})` : name;
  });

  const rows = [];
  for (let r = headerIdx + 1; r < headerRows.length; r += 1) {
    const line = headerRows[r];
    if (!line || line.every((cell) => String(cell).trim() === '')) continue;
    const row = {};
    columns.forEach((col, i) => {
      row[col] = normalizeCell(line[i]);
    });
    rows.push(row);
  }
  if (!rows.length) throw new Error('No data rows found under the header row.');

  return { name: file.name, columns, rows };
}

function normalizeCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') return value;
  return String(value).trim();
}

const NUMERIC_STRIP = /[,\s%$]/g;
const DATE_PATTERNS = [/^\d{4}-\d{2}-\d{2}/, /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, /^\d{1,2}-\d{1,2}-\d{4}$/];

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value).replace(NUMERIC_STRIP, '');
  if (text === '' || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function looksLikeDate(value) {
  if (value instanceof Date) return true;
  const text = String(value).trim();
  if (!text) return false;
  return DATE_PATTERNS.some((re) => re.test(text));
}

/**
 * Per-column statistics for any schema.
 * Returns { rowCount, columns: [{ name, type, filled, distinct,
 *   sum, avg, min, max, top: [{ value, count }] }] }.
 */
export function summarizeDataset(rows, columns) {
  const summaries = columns.map((name) => {
    const values = rows.map((r) => r[name]).filter((v) => v !== '' && v !== null && v !== undefined);
    const filled = values.length;
    const distinct = new Set(values.map((v) => String(v))).size;

    const numbers = values.map(toNumber);
    const numericCount = numbers.filter((n) => n !== null).length;
    const dateCount = values.filter(looksLikeDate).length;

    const freq = new Map();
    for (const v of values) {
      const key = String(v);
      freq.set(key, (freq.get(key) || 0) + 1);
    }
    const top = [...freq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    if (filled > 0 && numericCount / filled >= 0.8) {
      const nums = numbers.filter((n) => n !== null);
      const sum = nums.reduce((a, b) => a + b, 0);
      return {
        name,
        type: 'number',
        filled,
        distinct,
        top,
        sum,
        avg: sum / nums.length,
        min: Math.min(...nums),
        max: Math.max(...nums)
      };
    }
    if (filled > 0 && dateCount / filled >= 0.8) {
      const sorted = values.map((v) => String(v)).sort();
      return { name, type: 'date', filled, distinct, top, min: sorted[0], max: sorted[sorted.length - 1] };
    }
    return { name, type: 'text', filled, distinct, top };
  });

  return { rowCount: rows.length, columns: summaries };
}

/* ------------------------------------------------------------------ *
 * Convert an uploaded Excel/CSV dataset into incident records so the
 * Overview tab (dropdowns, 4 earthquake KPI cards, and Tagbina
 * barangay ranking bar chart) uses the Excel dataset as its source
 * of values.
 * ------------------------------------------------------------------ */

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

function resolveTagbinaBarangay(raw) {
  const cleaned = cleanBarangayKey(raw);
  if (!cleaned) return null;
  const exact = CANONICAL_BARANGAYS.find((b) => b.key === cleaned);
  if (exact) return exact.name;
  const contained = CANONICAL_BARANGAYS.find((b) => {
    const re = new RegExp(`(^|\\s)${b.key}(\\s|$)`, 'i');
    return re.test(cleaned);
  });
  return contained ? contained.name : null;
}

const SUMMARY_ROW_RE = /^(grand\s*total|tagbina\s*total|over\s*all\s*total|overall\s*total|sub\s*-?\s*total|total|sum|average)$/i;

function isSummaryRow(row, columns) {
  for (let i = 0; i < Math.min(3, columns.length); i += 1) {
    const val = String(row[columns[i]] ?? '').trim();
    if (SUMMARY_ROW_RE.test(val)) return true;
  }
  return false;
}

function findColumn(columns, patterns, exclude = []) {
  for (const re of patterns) {
    const match = columns.find(
      (col) => re.test(col) && !exclude.some((ex) => ex.test(col))
    );
    if (match) return match;
  }
  return null;
}

function parseMetricNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const raw = String(val).trim();
  if (!raw || /^[-—–n/a]+$/i.test(raw)) return null;
  const multMatch = raw.match(/([-+]?\d[\d,\s]*(?:\.\d+)?)\s*([mkb])\b/i);
  if (multMatch) {
    const base = Number(multMatch[1].replace(/[,\s]/g, ''));
    const unit = multMatch[2].toLowerCase();
    const mult = unit === 'b' ? 1e9 : unit === 'm' ? 1e6 : 1e3;
    return Number.isFinite(base) ? base * mult : null;
  }
  const stripped = raw
    .replace(/php|peso[s]?|[₱$,\s%]/gi, '')
    .trim();
  if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(stripped)) return null;
  const n = Number(stripped);
  return Number.isFinite(n) ? n : null;
}

function normalizeDamageLevel(raw, totallyDamaged, partiallyDamaged, damagedHouses, cost) {
  const s = String(raw || '').trim().toLowerCase();
  if (/total|destroy|collapse|100%/i.test(s)) return 'Totally Damaged';
  if (/severe|major|heavy|high|unsafe/i.test(s)) return 'Severe';
  if (/moderate|medium|partial|restricted/i.test(s)) return 'Moderate';
  if (/minor|low|light|slight/i.test(s)) return 'Low';
  if (/undamaged|none|no\s*damage|safe/i.test(s)) return 'Undamaged';
  if ((totallyDamaged || 0) > 0 && (totallyDamaged || 0) >= (partiallyDamaged || 0)) {
    return 'Totally Damaged';
  }
  if ((partiallyDamaged || 0) > 0 || (damagedHouses || 0) > 0 || (cost || 0) > 0) {
    return 'Moderate';
  }
  return 'Low';
}

function parseHazards(raw) {
  const s = String(raw || '').trim();
  if (!s) return ['Earthquake'];
  const out = [];
  if (/earthquake|quake|lindol|seismic|\beq\b/i.test(s)) out.push('Earthquake');
  if (/typhoon|bagyo|storm|cyclone/i.test(s)) out.push('Typhoon');
  if (/flood|baha|inundation/i.test(s)) out.push('Flood');
  if (/landslide|erosion/i.test(s)) out.push('Landslide');
  if (/volcan/i.test(s)) out.push('Volcano');
  if (/fire|sunog/i.test(s)) out.push('Fire');
  return out.length ? out : ['Earthquake'];
}

export function datasetToIncidents(dataset) {
  if (!dataset || !Array.isArray(dataset.rows) || !dataset.rows.length) return [];
  const columns = Array.isArray(dataset.columns) ? dataset.columns : Object.keys(dataset.rows[0] || {});

  const barangayCol = findColumn(columns, [
    /barangay|brgy|bgy|reporting\s*area|^area$|village|community/i,
    /location|site|place|address/i
  ]);
  const purokCol = findColumn(columns, [/purok|sitio|zone|prk/i]);
  const municipalityCol = findColumn(columns, [/municipality|city|\blgu\b|\bmun\b/i]);
  const provinceCol = findColumn(columns, [/province|\bprov\b/i]);
  const hazardCol = findColumn(columns, [
    /disaster|hazard|calamity|peril|type\s*of\s*(disaster|calamity|hazard|incident)|event\s*type|incident\s*type/i
  ]);
  const incidentCol = findColumn(columns, [
    /^incident(\s*name|\s*title)?$|^event(\s*name)?$|^assessment(\s*name|\s*title)?$|^case(\s*id)?$/i
  ]);
  const buildingNameCol = findColumn(columns, [
    /building\s*(name|id)|structure\s*(name|id)|facility\s*(name|id)|name\s*of\s*(the\s*)?(building|structure|facility)|building\s*\/\s*structure\s*name/i,
    /building\s*name|structure\s*name|facility\s*name|name\s*of\s*(building|structure|facility)/i
  ]);
  const buildingTypeCol = findColumn(columns, [
    /building\s*(type|classification|category)|structure\s*(type|classification)|type\s*of\s*(building|structure)|occupancy/i
  ]);
  const structureTypeCol = findColumn(columns, [
    /structure\s*type|structural\s*type|structure\s*material|construction\s*(material|type)|material/i
  ]);
  const assessorCol = findColumn(columns, [
    /assessor|inspector|surveyor|evaluator|assessed\s*by|conducted\s*by|encoder|validator|data\s*source/i
  ]);
  const officeCol = findColumn(columns, [
    /office|agency|department|organization|institution|source\s*of\s*data|reporting\s*office/i
  ]);
  const dateCol = findColumn(columns, [
    /date\s*of\s*(calamity|occurrence|incident|disaster|assessment)|occurrence\s*(time|date)|^date$|\bwhen\b/i
  ]);

  const costCol =
    findColumn(
      columns,
      [
        /estimated\s*damage\s*cost|damage\s*cost|estimated\s*cost|total\s*(damage\s*)?cost|cost\s*of\s*damage|damage\s*amount|amount\s*of\s*damage|estimated\s*amount|\bcost\b|\bphp\b|\bpeso\b|\bloss\b/i
      ],
      [/repair/i]
    ) ||
    findColumn(columns, [/repair.*cost|rehabilitation.*cost|\bcost\b/i]);
  const repairCostCol = findColumn(columns, [/repair.*cost|rehabilitation.*cost/i]);

  const totallyDamagedCol = findColumn(
    columns,
    [/totally\s*(damaged|destroyed)|total\s*loss|destroyed\s*(houses|units|structures|buildings)|severely\s*damaged/i],
    [/cost|php|amount|%/i]
  );
  const partiallyDamagedCol = findColumn(
    columns,
    [/partially\s*damaged|partial\s*damage|moderately\s*damaged|minor\s*damage/i],
    [/cost|php|amount|%/i]
  );
  const damagedHousesCol = findColumn(
    columns,
    [
      /damaged\s*(houses|units|structures|buildings|homes)|no\.?\s*of\s*damaged|(houses|units|structures|buildings)\s*damaged|^damaged$/i
    ],
    [/cost|php|amount|%|totally|partially/i]
  );
  const totalHousesCol = findColumn(
    columns,
    [/total\s*(houses|housing|units|structures|households)|housing\s*stock/i],
    [/damaged|destroyed|affected|cost|php|%/i]
  );
  const severityCol = findColumn(columns, [
    /damage\s*(severity|level|category|condition)|^severity$|^damage\s*status$|^condition$|structural\s*condition|usability/i
  ]);
  const familiesCol = findColumn(
    columns,
    [
      /affected\s*famil(y|ies)|famil(y|ies)\s*affected|no\.?\s*of\s*(affected\s*)?famil(y|ies)|households?\s*affected|affected\s*households?|families\s*served|\bfamil(y|ies)\b|\bhouseholds?\b/i
    ],
    [/cost|php|%/i]
  );
  const affectedCol = findColumn(
    columns,
    [
      /affected\s*(individuals?|persons?|population|people|residents?)|(individuals?|persons?|population|people|residents?)\s*affected|no\.?\s*of\s*(affected\s*)?(individuals?|persons?|people|residents?)|number\s*of\s*affected\s*individuals/i,
      /number\s*of\s*occupants|\boccupants\b|\bindividuals\b|\bpersons\b|population\s*\(2020\)|^population$/i
    ],
    [/%|percent|growth|change|2015|cost|php/i]
  );
  const displacedCol = findColumn(
    columns,
    [/displaced|evacuees?|evacuated|in\s*evacuation|inside\s*ec|outside\s*ec/i],
    [/%|cost|php/i]
  );
  const deadCol = findColumn(
    columns,
    [/\bdead\b|\bdeaths?\b|fatalit(y|ies)|casualt(y|ies)|deceased|killed/i],
    [/%|cost|php/i]
  );
  const injuredCol = findColumn(
    columns,
    [/\binjured\b|\binjur(y|ies)\b|wounded|hurt/i],
    [/%|cost|php/i]
  );
  const missingCol = findColumn(columns, [/\bmissing\b/i], [/%|cost|php/i]);
  const assessmentsCol = findColumn(
    columns,
    [
      /earthquake\s*(assessments?|incidents?|cases?|records?)|(recorded|assessed)\s*(earthquake\s*)?(incidents?|assessments?|cases?|structures?|buildings?|houses?)|no\.?\s*of\s*(earthquake\s*)?(assessments?|incidents?|records?|cases?)|\bassessments?\b|\bincidents?\b|\brecorded\b|\bassessed\b|\bfrequency\b|\bcount\b/i
    ],
    [/date|time|name|type|id|cost|php|%/i]
  );

  const hasRecognizedMetricCol = Boolean(
    costCol ||
      totallyDamagedCol ||
      partiallyDamagedCol ||
      damagedHousesCol ||
      familiesCol ||
      affectedCol ||
      displacedCol ||
      deadCol ||
      injuredCol ||
      assessmentsCol
  );

  // Fallback numeric column if a simple 2-column (Barangay + Number) sheet is uploaded
  const fallbackNumCol = !hasRecognizedMetricCol
    ? columns.find((col) => {
        if (col === barangayCol || col === purokCol || col === municipalityCol || col === provinceCol) {
          return false;
        }
        if (/%|percent|growth|change|year|id/i.test(col)) return false;
        const vals = dataset.rows.map((r) => parseMetricNumber(r[col])).filter((n) => n !== null);
        return vals.length > 0;
      })
    : null;

  const incidents = [];

  dataset.rows.forEach((row, idx) => {
    if (isSummaryRow(row, columns)) return;

    // 1. Resolve barangay
    let barangay = barangayCol ? resolveTagbinaBarangay(row[barangayCol]) : null;
    if (!barangay) {
      for (const col of columns) {
        const matched = resolveTagbinaBarangay(row[col]);
        if (matched) {
          barangay = matched;
          break;
        }
      }
    }
    if (!barangay && barangayCol) {
      const rawBrgy = String(row[barangayCol] ?? '').trim();
      if (rawBrgy && !SUMMARY_ROW_RE.test(rawBrgy)) barangay = rawBrgy;
    }
    if (!barangay) barangay = 'Poblacion';

    // 2. Parse numeric fields
    const primaryCost = costCol ? parseMetricNumber(row[costCol]) : null;
    const fallbackRepair =
      repairCostCol && repairCostCol !== costCol ? parseMetricNumber(row[repairCostCol]) : null;
    const cost = primaryCost !== null && primaryCost > 0 ? primaryCost : fallbackRepair ?? primaryCost ?? 0;

    let totallyDamaged = totallyDamagedCol ? parseMetricNumber(row[totallyDamagedCol]) : null;
    let partiallyDamaged = partiallyDamagedCol ? parseMetricNumber(row[partiallyDamagedCol]) : null;
    let damagedHouses = damagedHousesCol ? parseMetricNumber(row[damagedHousesCol]) : null;
    const totalHouses = totalHousesCol ? parseMetricNumber(row[totalHousesCol]) : null;

    let families = familiesCol ? parseMetricNumber(row[familiesCol]) : null;
    const affected = affectedCol ? parseMetricNumber(row[affectedCol]) : null;
    const displaced = displacedCol ? parseMetricNumber(row[displacedCol]) : null;
    const dead = deadCol ? parseMetricNumber(row[deadCol]) : null;
    const injured = injuredCol ? parseMetricNumber(row[injuredCol]) : null;
    const missing = missingCol ? parseMetricNumber(row[missingCol]) : null;
    const explicitAssessments = assessmentsCol ? parseMetricNumber(row[assessmentsCol]) : null;
    const fallbackNum = fallbackNumCol ? parseMetricNumber(row[fallbackNumCol]) : null;

    const severityRaw = severityCol ? String(row[severityCol] ?? '').trim() : '';
    const buildingName = buildingNameCol ? String(row[buildingNameCol] ?? '').trim() : '';
    const damageLevel = normalizeDamageLevel(
      severityRaw,
      totallyDamaged,
      partiallyDamaged,
      damagedHouses,
      cost
    );

    if (damagedHouses === null || damagedHouses === 0) {
      const sumSplit = (totallyDamaged || 0) + (partiallyDamaged || 0);
      if (sumSplit > 0) {
        damagedHouses = sumSplit;
      } else if (
        !damagedHousesCol &&
        (buildingName || (severityRaw && damageLevel !== 'Undamaged') || cost > 0)
      ) {
        damagedHouses = 1;
      }
    }

    if (totallyDamaged === null && partiallyDamaged === null && (damagedHouses || 0) > 0) {
      if (damageLevel === 'Totally Damaged') {
        totallyDamaged = damagedHouses;
        partiallyDamaged = 0;
      } else {
        totallyDamaged = 0;
        partiallyDamaged = damagedHouses;
      }
    }

    let assessmentCount = 1;
    if (assessmentsCol) {
      assessmentCount = Math.max(0, Math.round(explicitAssessments || 0));
    } else if (fallbackNumCol) {
      assessmentCount = Math.max(0, Math.round(fallbackNum || 0));
    } else if (!hasRecognizedMetricCol) {
      // Pure text/date incident log where each row is 1 recorded incident
      assessmentCount = 1;
    } else {
      const hasPositiveData =
        cost > 0 ||
        (damagedHouses || 0) > 0 ||
        (totallyDamaged || 0) > 0 ||
        (partiallyDamaged || 0) > 0 ||
        (families || 0) > 0 ||
        (affected || 0) > 0 ||
        (displaced || 0) > 0 ||
        (dead || 0) > 0 ||
        (injured || 0) > 0 ||
        (missing || 0) > 0 ||
        Boolean(buildingName) ||
        Boolean(severityRaw && damageLevel !== 'Undamaged');
      assessmentCount = hasPositiveData ? 1 : 0;
    }

    // Skip empty/zero template rows so unassessed barangays remain empty slots
    if (
      assessmentCount === 0 &&
      cost <= 0 &&
      !(damagedHouses > 0) &&
      !(families > 0) &&
      !(affected > 0) &&
      !(displaced > 0) &&
      !(dead > 0) &&
      !(injured > 0)
    ) {
      return;
    }

    if (families === null) {
      if (fallbackNumCol && fallbackNum > 0) {
        families = Math.round(fallbackNum);
      } else if ((damagedHouses || 0) > 0) {
        families = damagedHouses;
      } else if (assessmentsCol && assessmentCount > 0) {
        families = assessmentCount;
      } else if ((affected || 0) > 0) {
        families = Math.max(1, Math.round(affected / 5));
      } else {
        families = Math.max(1, assessmentCount);
      }
    }

    const inc = createIncident();
    inc.id = `${dataset.id || 'ds'}-row-${idx + 1}`;
    inc.formType = 'phase1';
    inc.source = 'dataset';
    inc.datasetName = dataset.name || '';
    inc.datasetAssessor = assessorCol ? String(row[assessorCol] ?? '').trim() : '';
    inc.datasetOffice = officeCol ? String(row[officeCol] ?? '').trim() : '';
    inc.datasetFields = {
      buildingName: Boolean(buildingNameCol),
      buildingType: Boolean(buildingTypeCol),
      structureType: Boolean(structureTypeCol),
      severity: Boolean(severityCol),
      units: Boolean(damagedHousesCol || totallyDamagedCol || partiallyDamagedCol),
      cost: Boolean(costCol),
      families: Boolean(familiesCol),
      affected: Boolean(affectedCol),
      displaced: Boolean(displacedCol)
    };
    inc.assessmentCount = Math.max(1, assessmentCount);

    const municipality =
      (municipalityCol && String(row[municipalityCol] ?? '').trim()) || 'Tagbina';
    const province =
      (provinceCol && String(row[provinceCol] ?? '').trim()) || 'Surigao del Sur';
    const purok = (purokCol && String(row[purokCol] ?? '').trim()) || '';
    const disasterTypes = parseHazards(hazardCol ? row[hazardCol] : 'Earthquake');
    const occurrenceTime = dateCol && row[dateCol] ? String(row[dateCol]).trim() : '';
    const incidentName =
      (incidentCol && String(row[incidentCol] ?? '').trim()) ||
      buildingName ||
      dataset.name ||
      '';

    inc.profile = {
      ...inc.profile,
      incidentName,
      siteLocation: buildingName || barangay,
      province,
      municipality,
      barangay,
      purok,
      disasterTypes,
      occurrenceTime,
      affectedFamilies: families || 0
    };
    inc.updatedAt = dataset.uploadedAt || occurrenceTime || inc.updatedAt;

    inc.initialEffects = {
      populationCensus: {
        ...blankMetric(),
        total: totalHouses ? totalHouses * 5 : affected || 0,
        totalManual: true
      },
      affected: {
        ...blankMetric(),
        total: affected !== null ? affected : families ? families * 4 : 0,
        totalManual: true
      },
      displaced: {
        ...blankMetric(),
        total: displaced || 0,
        totalManual: true
      },
      dead: {
        ...blankMetric(),
        total: dead || 0,
        totalManual: true
      },
      injured: {
        ...blankMetric(),
        total: injured || 0,
        totalManual: true
      },
      missing: {
        ...blankMetric(),
        total: missing || 0,
        totalManual: true
      }
    };

    const units = Math.max(1, damagedHouses || 1);
    inc.damage = {
      structures: [
        {
          id: uid(),
          barangay,
          purok,
          buildingType:
            (buildingTypeCol && String(row[buildingTypeCol] ?? '').trim()) || 'Residential House',
          buildingName: buildingName || '',
          structureType:
            (structureTypeCol && String(row[structureTypeCol] ?? '').trim()) ||
            'Concrete (Reinforced Concrete / CHB)',
          damageLevel,
          units: damagedHouses || 0,
          estimatedCost: cost || 0,
          remarks: ''
        }
      ],
      barangays: [
        {
          id: uid(),
          barangay,
          purok,
          totalHouses: totalHouses || damagedHouses || units,
          damagedHouses: damagedHouses || 0,
          totallyDamaged: totallyDamaged || 0,
          partiallyDamaged: partiallyDamaged || 0,
          affectedFamilies: families || 0,
          estimatedCost: cost || 0,
          remarks: ''
        }
      ],
      notes: ''
    };

    incidents.push(inc);
  });

  return incidents;
}
