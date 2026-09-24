import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  requestPasswordReset,
  resetPassword as resetPasswordRequest,
} from '../api/auth';
import { clearStoredSession, getStoredSession } from '../lib/tokenStore';
import { getErrorMessage, SESSION_EXPIRED_EVENT, SESSION_UPDATED_EVENT } from '../api/client';
import type {
  AuthResponse,
  ChangePasswordInput,
  LoginInput,
  PasswordResetResponse,
  RegisterInput,
  ResetPasswordInput,
  User,
} from '../types';

export interface AuthResult {
  error: string | null;
  user?: User;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signUp: (input: RegisterInput) => Promise<AuthResult>;
  signIn: (input: LoginInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ response: PasswordResetResponse | null; error: string | null }>;
  resetPassword: (input: ResetPasswordInput) => Promise<AuthResult>;
  changePassword: (input: ChangePasswordInput) => Promise<AuthResult>;
  refreshProfile: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function authFailure(error: unknown): AuthResult {
  return { error: getErrorMessage(error) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const initialize = async (): Promise<void> => {
      if (!getStoredSession()) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        if (mounted) setUser(currentUser);
      } catch {
        if (mounted) {
          clearStoredSession();
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const handleSessionUpdated = (event: Event): void => {
      const response = (event as CustomEvent<AuthResponse>).detail;
      if (response?.user) setUser(response.user);
    };
    const handleSessionExpired = (): void => setUser(null);

    void initialize();
    window.addEventListener(SESSION_UPDATED_EVENT, handleSessionUpdated);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      mounted = false;
      window.removeEventListener(SESSION_UPDATED_EVENT, handleSessionUpdated);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const signUp = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    try {
      const response = await registerRequest(input);
      setUser(response.user);
      return { error: null, user: response.user };
    } catch (error: unknown) {
      return authFailure(error);
    }
  }, []);

  const signIn = useCallback(async (input: LoginInput): Promise<AuthResult> => {
    try {
      const response = await loginRequest(input);
      setUser(response.user);
      return { error: null, user: response.user };
    } catch (error: unknown) {
      return authFailure(error);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const session = getStoredSession();
    clearStoredSession();
    setUser(null);
    if (session?.refresh_token) {
      try {
        await logoutRequest(session.refresh_token);
      } catch {
        return;
      }
    }
  }, []);

  const forgotPassword = useCallback(
    async (email: string): Promise<{ response: PasswordResetResponse | null; error: string | null }> => {
      try {
        const response = await requestPasswordReset({ email });
        return { response, error: null };
      } catch (error: unknown) {
        return { response: null, error: getErrorMessage(error) };
      }
    },
    [],
  );

  const resetPassword = useCallback(async (input: ResetPasswordInput): Promise<AuthResult> => {
    try {
      await resetPasswordRequest(input);
      return { error: null };
    } catch (error: unknown) {
      return authFailure(error);
    }
  }, []);

  const changePassword = useCallback(async (input: ChangePasswordInput): Promise<AuthResult> => {
    try {
      await changePasswordRequest(input);
      clearStoredSession();
      setUser(null);
      return { error: null };
    } catch (error: unknown) {
      return authFailure(error);
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<AuthResult> => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return { error: null };
    } catch (error: unknown) {
      return authFailure(error);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      signUp,
      signIn,
      signOut,
      forgotPassword,
      resetPassword,
      changePassword,
      refreshProfile,
    }),
    [user, loading, signUp, signIn, signOut, forgotPassword, resetPassword, changePassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
