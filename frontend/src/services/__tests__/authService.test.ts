import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, refreshToken, logout } from '@/services/authService';
import * as tokenManager from '@/lib/tokenManager';

const mockLoginResponse = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
  expiresIn: '15m',
  isNewAccount: false,
  user: {
    id: 'user-1',
    role: 'STUDENT' as const,
    studentNumber: '20001',
    email: 'student@school.pt',
  },
};

const mockRefreshResponse = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  expiresIn: '15m',
};

function mockFetchOk(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    }),
  );
}

function mockFetchError(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve(body ?? { error: 'Some backend error' }),
    }),
  );
}

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
    localStorage.clear();
  });

  describe('login', () => {
    it('returns tokens and user on success', async () => {
      mockFetchOk(mockLoginResponse);

      const result = await login('20001', 'password123');

      expect(result).toEqual(mockLoginResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ identifier: '20001', password: 'password123' }),
        }),
      );
    });

    it('throws normalized error on 401', async () => {
      mockFetchError(401, { error: 'Invalid credentials' });

      await expect(login('wrong', 'wrong')).rejects.toThrow('Credenciais inválidas');
    });

    it('throws normalized error on 403', async () => {
      mockFetchError(403, { error: 'Institutional validation failed' });

      await expect(login('user', 'pass')).rejects.toThrow('Credenciais inválidas');
    });

    it('throws normalized error on 429 rate limit', async () => {
      mockFetchError(429, { error: 'Too many login attempts' });

      await expect(login('user', 'pass')).rejects.toThrow('Credenciais inválidas');
    });

    it('never exposes backend error messages', async () => {
      mockFetchError(500, { error: 'Internal server error: DB connection failed' });

      try {
        await login('user', 'pass');
        expect.fail('Should have thrown');
      } catch (err) {
        expect((err as Error).message).toBe('Credenciais inválidas');
        expect((err as Error).message).not.toContain('DB connection');
      }
    });
  });

  describe('refreshToken', () => {
    it('sends stored refresh token', async () => {
      tokenManager.setTokens('old-access', 'stored-refresh');
      mockFetchOk(mockRefreshResponse);

      const result = await refreshToken();

      expect(result).toEqual(mockRefreshResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          body: JSON.stringify({ refreshToken: 'stored-refresh' }),
        }),
      );
    });

    it('throws when no refresh token available', async () => {
      await expect(refreshToken()).rejects.toThrow('No refresh token');
    });

    it('throws normalized error on failure', async () => {
      tokenManager.setTokens('access', 'refresh');
      mockFetchError(401, { error: 'Refresh token expired' });

      await expect(refreshToken()).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('logout', () => {
    it('sends stored refresh token to logout endpoint', async () => {
      tokenManager.setTokens('access', 'my-refresh');
      mockFetchOk({ message: 'Logged out successfully' });

      await logout();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          body: JSON.stringify({ refreshToken: 'my-refresh' }),
        }),
      );
    });

    it('does not throw when no refresh token', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      await expect(logout()).resolves.toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('swallows network errors gracefully', async () => {
      tokenManager.setTokens('access', 'refresh');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      );

      await expect(logout()).resolves.toBeUndefined();
    });

    it('swallows server errors gracefully', async () => {
      tokenManager.setTokens('access', 'refresh');
      mockFetchError(500);

      await expect(logout()).resolves.toBeUndefined();
    });
  });
});
