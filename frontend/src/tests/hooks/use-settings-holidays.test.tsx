import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteHoliday, useGenerateHolidays, useHolidays } from '@/hooks/use-holidays';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('use-settings and use-holidays hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches settings when enabled and skips when disabled', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ organizationName: 'StageSync' } as never);

    const enabled = createWrapper();
    const resultEnabled = renderHook(() => useSettings({ enabled: true, userId: 'u1' }), { wrapper: enabled.wrapper });
    await waitFor(() => expect(resultEnabled.result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/settings');

    vi.clearAllMocks();
    const disabled = createWrapper();
    renderHook(() => useSettings({ enabled: false, userId: 'u1' }), { wrapper: disabled.wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('updates settings and invalidates caches', async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ organizationName: 'StageSync' } as never);
    const { wrapper, qc } = createWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSettings(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ organizationName: 'StageSync' });
    });

    expect(api.put).toHaveBeenCalledWith('/settings', { organizationName: 'StageSync' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['settings'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('fetches holidays and runs holiday mutations', async () => {
    vi.mocked(api.get).mockResolvedValue([] as never);
    vi.mocked(api.post).mockResolvedValueOnce([] as never);
    vi.mocked(api.delete).mockResolvedValueOnce(undefined as never);

    const { wrapper, qc } = createWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const holidays = renderHook(() => useHolidays(2026), { wrapper });
    await waitFor(() => expect(holidays.result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/holidays?year=2026');

    const generate = renderHook(() => useGenerateHolidays(), { wrapper });
    await act(async () => {
      await generate.result.current.mutateAsync(2026);
    });

    const remove = renderHook(() => useDeleteHoliday(), { wrapper });
    await act(async () => {
      await remove.result.current.mutateAsync('holiday-1');
    });

    expect(api.post).toHaveBeenCalledWith('/holidays/generate/2026');
    expect(api.delete).toHaveBeenCalledWith('/holidays/holiday-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['holidays'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });
});
