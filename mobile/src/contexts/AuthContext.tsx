import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, clearCookie } from '@/lib/api';
import type { Athlete, Coach } from '@/lib/types';

const USER_KEY = 'cf_user';
const ROLE_KEY = 'cf_role';

interface AuthState {
  authenticated: boolean;
  user: Athlete | Coach | null;
  role: 'athlete' | 'coach' | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  setUserLocally: (user: Athlete | Coach, role: 'athlete' | 'coach') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    user: null,
    role: null,
    loading: true,
  });

  const refreshSession = useCallback(async () => {
    try {
      const data = await api.get<{ authenticated: boolean; user?: Athlete | Coach; role?: 'athlete' | 'coach' }>('/api/session');
      if (data.authenticated && data.user && data.role) {
        setAuth({ authenticated: true, user: data.user, role: data.role, loading: false });
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        await SecureStore.setItemAsync(ROLE_KEY, data.role);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
        await SecureStore.deleteItemAsync(ROLE_KEY);
        setAuth({ authenticated: false, user: null, role: null, loading: false });
      }
    } catch {
      try {
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        const storedRole = await SecureStore.getItemAsync(ROLE_KEY);
        if (storedUser && storedRole) {
          setAuth({
            authenticated: true,
            user: JSON.parse(storedUser),
            role: storedRole as 'athlete' | 'coach',
            loading: false,
          });
          return;
        }
      } catch {}
      setAuth(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const setUserLocally = useCallback(async (user: Athlete | Coach, role: 'athlete' | 'coach') => {
    setAuth({ authenticated: true, user, role, loading: false });
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(ROLE_KEY, role);
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/logout');
    } catch {}
    await clearCookie();
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(ROLE_KEY);
    } catch {}
    setAuth({ authenticated: false, user: null, role: null, loading: false });
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ ...auth, refreshSession, logout, setUserLocally }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
