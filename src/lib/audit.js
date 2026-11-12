import { notifyDataChanged } from './refresh';
import { DEFAULT_ROLE_ID, ROLES } from './roles';

const STORAGE_KEY = 'rdana.audit_logs';
const ROLE_STORAGE_KEY = 'rdana.active_role';
const MAX_ENTRIES = 500;

export const AUDIT_CATEGORIES = [
  'Authentication',
  'Assessments',
  'Reports',
  'Agency Data',
  'User Management',
  'System'
];

export const AUDIT_CATEGORY_STYLES = {
  Authentication: 'bg-violet-50 text-violet-700 border-violet-200',
  Assessments: 'bg-brand-50 text-brand-700 border-brand-200',
  Reports: 'bg-blue-50 text-blue-700 border-blue-200',
  'Agency Data': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'User Management': 'bg-amber-50 text-amber-700 border-amber-200',
  System: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const AUDIT_SEVERITY_STYLES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200'
};

const ACTOR_TONES = {
  brand: 'bg-brand-500',
  navy: 'bg-navy-700',
  violet: 'bg-purple-600',
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  yellow: 'bg-amber-600',
  red: 'bg-rose-600',
  slate: 'bg-slate-600'
};

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function makeActor(name, role, initials, tone) {
  return { name, role, initials, tone };
}

const LEGACY_SEED_ID_RE = /^AUD-2026-00(0[1-9]|1[0-5])$/;

function buildSeedEntries() {
  return [];
}

function sortNewestFirst(entries) {
  return [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `AUD-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function replaceLegacyIdentity(value) {
  return value
    .replaceAll('Maria Santos', 'Crissalen Danao')
    .replaceAll('maria.santos', 'crissalen.danao');
}

function migrateEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  const next = { ...entry };

  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string') next[key] = replaceLegacyIdentity(value);
  }

  if (next.actor && typeof next.actor === 'object') {
    next.actor = { ...next.actor };
    for (const [key, value] of Object.entries(next.actor)) {
      if (typeof value === 'string') next.actor[key] = replaceLegacyIdentity(value);
    }
    if (next.actor.name === 'Crissalen Danao' && next.actor.initials === 'MS') {
      next.actor.initials = 'CD';
    }
  }

  return next;
}

function migrateEntries(entries) {
  return entries
    .filter((entry) => !LEGACY_SEED_ID_RE.test(String(entry?.id || '')))
    .map(migrateEntry);
}

export function listAuditLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded = buildSeedEntries();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return sortNewestFirst(seeded);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return sortNewestFirst(buildSeedEntries());

    const migrated = migrateEntries(parsed);
    if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    return sortNewestFirst(migrated);
  } catch {
    return sortNewestFirst(buildSeedEntries());
  }
}

export function actorFromRole(role) {
  if (!role) return makeActor('System', 'Automated service', 'SY', 'slate');
  return makeActor(role.name, role.roleLabel, role.initials, role.tone || 'slate');
}

export function currentActor() {
  try {
    const savedRoleId =
      typeof localStorage !== 'undefined' ? localStorage.getItem(ROLE_STORAGE_KEY) : null;
    const role = (savedRoleId && ROLES[savedRoleId]) || ROLES[DEFAULT_ROLE_ID];
    if (role) return actorFromRole(role);
  } catch {
    /* ignore storage error */
  }
  return makeActor('System', 'Automated service', 'SY', 'slate');
}

export function recordAuditLog({
  action,
  category = 'System',
  target = '—',
  details = '',
  severity = 'success',
  actor
}) {
  const entry = {
    id: createId(),
    timestamp: new Date().toISOString(),
    category,
    action,
    target,
    details,
    severity,
    ip: '192.168.1.24',
    device:
      typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent
        : 'Unknown device',
    actor: actor || currentActor()
  };

  try {
    const next = [entry, ...listAuditLogs()].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notifyDataChanged();
  } catch {
    /* storage unavailable — the entry is returned for in-session use only */
  }

  return entry;
}

export function actorToneClass(tone) {
  return ACTOR_TONES[tone] || ACTOR_TONES.slate;
}
