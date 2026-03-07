import { describe, it, expect } from 'vitest';
import { formatHours } from '@/lib/utils';

describe('formatHours', () => {
  it('keeps one decimal precision', () => {
    expect(formatHours(10)).toBe('10.0h');
    expect(formatHours(10.49)).toBe('10.5h');
  });
});
