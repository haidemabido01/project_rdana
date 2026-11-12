import { createContext, useCallback, useContext, useState } from 'react';
import { DEFAULT_ROLE_ID, ROLE_LEVELS, ROLES } from '../lib/roles';

const ROLE_STORAGE_KEY = 'rdana.active_role';

const RoleContext = createContext({
  role: ROLES[DEFAULT_ROLE_ID],
  roleId: DEFAULT_ROLE_ID,
  setRoleId: () => {},
  isSuperAdmin: true,
  isAdmin: false,
  isAgency: false
});

function readStoredRoleId() {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved && ROLES[saved]) {
      return saved;
    }
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_ROLE_ID;
}

export function RoleProvider({ children }) {
  const [roleId, setRoleIdState] = useState(readStoredRoleId);

  const setRoleId = useCallback((newId) => {
    if (ROLES[newId]) {
      setRoleIdState(newId);
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, newId);
      } catch {
        /* storage unavailable */
      }
    }
  }, []);

  const role = ROLES[roleId] || ROLES[DEFAULT_ROLE_ID];

  const isSuperAdmin = role.level === ROLE_LEVELS.SUPER_ADMIN;
  const isAdmin = role.level === ROLE_LEVELS.ADMIN;
  const isAgency = role.level === ROLE_LEVELS.AGENCY;

  return (
    <RoleContext.Provider
      value={{
        role,
        roleId,
        setRoleId,
        isSuperAdmin,
        isAdmin,
        isAgency
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
