import { describe, it, expect } from 'vitest';
import { formatDate, formatHours } from '@/lib/utils';

describe('format utils', () => {
  it('formats dates in pt-PT format', () => {
    expect(formatDate('2026-03-06')).toBe('06/03/2026');
  });

  it('formats hours with one decimal', () => {
    expect(formatHours(7)).toBe('7.0h');
    expect(formatHours(7.25)).toBe('7.3h');
  });
});
