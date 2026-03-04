import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthUser } from '@/types/auth';
import { setTokens, clearTokens, getRefreshToken } from '@/lib/tokenManager';
import * as authService from '@/services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  professorLogin: (email: string, code: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeUserFromToken(accessToken: string): AuthUser {
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  if (payload.role === 'PROFESSOR') {
    return { id: payload.sub, role: 'PROFESSOR' };
  }
  return {
    id: payload.sub,
    role: 'STUDENT',
    studentNumber: payload.studentNumber,
    email: payload.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await authService.refreshToken();
      setTokens(data.accessToken, data.refreshToken);
      setUser(decodeUserFromToken(data.accessToken));
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<AuthUser> => {
    const data = await authService.login(identifier, password);
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const professorLogin = useCallback(async (email: string, code: string): Promise<AuthUser> => {
    const data = await authService.professorLogin(email, code);
    setTokens(data.accessToken, data.refreshToken);
    const professorUser: AuthUser = { id: data.user.id, role: 'PROFESSOR' };
    setUser(professorUser);
    return professorUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearTokens();
    setUser(null);
  }, []);

  // Silent refresh on mount if refresh token exists
  useEffect(() => {
    const token = getRefreshToken();
    if (token) {
      refreshAuth().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        loading,
        login,
        professorLogin,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
