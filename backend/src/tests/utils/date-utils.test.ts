import { formatDateISO, isWorkDay, getWeekRange, getMonthRange } from '../../utils/date-helpers';

describe('date-helpers', () => {
  it('formats ISO dates', () => {
    expect(formatDateISO(new Date('2026-03-06T12:00:00Z'))).toBe('2026-03-06');
  });

  it('excludes weekends from work days', () => {
    const saturday = new Date('2026-03-07T00:00:00Z');
    expect(isWorkDay(saturday, new Set())).toBe(false);
  });

  it('excludes configured holidays from work days', () => {
    const monday = new Date('2026-03-09T00:00:00Z');
    expect(isWorkDay(monday, new Set(['2026-03-09']))).toBe(false);
  });

  it('computes week and month ranges', () => {
    const week = getWeekRange(new Date('2026-03-11'));
    const month = getMonthRange(2026, 3);

    expect(week.start).toBeInstanceOf(Date);
    expect(month.end).toBeInstanceOf(Date);
  });
});
