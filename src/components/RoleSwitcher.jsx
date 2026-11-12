import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  UserCheck,
  X,
  Layers
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { actorFromRole, recordAuditLog } from '../lib/audit';
import { ROLE_LEVELS, ROLE_LIST } from '../lib/roles';

export default function RoleSwitcher() {
  const { role, roleId, setRoleId } = useRole();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectRole = (newRoleId) => {
    const previous = role;
    const target = ROLE_LIST.find((r) => r.id === newRoleId);

    setRoleId(newRoleId);
    setOpen(false);

    if (target) {
      recordAuditLog({
        action: 'Switched active role',
        category: 'Authentication',
        severity: 'success',
        target: `${target.name} · ${target.agencyCode}`,
        details: `${previous.name} switched the simulated access level from ${previous.roleLabel} to ${target.roleLabel}.`,
        actor: actorFromRole(target)
      });
    }

    // Contextual redirection for best preview experience
    if (target?.level === ROLE_LEVELS.AGENCY) {
      navigate('/agency-overview');
    } else if (target?.level === ROLE_LEVELS.ADMIN) {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const superAdminRole = ROLE_LIST.find((r) => r.level === ROLE_LEVELS.SUPER_ADMIN);
  const adminRole = ROLE_LIST.find((r) => r.level === ROLE_LEVELS.ADMIN);
  const agencyRoles = ROLE_LIST.filter((r) => r.level === ROLE_LEVELS.AGENCY);

  return (
    <>
      {/* Floating Role Switcher Pill (Fixed in bottom-right corner) */}
      <div className="fixed bottom-4 right-4 z-50 font-sans print:hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-2 bg-navy-900/95 hover:bg-navy-900 text-white rounded-full shadow-lg border border-brand-500/40 hover:border-brand-500 backdrop-blur-md transition-all duration-150 text-xs font-medium cursor-pointer"
          title="Switch RBAC User Role / Access Level"
        >
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-slate-300">Access:</span>
          <span className="font-semibold text-white max-w-[140px] truncate">
            {role.name}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-brand-300 font-bold uppercase tracking-wider">
            {role.level === ROLE_LEVELS.SUPER_ADMIN
              ? 'Super Admin'
              : role.level === ROLE_LEVELS.ADMIN
              ? 'Admin'
              : role.agencyCode}
          </span>
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Modal / Popover Menu */}
        {open && (
          <div className="absolute bottom-12 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-navy-900 text-white flex items-center justify-between border-b border-navy-700">
              <div className="flex items-center gap-2">
                <Layers className="text-brand-500" size={17} />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    RBAC Role Simulator
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Preview UI for all 3 access levels &amp; 8 agencies
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Role List */}
            <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3 text-left">
              {/* LEVEL 1: SUPER ADMIN */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                  <span>Level 1 · Super Admin</span>
                  <span className="text-brand-600 font-semibold">Full Hub Access</span>
                </div>
                {superAdminRole && (
                  <button
                    type="button"
                    onClick={() => handleSelectRole(superAdminRole.id)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      roleId === superAdminRole.id
                        ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs flex-none shadow-sm">
                      {superAdminRole.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-navy-900">
                          {superAdminRole.name}
                        </span>
                        {roleId === superAdminRole.id && (
                          <Check size={14} className="text-brand-600 flex-none ml-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-brand-700 font-semibold truncate">
                        {superAdminRole.roleLabel}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Can see all 8 agencies via Agency Impact portal buttons.
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* LEVEL 2: ADMIN (MDRRMO) */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                  <span>Level 2 · Admin (MDRRMO)</span>
                  <span className="text-navy-700 font-semibold">Office Impact Only</span>
                </div>
                {adminRole && (
                  <button
                    type="button"
                    onClick={() => handleSelectRole(adminRole.id)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      roleId === adminRole.id
                        ? 'border-navy-500 bg-navy-50/60 ring-1 ring-navy-500'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-navy-700 text-white flex items-center justify-center font-bold text-xs flex-none shadow-sm">
                      {adminRole.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-navy-900">
                          {adminRole.name}
                        </span>
                        {roleId === adminRole.id && (
                          <Check size={14} className="text-navy-700 flex-none ml-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-navy-700 font-semibold truncate">
                        {adminRole.roleLabel}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Second highest authority. Impact tab shows MDRRMO only.
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* LEVEL 3: 7 AGENCIES */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                  <span>Level 3 · Agency / Office Users (7 Offices)</span>
                  <span className="text-slate-500">Custom Sidebar &amp; Reports</span>
                </div>
                <div className="space-y-1.5 mt-1">
                  {agencyRoles.map((aRole) => {
                    const active = roleId === aRole.id;
                    return (
                      <button
                        key={aRole.id}
                        type="button"
                        onClick={() => handleSelectRole(aRole.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] flex-none text-white ${
                              aRole.tone === 'violet'
                                ? 'bg-purple-600'
                                : aRole.tone === 'blue'
                                ? 'bg-blue-600'
                                : aRole.tone === 'green'
                                ? 'bg-emerald-600'
                                : aRole.tone === 'yellow'
                                ? 'bg-amber-600'
                                : aRole.tone === 'red'
                                ? 'bg-rose-600'
                                : 'bg-slate-600'
                            }`}
                          >
                            {aRole.initials}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {aRole.name}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                {aRole.agencyCode}
                              </span>
                              {!aRole.isMvp && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Soon
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {aRole.impactLabel} · {aRole.agencyName}
                            </p>
                          </div>
                        </div>
                        {active && <Check size={14} className="text-brand-600 flex-none ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>RBAC Simulation Mode</span>
              <span className="text-slate-400">Auth system arrives in next phase</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
