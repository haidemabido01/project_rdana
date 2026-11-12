/* ------------------------------------------------------------------ *
 * Placeholder content for the impact dashboard template.
 *
 * These are the labels the template ships with so the layout reads
 * correctly on first run. They are not records: every component takes
 * its content from props and only falls back to the entries below.
 * Bind real data by passing your own arrays — nothing else changes.
 * ------------------------------------------------------------------ */

export const PLACEHOLDER_META = {
  appName: 'ARDANA',
  appSubtitle: 'Agency Assessment & Reporting Portal',
  mode: 'Live'
};

/* The 8 cells of the agency picker (4 across on phones, 8 on wide
   screens). `name` and `role` fall back to a placeholder when the
   record does not carry them. */
export const PLACEHOLDER_AGENCIES = [
  { id: 'mdrrmo', code: 'MDRRMO', name: 'OCD - MDRRMO', role: 'Central Disaster Operations Administrator' },
  { id: 'omag', code: 'OMAG', name: 'Office of the Municipal Administrator', role: 'Municipal Administrator' },
  { id: 'mho', code: 'MHO', name: 'Municipal Health Office', role: 'Health Services Management' },
  { id: 'deped', code: 'DEPED', name: 'Department of Education Division Office', role: 'Education Continuity' },
  { id: 'mswdo', code: 'MSWDO', name: 'Municipal Social Welfare & Development Office', role: 'Social Protection' },
  { id: 'masso', code: 'MASSO', name: 'Municipal Agriculture Services Office', role: 'Agricultural Recovery' },
  { id: 'meo', code: 'MEO', name: 'Municipal Engineering Office', role: 'Infrastructure & Works' },
  { id: 'mpdo', code: 'MPDO', name: 'Municipal Planning and Development Office', role: 'Disaster Risk Management' }
];

export const PLACEHOLDER_INCIDENTS = [{ id: 'incident', label: 'Disaster Incident' }];
export const PLACEHOLDER_AREAS = [{ id: 'all', label: 'All Assigned Areas' }];

export const PLACEHOLDER_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'permissions', label: 'Permissions' }
];

export const PLACEHOLDER_METRICS = [
  { id: 'families', label: 'Affected Families', value: '—', icon: 'users' },
  { id: 'individuals', label: 'Affected Individuals', value: '—', icon: 'user' },
  { id: 'houses', label: 'Damaged Houses', value: '—', icon: 'house' },
  { id: 'submissions', label: 'Agency Submissions', value: '—', icon: 'clipboard' }
];

/* The chart template: empty fallback series when no records have been uploaded yet. */
export const PLACEHOLDER_CHART = {
  title: 'Municipal Impact Summary',
  xAxisLabel: 'Affected',
  yAxisTicks: [0, 1],
  bars: [],
  legend: { color: '#0066FF', label: 'Recorded assessment count' },
  disclaimer:
    'Live totals derived from uploaded data sets and saved RDANA assessment records.'
};

export const PLACEHOLDER_REPORTING = {
  submitted: 0,
  total: 0,
  status: 'In progress',
  note: 'Agency submissions awaiting completion.'
};
