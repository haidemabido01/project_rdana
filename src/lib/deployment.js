export const DEFAULT_PARAMS = {
  familiesPerTeam: 500,
  personnelPerTeam: 5,
  puroksPerTeam: 4,
  minTeams: 1
};

export const LIFELINE_FIELDS = [
  { key: 'roads', label: 'Roads & Bridges' },
  { key: 'power', label: 'Electricity' },
  { key: 'water', label: 'Water Supply' },
  { key: 'comms', label: 'Communication' }
];

export const LIFELINE_STATUSES = [
  'Operational',
  'Intermittent',
  'Partially damaged',
  'Non-operational'
];

export const TEAM_ROLES = [
  'Team Leader',
  'Assessment Officer',
  'Data & Reports Officer',
  'Health & First Aid',
  'Logistics & Support'
];

const URGENCY_TONES = {
  Critical: 'red',
  High: 'orange',
  Moderate: 'yellow',
  Low: 'muted'
};

const HEADER_ALIASES = {
  area: ['area', 'area barangay', 'area name', 'barangay', 'barangay name', 'purok', 'sitio', 'location', 'place'],
  municipality: ['municipality', 'city', 'town', 'municipality name', 'city municipality'],
  puroks: ['puroks', 'puroks sitios', 'sitios', 'purok count', 'sitio count', 'number of puroks', 'no of puroks'],
  families: ['families', 'affected families', 'households', 'hh', 'families affected', 'no of families', 'number of families'],
  individuals: [
    'individuals', 'affected individuals', 'persons', 'people', 'people affected',
    'population affected', 'no of individuals', 'number of individuals'
  ],
  partial: [
    'houses partial', 'partially damaged houses', 'partially damaged', 'partial',
    'houses partially damaged', 'no of partially damaged houses', 'partially damaged house'
  ],
  total: [
    'houses total', 'totally damaged houses', 'totally damaged', 'total',
    'houses totally damaged', 'no of totally damaged houses', 'totally damaged house'
  ],
  dead: ['dead', 'deaths', 'dead persons', 'killed', 'no of dead', 'number of dead'],
  injured: ['injured', 'injuries', 'injured persons', 'no of injured', 'number of injured'],
  missing: ['missing', 'missing persons', 'no of missing', 'number of missing'],
  roads: ['roads and bridges', 'roads bridges', 'roads', 'bridges', 'road status'],
  power: ['electricity', 'power', 'power supply', 'electric'],
  water: ['water supply', 'water', 'water system', 'water supply system'],
  comms: ['communication', 'comms', 'communication network', 'communications', 'comm network'],
  needs: [
    'priority needs assistance', 'priority needs', 'needs', 'assistance',
    'priority needs assistance requested', 'priority need'
  ]
};

export const TEMPLATE_HEADERS = [
  'Area / Barangay', 'Municipality', 'Puroks / Sitios', 'Affected Families',
  'Affected Individuals', 'Partially Damaged Houses', 'Totally Damaged Houses',
  'Dead', 'Injured', 'Missing', 'Roads & Bridges', 'Electricity', 'Water Supply',
  'Communication', 'Priority Needs / Assistance'
];

export const num = (value) => {
  if (value === '' || value == null) return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const lifelineLevel = (status) => {
  if (status === 'Non-operational') return 'down';
  if (status === 'Partially damaged' || status === 'Intermittent') return 'partial';
  return 'up';
};

export function computeArea(row, params = DEFAULT_PARAMS) {
  const area = (row.area || '').trim();
  const families = num(row.families);
  const individuals = num(row.individuals);
  const partial = num(row.partial);
  const total = num(row.total);
  const dead = num(row.dead);
  const injured = num(row.injured);
  const missing = num(row.missing);
  const puroks = num(row.puroks);

  let down = 0;
  let partialLine = 0;
  for (const field of LIFELINE_FIELDS) {
    const level = lifelineLevel(row[field.key]);
    if (level === 'down') down += 1;
    if (level === 'partial') partialLine += 1;
  }

  const raw =
    individuals +
    total * 5 +
    partial * 1.5 +
    dead * 25 +
    missing * 15 +
    injured * 5 +
    down * 35 +
    partialLine * 12;

  const score = raw > 0 ? Math.round((raw / (raw + 1000)) * 100) : 0;

  let urgency = 'Low';
  if (score >= 70) urgency = 'Critical';
  else if (score >= 50) urgency = 'High';
  else if (score >= 25) urgency = 'Moderate';

  const p = { ...DEFAULT_PARAMS, ...params };
  const familiesPerTeam = Math.max(1, num(p.familiesPerTeam) || DEFAULT_PARAMS.familiesPerTeam);
  const puroksPerTeam = Math.max(1, num(p.puroksPerTeam) || DEFAULT_PARAMS.puroksPerTeam);
  const personnelPerTeam = Math.max(1, num(p.personnelPerTeam) || DEFAULT_PARAMS.personnelPerTeam);
  const minTeams = Math.max(1, num(p.minTeams) || DEFAULT_PARAMS.minTeams);

  const teamsByFamilies = families > 0 ? Math.ceil(families / familiesPerTeam) : 0;
  const teamsByCoverage = puroks > 0 ? Math.ceil(puroks / puroksPerTeam) : 0;
  const teams = Math.max(minTeams, teamsByFamilies, teamsByCoverage);
  const personnel = teams * personnelPerTeam;

  const drivers = [];
  if (individuals > 0) drivers.push(`${individuals.toLocaleString()} affected`);
  if (total > 0) drivers.push(`${total.toLocaleString()} houses totally damaged`);
  if (dead || injured || missing) {
    const parts = [];
    if (dead) parts.push(`${dead} dead`);
    if (injured) parts.push(`${injured} injured`);
    if (missing) parts.push(`${missing} missing`);
    drivers.push(parts.join(' · '));
  }
  if (down > 0) drivers.push(`${down} lifeline${down > 1 ? 's' : ''} down`);
  if (partialLine > 0) drivers.push(`${partialLine} lifeline${partialLine > 1 ? 's' : ''} partial`);

  return {
    id: row.id,
    area: area || 'Unnamed area',
    municipality: (row.municipality || '').trim(),
    hasArea: Boolean(area),
    families,
    individuals,
    partial,
    total,
    dead,
    injured,
    missing,
    puroks,
    roads: row.roads || '',
    power: row.power || '',
    water: row.water || '',
    comms: row.comms || '',
    needs: (row.needs || '').trim(),
    down,
    partialLine,
    score,
    urgency,
    tone: URGENCY_TONES[urgency],
    teams,
    personnel,
    teamsByFamilies,
    teamsByCoverage,
    drivers: drivers.slice(0, 4)
  };
}

export function buildDeploymentPlan(rows = [], params = DEFAULT_PARAMS) {
  const areas = rows
    .map((row) => computeArea(row, params))
    .filter((row) => row.hasArea)
    .sort((a, b) => b.score - a.score || b.individuals - a.individuals || a.area.localeCompare(b.area))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const totals = areas.reduce(
    (acc, row) => {
      acc.personnel += row.personnel;
      acc.teams += row.teams;
      acc.individuals += row.individuals;
      acc.families += row.families;
      if (row.urgency === 'Critical') acc.critical += 1;
      return acc;
    },
    { personnel: 0, teams: 0, individuals: 0, families: 0, critical: 0 }
  );

  return { areas, totals };
}

const normalizeHeader = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const HEADER_LOOKUP = Object.entries(HEADER_ALIASES).reduce((acc, [key, aliases]) => {
  for (const alias of aliases) acc[normalizeHeader(alias)] = key;
  return acc;
}, {});

const detectDelimiter = (text) => {
  const line = text.split(/\r?\n/).find((row) => row.trim()) || '';
  let best = ',';
  let bestCount = line.split(',').length - 1;
  for (const delimiter of [';', '\t', '|']) {
    const count = line.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
};

const parseRows = (text, delimiter) => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

const normalizeStatus = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return 'Operational';
  if (
    text.includes('non') || text.includes('not oper') || text.includes('down') ||
    text.includes('no service') || text === 'none'
  ) {
    return 'Non-operational';
  }
  if (text.includes('intermitt') || text.includes('sometimes')) return 'Intermittent';
  if (text.includes('partial') || text.includes('damage')) return 'Partially damaged';
  return 'Operational';
};

export function parseDeploymentCsv(text) {
  const clean = String(text || '').replace(/^\uFEFF/, '');
  const errors = [];
  const warnings = [];

  if (!clean.trim()) {
    return { rows: [], skipped: 0, unknownHeaders: [], errors: ['The file is empty.'], warnings };
  }

  const records = parseRows(clean, detectDelimiter(clean));
  const header = (records[0] || []).map(normalizeHeader);
  const index = {};
  header.forEach((name, i) => {
    const key = HEADER_LOOKUP[name];
    if (key && index[key] == null) index[key] = i;
  });

  if (index.area == null) {
    errors.push('No Area / Barangay column was found. Use the downloadable template.');
  }

  const recognized = header.filter((name) => HEADER_LOOKUP[name]);
  if (!recognized.length) {
    errors.push('No recognizable columns were found. Use the downloadable template.');
  }
  if (!['individuals', 'families', 'partial', 'total', 'dead', 'injured', 'missing'].some((key) => index[key] != null)) {
    warnings.push('No impact columns were recognized, so every area will rank Low.');
  }

  const unknownHeaders = [...new Set(header.filter((name) => name && !HEADER_LOOKUP[name]))];
  const rows = [];
  let skipped = 0;

  for (const record of records.slice(1)) {
    if (record.every((cell) => !String(cell).trim())) continue;
    const get = (key) => (index[key] != null ? String(record[index[key]] || '').trim() : '');
    const area = get('area');
    if (!area) {
      skipped += 1;
      continue;
    }
    const row = { area, municipality: get('municipality'), needs: get('needs') };
    for (const key of ['puroks', 'families', 'individuals', 'partial', 'total', 'dead', 'injured', 'missing']) {
      row[key] = get(key);
    }
    for (const field of LIFELINE_FIELDS) {
      row[field.key] = normalizeStatus(get(field.key));
    }
    rows.push(row);
  }

  if (!errors.length && !rows.length) {
    errors.push('No area rows were found in the file.');
  }

  return { rows, skipped, unknownHeaders, errors, warnings };
}

export function deploymentTemplateCsv() {
  return `\uFEFF${TEMPLATE_HEADERS.join(',')}\n`;
}

const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function deploymentCsv(plan) {
  const headers = [
    'Rank', 'Area', 'Municipality', 'Puroks/Sitios', 'Affected families', 'Affected individuals',
    'Partially damaged houses', 'Totally damaged houses', 'Dead', 'Injured', 'Missing',
    'Roads & Bridges', 'Electricity', 'Water supply', 'Communication', 'Priority needs',
    'Priority index', 'Urgency', 'Teams', 'Personnel'
  ];

  const lines = plan.areas.map((row) =>
    [
      row.rank, row.area, row.municipality, row.puroks, row.families, row.individuals,
      row.partial, row.total, row.dead, row.injured, row.missing,
      row.roads, row.power, row.water, row.comms, row.needs,
      row.score, row.urgency, row.teams, row.personnel
    ].map(csvCell).join(',')
  );

  return `\uFEFF${[headers.join(','), ...lines].join('\n')}`;
}
