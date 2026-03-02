import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as tokenManager from '@/lib/tokenManager';

// Mock authService.refreshToken used by api.ts
const mockRefreshToken = vi.fn();
vi.mock('@/services/authService', () => ({
  refreshToken: (...args: unknown[]) => mockRefreshToken(...args),
}));

// Track window.location.href assignments
let locationHref = '/';
beforeEach(() => {
  locationHref = '/';
  Object.defineProperty(window, 'location', {
    value: {
      get href() {
        return locationHref;
      },
      set href(val: string) {
        locationHref = val;
      },
    },
    writable: true,
    configurable: true,
  });
});

// We need to re-import the api module fresh for each test to reset
// the module-level refreshPromise state.
async function getApi() {
  // Dynamically import to get a fresh module with reset refreshPromise
  const mod = await import('@/lib/api');
  return mod.api;
}

function createFetchResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
    localStorage.clear();
    mockRefreshToken.mockReset();
  });

  it('attaches Authorization header when access token exists', async () => {
    tokenManager.setTokens('my-access-token', 'my-refresh');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createFetchResponse(200, { data: 'ok' })),
    );

    const api = await getApi();
    await api.get('/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-access-token',
        }),
      }),
    );
  });

  it('does not attach Authorization header when no token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createFetchResponse(200, { data: 'ok' })),
    );

    const api = await getApi();
    await api.get('/test');

    const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(callHeaders).not.toHaveProperty('Authorization');
  });

  it('on 401, refreshes token and retries the request once', async () => {
    tokenManager.setTokens('expired-token', 'valid-refresh');

    mockRefreshToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresIn: '15m',
    });

    const fetchMock = vi
      .fn()
      // First call: 401
      .mockResolvedValueOnce(createFetchResponse(401))
      // Retry call: 200
      .mockResolvedValueOnce(createFetchResponse(200, { result: 'success' }));

    vi.stubGlobal('fetch', fetchMock);

    const api = await getApi();
    const result = await api.get<{ result: string }>('/protected');

    expect(result).toEqual({ result: 'success' });
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retried request uses the new access token', async () => {
    tokenManager.setTokens('old-token', 'refresh');

    mockRefreshToken.mockResolvedValue({
      accessToken: 'fresh-token',
      refreshToken: 'fresh-refresh',
      expiresIn: '15m',
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(401))
      .mockResolvedValueOnce(createFetchResponse(200, { ok: true }));

    vi.stubGlobal('fetch', fetchMock);

    const api = await getApi();
    await api.get('/protected');

    // The retry (second call) should have the new token
    const retryHeaders = fetchMock.mock.calls[1][1].headers;
    expect(retryHeaders.Authorization).toBe('Bearer fresh-token');
  });

  it('concurrent 401 calls share the same refresh promise', async () => {
    tokenManager.setTokens('expired', 'refresh');

    let resolveRefresh!: (value: unknown) => void;
    mockRefreshToken.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    let fetchCallCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount <= 3) {
        // First 3 calls all return 401
        return Promise.resolve(createFetchResponse(401));
      }
      // Retry calls return 200
      return Promise.resolve(createFetchResponse(200, { ok: true }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const api = await getApi();

    // Launch 3 concurrent requests that will all get 401
    const p1 = api.get('/a');
    const p2 = api.get('/b');
    const p3 = api.get('/c');

    // Let the event loop process the 401 responses
    await vi.waitFor(() => {
      expect(mockRefreshToken).toHaveBeenCalled();
    });

    // Only ONE refresh call should have been made
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);

    // Resolve the shared refresh
    resolveRefresh({
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      expiresIn: '15m',
    });

    // All 3 should complete successfully
    const results = await Promise.all([p1, p2, p3]);
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);

    // Confirm: 3 initial calls + 3 retries = 6 total fetch calls
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('refresh failure clears tokens and redirects to /login', async () => {
    tokenManager.setTokens('expired', 'bad-refresh');

    mockRefreshToken.mockRejectedValue(new Error('Refresh failed'));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createFetchResponse(401)),
    );

    const api = await getApi();

    await expect(api.get('/protected')).rejects.toThrow('Session expired');

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
    expect(locationHref).toBe('/login');
  });

  it('does not retry infinitely — only retries once after refresh', async () => {
    tokenManager.setTokens('expired', 'refresh');

    mockRefreshToken.mockResolvedValue({
      accessToken: 'still-bad',
      refreshToken: 'new-refresh',
      expiresIn: '15m',
    });

    // Both calls return 401 (even after refresh, the retry still fails)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(401))
      // Retry also fails — but should NOT trigger another refresh
      .mockResolvedValueOnce(createFetchResponse(403, { error: 'Forbidden' }));

    vi.stubGlobal('fetch', fetchMock);

    const api = await getApi();

    await expect(api.get('/protected')).rejects.toThrow('Forbidden');
    // Only 1 refresh, 2 fetch calls (original + retry)
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles non-JSON error responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('not json')),
      }),
    );

    const api = await getApi();

    await expect(api.get('/broken')).rejects.toThrow('Request failed');
  });

  it('handles 204 No Content responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('no body')),
      }),
    );

    const api = await getApi();
    const result = await api.delete('/resource');

    expect(result).toBeUndefined();
  });
});
