import {
  addDays,
  daysFrom,
  diffDays,
  startOfMonth,
  startOfWeek,
  toDateKey,
  upcomingWeekend,
} from '@/domain/dates';

describe('fechas de calendario', () => {
  it('usa el día local del dispositivo', () => {
    expect(toDateKey(new Date(2026, 10, 12, 23, 59))).toBe('2026-11-12');
    expect(toDateKey(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });

  it('suma y resta días cruzando meses, años y cambios de hora', () => {
    expect(addDays('2026-11-12', 1)).toBe('2026-11-13');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    // Fin de semana del cambio de hora en España.
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });

  it('cuenta los días entre dos fechas', () => {
    expect(diffDays('2026-11-12', '2026-11-12')).toBe(0);
    expect(diffDays('2026-11-12', '2026-11-15')).toBe(3);
    expect(diffDays('2026-11-15', '2026-11-12')).toBe(-3);
    expect(diffDays('2026-10-20', '2026-10-30')).toBe(10);
  });

  it('la semana empieza en lunes', () => {
    expect(startOfWeek('2026-11-12')).toBe('2026-11-09'); // jueves
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09'); // lunes
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09'); // domingo
  });

  it('lista días seguidos desde uno dado, también cruzando de mes', () => {
    expect(daysFrom('2026-11-13', 7)).toEqual([
      '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19',
    ]);
    expect(daysFrom('2026-11-29', 3)).toEqual(['2026-11-29', '2026-11-30', '2026-12-01']);
    expect(daysFrom('2026-11-13', 0)).toEqual([]);
  });

  it('el próximo fin de semana es el sábado, o el mismo día si ya es fin de semana', () => {
    expect(upcomingWeekend('2026-11-12')).toBe('2026-11-14'); // jueves → sábado
    expect(upcomingWeekend('2026-11-09')).toBe('2026-11-14'); // lunes → sábado
    expect(upcomingWeekend('2026-11-14')).toBe('2026-11-14'); // sábado
    expect(upcomingWeekend('2026-11-15')).toBe('2026-11-15'); // domingo
  });

  it('da el primer día del mes', () => {
    expect(startOfMonth('2026-11-12')).toBe('2026-11-01');
  });
});
