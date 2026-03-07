import { getPortugueseHolidays } from '../../utils/portuguese-holidays';
import { formatDateISO } from '../../utils/date-helpers';

describe('portuguese-holidays', () => {
  it('includes fixed national holidays', () => {
    const holidays = getPortugueseHolidays(2026);
    const dates = new Set(holidays.map((h) => formatDateISO(h.date)));

    expect(dates.has('2026-01-01')).toBe(true);
    expect(dates.has('2026-04-25')).toBe(true);
    expect(dates.has('2026-12-25')).toBe(true);
  });

  it('contains movable holidays', () => {
    const holidays = getPortugueseHolidays(2026);
    const names = holidays.map((h) => h.name);

    expect(names).toContain('Sexta-feira Santa');
    expect(names).toContain('Corpo de Deus');
  });
});
