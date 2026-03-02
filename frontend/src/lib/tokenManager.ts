const REFRESH_TOKEN_KEY = 'stagesync_refresh_token';

let accessToken: string | null = null;

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return accessToken !== null;
}
