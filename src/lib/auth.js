const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'rdana.auth.token';
const USER_KEY = 'rdana.auth.user';
const LEGACY_SESSION_KEY = 'rdana.auth.session';

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(
      'Cannot reach the RDANA server. Start the FastAPI backend and try again.'
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === 'string' ? detail : 'The server could not complete the request.'
    );
  }

  return data;
}

export async function apiLogin(username, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function apiMe(token) {
  return apiRequest('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function apiLogout(token) {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

/* Opening the bare localhost URL (e.g. clicking http://localhost:5173/ in
   the terminal with no active hash route) always starts at the login screen,
   while reloading an active in-app route (#/dashboard, #/audit-logs, etc.)
   within the same tab preserves the session. */
const INITIAL_HASH = typeof window !== 'undefined' ? window.location.hash : '';
const IS_BARE_LOCALHOST_ENTRY =
  INITIAL_HASH === '' || INITIAL_HASH === '#' || INITIAL_HASH === '#/login';

if (IS_BARE_LOCALHOST_ENTRY) {
  clearAuth();
}

export function readStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* storage unavailable */
  }

  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { token: null, user: null, remember: false };
    }
    const rawUser = sessionStorage.getItem(USER_KEY);
    return {
      token,
      user: rawUser ? JSON.parse(rawUser) : null,
      remember: false
    };
  } catch {
    return { token: null, user: null, remember: false };
  }
}

export function persistAuth(token, user) {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable — the in-memory session still works */
  }
}

export function clearAuth() {
  const stores = [localStorage, sessionStorage];
  for (const storage of stores) {
    try {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
      storage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      /* storage unavailable */
    }
  }
}
