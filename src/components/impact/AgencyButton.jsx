import {
  Building2,
  GraduationCap,
  HardHat,
  HeartHandshake,
  HeartPulse,
  MapPinned,
  ShieldAlert,
  Sprout
} from 'lucide-react';

/* One icon and one accent per agency. The accent is only painted on
   the selected cell; unselected cells stay neutral. */
const AGENCY_STYLES = {
  mdrrmo: { icon: ShieldAlert, color: '#F97316', tint: '#FFF7ED' },
  omag: { icon: Building2, color: '#10B981', tint: '#ECFDF5' },
  mho: { icon: HeartPulse, color: '#2563EB', tint: '#EFF6FF' },
  deped: { icon: GraduationCap, color: '#8B5CF6', tint: '#F5F3FF' },
  mswdo: { icon: HeartHandshake, color: '#F43F5E', tint: '#FFF1F2' },
  masso: { icon: Sprout, color: '#65A30D', tint: '#F7FEE7' },
  meo: { icon: HardHat, color: '#475569', tint: '#F1F5F9' },
  mpdo: { icon: MapPinned, color: '#0891B2', tint: '#ECFEFF' }
};

const FALLBACK_STYLE = { icon: ShieldAlert, color: '#2563EB', tint: '#EFF6FF' };

/* ------------------------------------------------------------------ *
 * One cell of the 4 x 2 agency grid.
 *
 * Active -> the agency's accent border, tint and top line. Idle -> the
 * neutral system surface. Ready -> green dot, Upcoming -> amber dot.
 * Icons keep their neutral gray colour.
 * ------------------------------------------------------------------ */
export default function AgencyButton({ agency, active, onSelect, portal, upcoming }) {
  const style = AGENCY_STYLES[agency.id] || FALLBACK_STYLE;
  const Icon = style.icon;
  const name = agency.name || agency.code;
  const availability = upcoming ? 'coming soon' : 'ready';

  return (
    <button
      type="button"
      onClick={() => onSelect(agency.id)}
      aria-pressed={active}
      aria-label={`${name} — ${availability}`}
      title={`${name} — ${availability}${!upcoming && portal ? ' · open dashboard' : ''}`}
      className={`group relative flex min-h-[76px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border px-1 py-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] ${
        active
          ? 'text-navy-900 shadow-md ring-2 ring-[var(--agency-color)] ring-offset-1 ring-offset-white'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md'
      }`}
      style={
        active
          ? {
              '--agency-color': style.color,
              borderColor: style.color,
              backgroundColor: style.tint,
              boxShadow: `0 10px 24px -16px ${style.color}`
            }
          : undefined
      }
    >
      {active && (
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: style.color }}
          aria-hidden="true"
        />
      )}
      <span
        className={`absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white ${
          upcoming ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
        }`}
        aria-hidden="true"
      />
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-transform duration-150 group-hover:scale-105">
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <span
        className={`text-[11px] leading-none tracking-tight ${
          active ? 'font-bold text-navy-900' : 'font-semibold text-gray-600'
        }`}
      >
        {agency.code}
      </span>
    </button>
  );
}
