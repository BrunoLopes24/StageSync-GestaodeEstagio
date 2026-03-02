import { describe, it, expect, beforeEach } from 'vitest';
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
} from '@/lib/tokenManager';

describe('tokenManager', () => {
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
  });

  it('stores access token in memory after setTokens', () => {
    setTokens('access-123', 'refresh-456');
    expect(getAccessToken()).toBe('access-123');
  });

  it('stores refresh token in localStorage after setTokens', () => {
    setTokens('access-123', 'refresh-456');
    expect(localStorage.getItem('stagesync_refresh_token')).toBe('refresh-456');
  });

  it('getAccessToken returns null when no token set', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('getRefreshToken returns null when no token set', () => {
    expect(getRefreshToken()).toBeNull();
  });

  it('getRefreshToken reads from localStorage', () => {
    localStorage.setItem('stagesync_refresh_token', 'manual-token');
    expect(getRefreshToken()).toBe('manual-token');
  });

  it('clearTokens clears access token from memory', () => {
    setTokens('access-123', 'refresh-456');
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });

  it('clearTokens removes refresh token from localStorage', () => {
    setTokens('access-123', 'refresh-456');
    clearTokens();
    expect(localStorage.getItem('stagesync_refresh_token')).toBeNull();
  });

  it('isAuthenticated returns true when access token exists', () => {
    setTokens('access-123', 'refresh-456');
    expect(isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false when no access token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns false after clearTokens', () => {
    setTokens('access-123', 'refresh-456');
    clearTokens();
    expect(isAuthenticated()).toBe(false);
  });
});
