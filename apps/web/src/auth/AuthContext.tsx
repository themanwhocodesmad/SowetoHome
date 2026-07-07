import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserDto } from '@soweto-stays/shared';
import { authApi } from '../api/auth.js';
import { refreshAccessToken, setAccessToken } from '../api/client.js';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setUser(await authApi.me());
    } catch {
      setUser(null);
    }
  }, []);

  // Runs once on app load: the access token only ever lives in memory, so a fresh page
  // load has none and must silently trade the httpOnly refresh cookie for a new one.
  const refresh = useCallback(async () => {
    setIsLoading(true);
    const token = await refreshAccessToken();
    if (token) {
      await loadUser();
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [loadUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
