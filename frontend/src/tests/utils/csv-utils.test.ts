import { describe, it, expect, beforeEach, vi } from 'vitest';
import { importWorkLogsCsv } from '@/hooks/use-work-logs';

describe('CSV import utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses import response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ created: 1, updated: 0, skipped: 0, total: 1, errors: [] }),
    }));

    const result = await importWorkLogsCsv('date,type\n2026-03-01,NORMAL');

    expect(result.created).toBe(1);
  });

  it('throws backend message on import failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid CSV' }),
    }));

    await expect(importWorkLogsCsv('bad')).rejects.toThrow('Invalid CSV');
  });
});
