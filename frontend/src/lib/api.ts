import { getAccessToken, setTokens, clearTokens } from '@/lib/tokenManager';
import { refreshToken as refreshAuthToken } from '@/services/authService';

function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');
  if (raw.endsWith('/api/v1')) return raw;
  if (raw.endsWith('/api')) return `${raw}/v1`;
  return `${raw}/api/v1`;
}

const API_BASE = resolveApiBase();

// Shared refresh lock to prevent concurrent refresh requests
let refreshPromise: Promise<void> | null = null;

async function handleTokenRefresh(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const data = await refreshAuthToken();
      setTokens(data.accessToken, data.refreshToken);
    } catch {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildHeaders(options?: RequestInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (res.status === 401) {
    // Attempt refresh once, then retry the original request
    await handleTokenRefresh();

    const retryRes = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: buildHeaders(options),
    });

    if (!retryRes.ok) {
      const error = await retryRes.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${retryRes.status}`);
    }

    if (retryRes.status === 204) return undefined as T;
    return retryRes.json();
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
