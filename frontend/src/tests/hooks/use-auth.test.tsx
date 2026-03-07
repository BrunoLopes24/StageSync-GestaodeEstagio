import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as authService from '@/services/authService';

vi.mock('@/services/authService', () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
}));

function Probe() {
  const { isAuthenticated, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
    </div>
  );
}

describe('useAuth integration', () => {
  it('starts unauthenticated when refresh token is absent', async () => {
    localStorage.clear();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });

  it('authenticates after successful silent refresh', async () => {
    localStorage.setItem('stagesync_refresh_token', 'refresh');
    vi.spyOn(authService, 'refreshToken').mockResolvedValue({
      accessToken: 'x.eyJzdWIiOiJ1MSIsInJvbGUiOiJTVFVERU5UIiwic3R1ZGVudE51bWJlciI6IjIwMDEiLCJlbWFpbCI6InN0dWRlbnRAc2Nob29sLnB0In0=.y',
      refreshToken: 'new-refresh',
      expiresIn: '15m',
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('true');
    });
  });
});
