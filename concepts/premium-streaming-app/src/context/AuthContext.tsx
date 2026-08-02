import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser } from '../api/auth.types';
import { supabase } from '../api/supabase';
import { useHistoryStore } from '../store/historyStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { logFailedLogin, logSuccessfulLogin } from '../services/securityLog';

interface AuthState {
  user: AuthUser | null;
  session: unknown;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restore auth state from Supabase session on mount
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setState({
          user: session.user as AuthUser,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
        // Load history and favorites from Supabase when authenticated
        useHistoryStore.getState().loadFromSupabase();
        useFavoritesStore.getState().loadFromSupabase();
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setState({
          user: session.user as AuthUser,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
        // Load history and favorites from Supabase when user logs in
        useHistoryStore.getState().loadFromSupabase();
        useFavoritesStore.getState().loadFromSupabase();
      } else {
        setState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Clear local data when user logs out
        useHistoryStore.getState().clearHistory();
        useFavoritesStore.setState({ favorites: [] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // Accept either email or username; if no @, assume it's an email
    const email = username.includes('@') ? username : `${username}@puchflix.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logFailedLogin(username, error.message).catch(() => {});
      throw error;
    }
    if (data.user) {
      logSuccessfulLogin(data.user.id).catch(() => {});
    }
    // State update is handled by onAuthStateChange listener
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    // Use Edge Function to create user with pre-confirmed email (no SMTP needed)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Supabase URL no configurada');
    const res = await fetch(`${supabaseUrl}/functions/v1/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    const data = await res.json();
    if (!res.ok) {
      logFailedLogin(email, data.error || 'Registration failed').catch(() => {});
      throw new Error(data.error || 'Error al registrar');
    }

    // Auto-login after registration
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      logFailedLogin(email, loginError.message).catch(() => {});
      throw loginError;
    }
    if (loginData.user) {
      logSuccessfulLogin(loginData.user.id).catch(() => {});
    }
    // State update is handled by onAuthStateChange listener
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // State update is handled by onAuthStateChange listener
  }, []);

  const refreshProfile = useCallback(async () => {
    // Trigger a session refresh - useful after profile updates
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setState((s) => ({ ...s, user: session.user as AuthUser, session }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
