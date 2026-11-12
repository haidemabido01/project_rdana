import { NavLink } from 'react-router-dom';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

/* ------------------------------------------------------------------ *
 * Sidebar navigation (RBAC aware).
 *
 * Renders custom navigation and profile for:
 * 1. Super Admin (Crissalen Danao): Overview, Agency Impact (all 8 hub), Reports, Assessments
 * 2. Admin (MDRRMO Admin): Overview, MDRRMO Impact (direct), Reports, Assessments
 * 3. Agency Users (7 offices): Overview (Agency), [Agency] Impact, Reports, Assessments
 * ------------------------------------------------------------------ */
export default function Sidebar({ onNavigate, onLogout, collapsed, onToggleCollapse }) {
  const { role, isSuperAdmin, isAdmin, isAgency } = useRole();

  // Dynamically craft navigation based on active RBAC role
  const navItems = [
    {
      to: isAgency ? '/agency-overview' : '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      end: false
    },
    {
      to: isSuperAdmin
        ? '/impact'
        : isAdmin
        ? '/impact/mdrrmo'
        : `/impact/${role.agencyId}`,
      label: isSuperAdmin
        ? 'Agency Impact'
        : isAdmin
        ? 'MDRRMO Impact'
        : (role.impactLabel || `${role.agencyCode} Impact`),
      icon: Gauge,
      end: true
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: FileSpreadsheet,
      end: false
    },
    {
      to: '/archive',
      label: 'Archive',
      icon: Archive,
      end: false
    },
    {
      to: '/',
      label: 'Assessments',
      icon: ClipboardList,
      end: true
    },
    ...(isSuperAdmin
      ? [
          {
            to: '/data-sets',
            label: 'Data Sets',
            icon: Database,
            end: true
          },
          {
            to: '/audit-logs',
            label: 'Audit Logs',
            icon: ScrollText,
            end: true
          }
        ]
      : [])
  ];

  return (
    <div className="side-inner">
      <div className="side-head">
        <div className="side-brand">
          <span className="side-brand-logo">
            <img src="/icons/icon-192.png" alt="" width="38" height="38" />
          </span>
          <span className="side-brand-text">
            RDANA
            <small>Digital Assessment</small>
          </span>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            className="side-collapse"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronRight size={15} strokeWidth={2.4} />
            ) : (
              <ChevronLeft size={15} strokeWidth={2.4} />
            )}
          </button>
        )}
      </div>


      <div className="side-divider" aria-hidden="true" />

      <nav className="side-nav" aria-label="Main">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.end}
              className="side-link"
              onClick={onNavigate}
              title={item.label}
            >
              <Icon className="side-link-icon" size={17} strokeWidth={2} />
              <span className="side-link-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="side-divider" aria-hidden="true" />

      <div className="side-foot">
        <div
          className="side-user"
          title={`${role.name} · ${role.email} (${role.roleLabel})`}
        >
          <span
            className={`side-avatar font-bold text-xs text-white ${
              role.tone === 'violet'
                ? 'bg-purple-600'
                : role.tone === 'blue'
                ? 'bg-blue-600'
                : role.tone === 'green'
                ? 'bg-emerald-600'
                : role.tone === 'yellow'
                ? 'bg-amber-600'
                : role.tone === 'red'
                ? 'bg-rose-600'
                : 'bg-brand-500'
            }`}
          >
            {role.initials}
          </span>
          <span className="side-user-info">
            <span className="side-user-name font-bold flex items-center gap-1">
              <span className="truncate">{role.name}</span>
            </span>
            <span className="side-user-email text-[11px] text-slate-400 truncate">
              {role.roleLabel}
            </span>
          </span>
        </div>

        <button
          type="button"
          className="side-logout"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut className="side-link-icon" size={15} strokeWidth={2} />
          <span className="side-link-text">Sign out</span>
        </button>
      </div>
    </div>
  );
}
