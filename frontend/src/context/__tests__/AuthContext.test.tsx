import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as authService from '@/services/authService';
import * as tokenManager from '@/lib/tokenManager';

vi.mock('@/services/authService', () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
}));

const mockUser = {
  id: 'user-1',
  role: 'STUDENT' as const,
  studentNumber: '20001',
  email: 'student@school.pt',
};

// Build a fake JWT with the given payload (header.payload.signature)
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

const mockAccessToken = fakeJwt({
  sub: mockUser.id,
  role: mockUser.role,
  studentNumber: mockUser.studentNumber,
  email: mockUser.email,
});

// Helper component that exposes auth context values for testing
function AuthConsumer() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <button data-testid="login-btn" onClick={() => login('20001', 'pass')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
    localStorage.clear();
  });

  it('starts with loading=true then resolves to false (no refresh token)', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('silent refresh succeeds → user set, isAuthenticated true', async () => {
    // Pre-set a refresh token in localStorage to trigger silent refresh
    localStorage.setItem('stagesync_refresh_token', 'existing-refresh');

    vi.mocked(authService.refreshToken).mockResolvedValue({
      accessToken: mockAccessToken,
      refreshToken: 'new-refresh',
      expiresIn: '15m',
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    const user = JSON.parse(screen.getByTestId('user').textContent!);
    expect(user).toEqual(mockUser);
  });

  it('silent refresh fails → tokens cleared, isAuthenticated false', async () => {
    localStorage.setItem('stagesync_refresh_token', 'expired-refresh');

    vi.mocked(authService.refreshToken).mockRejectedValue(new Error('expired'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(tokenManager.getAccessToken()).toBeNull();
  });

  it('login() updates state with user data', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiresIn: '15m',
      isNewAccount: false,
      user: mockUser,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    const user = JSON.parse(screen.getByTestId('user').textContent!);
    expect(user).toEqual(mockUser);
  });

  it('logout() clears user state', async () => {
    // Start logged in via silent refresh
    localStorage.setItem('stagesync_refresh_token', 'existing-refresh');
    vi.mocked(authService.refreshToken).mockResolvedValue({
      accessToken: mockAccessToken,
      refreshToken: 'new-refresh',
      expiresIn: '15m',
    });
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});
