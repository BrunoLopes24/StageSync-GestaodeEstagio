import type { LoginResponse, RefreshResponse } from '@/types/auth';
import { getRefreshToken } from '@/lib/tokenManager';
import { resolveApiBase } from '@/lib/api-base';

const API_BASE = resolveApiBase();

async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Credenciais inválidas');
  }

  return res.json();
}

export async function login(
  identifier: string,
  password: string,
): Promise<LoginResponse> {
  return authRequest<LoginResponse>('/login', { identifier, password });
}

export async function refreshToken(): Promise<RefreshResponse> {
  const token = getRefreshToken();
  if (!token) {
    throw new Error('No refresh token');
  }
  return authRequest<RefreshResponse>('/refresh', { refreshToken: token });
}

export async function logout(): Promise<void> {
  const token = getRefreshToken();
  if (!token) return;

  try {
    await authRequest('/logout', { refreshToken: token });
  } catch {
    // Logout failure is non-critical — tokens will be cleared locally
  }
}
