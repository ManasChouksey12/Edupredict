import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiAuthMe, apiHealth, apiLogin } from '../utils/api';
import {
  EDUPREDICT_AUTH_JWT_KEY,
  EDUPREDICT_AUTH_USER_KEY,
  EDUPREDICT_OFFLINE_DEMO_KEY,
} from './authKeys';

const STORAGE_JWT = EDUPREDICT_AUTH_JWT_KEY;
const STORAGE_USER = EDUPREDICT_AUTH_USER_KEY;

export interface AuthUser {
  username: string;
  role: 'TEACHER' | 'STUDENT';
  studentRoll: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  offlineDemo: boolean;
  authReady: boolean;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
  enterOfflineDemo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseStoredUser(raw: string | null): AuthUser | null {
  try {
    if (!raw) return null;
    const o = JSON.parse(raw) as AuthUser;
    if (!o.username || (o.role !== 'TEACHER' && o.role !== 'STUDENT')) return null;
    if (typeof o.studentRoll !== 'string') o.studentRoll = '';
    return o;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_JWT);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<AuthUser | null>(() =>
    parseStoredUser(typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_USER) : null)
  );

  const [offlineDemo, setOfflineDemo] = useState<boolean>(() => {
    try {
      return localStorage.getItem(EDUPREDICT_OFFLINE_DEMO_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [authReady, setAuthReady] = useState(false);

  const persistJwt = useCallback((t: string | null, u: AuthUser | null) => {
    setTokenState(t);
    setUser(u);
    try {
      if (t) localStorage.setItem(STORAGE_JWT, t);
      else localStorage.removeItem(STORAGE_JWT);
      if (u) localStorage.setItem(STORAGE_USER, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_USER);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setAuthReady(true);
        return;
      }
      const okBackend = await apiHealth();
      if (cancelled) return;
      if (!okBackend) {
        persistJwt(null, null);
        setAuthReady(true);
        return;
      }
      try {
        const r = await apiAuthMe(token);
        if (cancelled) return;
        if (r.ok) {
          const body = await r.json();
          const normalized: AuthUser = {
            username: body.username,
            role: body.role === 'TEACHER' || body.role === 'STUDENT' ? body.role : 'STUDENT',
            studentRoll: typeof body.studentRoll === 'string' ? body.studentRoll : '',
          };
          setUser(normalized);
          localStorage.setItem(STORAGE_USER, JSON.stringify(normalized));
        } else {
          persistJwt(null, null);
        }
      } catch {
        if (!cancelled) persistJwt(null, null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persistJwt, token]);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      const trimmed = username.trim();
      try {
        const r = await apiLogin(trimmed, password);
        if (!r.ok) {
          return {
            ok: false,
            message: r.status === 401 ? 'Invalid username or password.' : 'Could not sign in.',
          };
        }
        const body = await r.json();
        const u: AuthUser = {
          username: trimmed,
          role:
            body.role === 'TEACHER' || body.role === 'STUDENT' ? body.role : 'STUDENT',
          studentRoll: typeof body.studentRoll === 'string' ? body.studentRoll : '',
        };
        persistJwt(body.token ?? null, u);
        setOfflineDemo(false);
        try {
          localStorage.removeItem(EDUPREDICT_OFFLINE_DEMO_KEY);
        } catch {
          /* ignore */
        }
        return { ok: true };
      } catch {
        return { ok: false, message: 'Cannot reach backend. Is Spring Boot running on port 8080?' };
      }
    },
    [persistJwt]
  );

  const logout = useCallback(() => {
    persistJwt(null, null);
    setOfflineDemo(false);
    try {
      localStorage.removeItem(EDUPREDICT_OFFLINE_DEMO_KEY);
    } catch {
      /* ignore */
    }
  }, [persistJwt]);

  const enterOfflineDemo = useCallback(() => {
    persistJwt(null, null);
    setOfflineDemo(true);
    try {
      localStorage.setItem(EDUPREDICT_OFFLINE_DEMO_KEY, '1');
    } catch {
      /* ignore */
    }
  }, [persistJwt]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      offlineDemo,
      authReady,
      login,
      logout,
      enterOfflineDemo,
    }),
    [authReady, enterOfflineDemo, login, logout, offlineDemo, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
