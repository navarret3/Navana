import { formatLongDate, getDayPart } from '@/features/today/greeting';

const at = (hour: number, minute = 0) => new Date(2026, 10, 12, hour, minute);

describe('getDayPart', () => {
  it.each([
    [6, 'morning'],
    [13, 'morning'],
    [14, 'afternoon'],
    [20, 'afternoon'],
    [21, 'evening'],
    [23, 'evening'],
    [0, 'evening'],
    [5, 'evening'],
  ] as const)('a las %i h es %s', (hour, expected) => {
    expect(getDayPart(at(hour))).toBe(expected);
  });

  it('cambia justo en el límite', () => {
    expect(getDayPart(at(13, 59))).toBe('morning');
    expect(getDayPart(at(20, 59))).toBe('afternoon');
  });
});

describe('formatLongDate', () => {
  it('escribe la fecha en español, sin año y con mayúscula inicial', () => {
    expect(formatLongDate(at(10), 'es')).toBe('Jueves, 12 de noviembre');
  });
});
