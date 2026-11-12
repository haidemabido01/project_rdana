import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { actorFromRole, recordAuditLog } from '../lib/audit';
import {
  apiLogin,
  apiLogout,
  apiMe,
  clearAuth,
  persistAuth,
  readStoredAuth
} from '../lib/auth';
import { ROLES } from '../lib/roles';
import { useRole } from './RoleContext';

const AuthContext = createContext({
  account: null,
  checking: true,
  isAuthenticated: false,
  login: async () => ({ ok: false, error: 'Auth is not ready.' }),
  logout: async () => {}
});

export function AuthProvider({ children }) {
  const { setRoleId } = useRole();
  const [account, setAccount] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const stored = readStoredAuth();

    if (!stored.token) {
      setChecking(false);
      return () => {
        active = false;
      };
    }

    apiMe(stored.token)
      .then((user) => {
        if (!active) return;
        setAccount(user);
        setRoleId(user.roleId);
        persistAuth(stored.token, user, stored.remember);
      })
      .catch(() => {
        if (!active) return;
        clearAuth();
        setAccount(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [setRoleId]);

  const login = useCallback(
    async (username, password, remember = true) => {
      const cleanUsername = String(username || '').trim().toLowerCase();

      try {
        const result = await apiLogin(cleanUsername, password);
        const nextAccount = result.user;

        persistAuth(result.access_token, nextAccount, remember);
        setAccount(nextAccount);
        setRoleId(nextAccount.roleId);

        recordAuditLog({
          action: 'Signed in to RDANA portal',
          category: 'Authentication',
          severity: 'success',
          target: `${nextAccount.name} · ${nextAccount.agencyCode}`,
          details: `${nextAccount.name} authenticated as ${nextAccount.roleLabel}.`,
          actor: actorFromRole(ROLES[nextAccount.roleId])
        });

        return { ok: true, account: nextAccount };
      } catch (error) {
        const message = error?.message || 'Unable to sign in. Please try again.';

        recordAuditLog({
          action: 'Failed sign-in attempt',
          category: 'Authentication',
          severity: 'critical',
          target: 'RDANA Portal',
          details: `Failed login for username "${cleanUsername || 'unknown'}". ${message}`,
          actor: {
            name: cleanUsername || 'Unknown user',
            role: 'Unrecognized credentials',
            initials: '??',
            tone: 'red'
          }
        });

        return { ok: false, error: message };
      }
    },
    [setRoleId]
  );

  const logout = useCallback(async () => {
    const stored = readStoredAuth();

    if (account?.roleId) {
      recordAuditLog({
        action: 'Signed out of RDANA portal',
        category: 'Authentication',
        severity: 'success',
        target: `${account.name} · ${account.agencyCode}`,
        details: `${account.name} ended the session and returned to the login screen.`,
        actor: actorFromRole(ROLES[account.roleId])
      });
    }

    clearAuth();
    setAccount(null);

    if (stored.token) {
      try {
        await apiLogout(stored.token);
      } catch {
        /* the local session is already cleared */
      }
    }
  }, [account]);

  const value = useMemo(
    () => ({
      account,
      checking,
      isAuthenticated: !!account,
      login,
      logout
    }),
    [account, checking, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
