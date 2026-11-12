import {
  daysOf,
  daysUntil,
  occurrencesBetween,
  upcomingOccurrences,
} from '@/domain/agenda/occurrences';
import { planEventReminders } from '@/domain/agenda/reminders';
import {
  EVENT_TYPES,
  eventTypeOf,
  involves,
  isValidTime,
  type AgendaEvent,
} from '@/domain/agenda/types';
import { addMonths, monthMatrix, yearMonthOf } from '@/domain/dates';

const ANA = 'ana';
const BRUNO = 'bruno';
const TODAY = '2026-11-12';
/** Jueves 12 de noviembre de 2026, a las 10:00. */
const NOW = new Date(2026, 10, 12, 10, 0);

function event(overrides: Partial<AgendaEvent> = {}): AgendaEvent {
  return {
    id: 'e1',
    title: 'Cena',
    type: 'event',
    date: '2026-11-14',
    endDate: null,
    time: '21:00',
    location: '',
    notes: '',
    participants: [],
    reminders: [],
    yearly: false,
    ...overrides,
  };
}

const birthday = (date: string, overrides: Partial<AgendaEvent> = {}) =>
  event({ id: 'b', title: 'Cumple', date, time: null, yearly: true, ...overrides });

describe('tipos de evento', () => {
  it('reconoce los tipos actuales', () => {
    expect(EVENT_TYPES).toEqual(['trip', 'concert', 'appointment', 'event']);
    for (const type of EVENT_TYPES) expect(eventTypeOf(type)).toBe(type);
  });

  it('lo guardado con los tipos antiguos o con un valor raro se muestra como evento', () => {
    expect(eventTypeOf('plan')).toBe('event');
    expect(eventTypeOf('birthday')).toBe('event');
    expect(eventTypeOf(undefined)).toBe('event');
  });
});

describe('calendario de mes', () => {
  it('saca el año y el mes de una fecha y avanza o retrocede meses', () => {
    expect(yearMonthOf(TODAY)).toEqual({ year: 2026, month: 11 });
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2026, month: 12 });
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2026, month: 11 }, -14)).toEqual({ year: 2025, month: 9 });
  });

  it('pinta semanas completas de lunes a domingo', () => {
    const november = monthMatrix({ year: 2026, month: 11 });
    // El 1 de noviembre de 2026 es domingo: la primera semana empieza el lunes 26 de octubre.
    expect(november[0]).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    ]);
    expect(november.at(-1)?.[0]).toBe('2026-11-30');
    expect(november).toHaveLength(6);
    expect(november.every((week) => week.length === 7)).toBe(true);
  });

  it('usa las semanas justas para cada mes', () => {
    // Febrero de 2027 empieza en lunes y tiene 28 días: cuatro semanas exactas.
    expect(monthMatrix({ year: 2027, month: 2 })).toHaveLength(4);
    expect(monthMatrix({ year: 2026, month: 12 })).toHaveLength(5);
  });
});

describe('eventos', () => {
  it('valida horas', () => {
    expect(['00:00', '09:05', '23:59'].every(isValidTime)).toBe(true);
    expect(['24:00', '9:05', '12:60', '1230', ''].some(isValidTime)).toBe(false);
  });

  it('sin participantes es de todo el hogar', () => {
    expect(involves(event(), ANA)).toBe(true);
    expect(involves(event({ participants: [BRUNO] }), ANA)).toBe(false);
    expect(involves(event({ participants: [BRUNO] }), BRUNO)).toBe(true);
  });
});

describe('qué hay entre dos fechas', () => {
  it('incluye lo que cae dentro y lo que se solapa en parte', () => {
    const trip = event({ id: 'trip', title: 'Viaje', date: '2026-11-28', endDate: '2026-12-03' });
    const found = occurrencesBetween(
      [event(), trip, event({ id: 'old', date: '2026-10-01' })],
      '2026-11-01',
      '2026-11-30',
    );
    expect(found.map((occurrence) => occurrence.event.id)).toEqual(['e1', 'trip']);
    expect(daysOf(found[1]!)).toEqual([
      '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03',
    ]);
  });

  it('un cumpleaños aparece cada año, también en un rango que cruza de año', () => {
    const found = occurrencesBetween([birthday('1990-01-05')], '2026-12-15', '2027-01-15');
    expect(found.map((occurrence) => occurrence.date)).toEqual(['2027-01-05']);
    expect(occurrencesBetween([birthday('1990-01-05')], '2026-02-01', '2026-11-30')).toEqual([]);
  });

  it('el 29 de febrero se celebra el 28 los años no bisiestos', () => {
    const leapBirthday = birthday('1992-02-29');
    expect(occurrencesBetween([leapBirthday], '2027-02-01', '2027-03-01')[0]?.date).toBe('2027-02-28');
    expect(occurrencesBetween([leapBirthday], '2028-02-01', '2028-03-01')[0]?.date).toBe('2028-02-29');
  });

  it('ordena por día, luego todo el día y luego por hora', () => {
    const found = occurrencesBetween(
      [
        event({ id: 'late', time: '21:00' }),
        event({ id: 'early', time: '09:30' }),
        event({ id: 'allDay', time: null }),
        event({ id: 'before', date: '2026-11-13' }),
      ],
      '2026-11-01',
      '2026-11-30',
    );
    expect(found.map((occurrence) => occurrence.event.id)).toEqual([
      'before',
      'allDay',
      'early',
      'late',
    ]);
  });
});

describe('próximos', () => {
  it('deja fuera lo pasado y mantiene lo que está en curso', () => {
    const ongoing = event({ id: 'trip', date: '2026-11-10', endDate: '2026-11-15' });
    const upcoming = upcomingOccurrences(
      [event({ id: 'past', date: '2026-11-11' }), ongoing, event({ id: 'today', date: TODAY })],
      TODAY,
    );
    expect(upcoming.map((occurrence) => occurrence.event.id)).toEqual(['trip', 'today']);
    expect(daysUntil(upcoming[0]!, TODAY)).toBe(0);
  });

  it('de un cumpleaños da el de este año, o el del siguiente si ya pasó', () => {
    const [later] = upcomingOccurrences([birthday('1990-12-25')], TODAY);
    expect(later?.date).toBe('2026-12-25');
    expect(daysUntil(later!, TODAY)).toBe(43);

    const [passed] = upcomingOccurrences([birthday('1990-03-01')], TODAY);
    expect(passed?.date).toBe('2027-03-01');

    const [isToday] = upcomingOccurrences([birthday('1990-11-12')], TODAY);
    expect(isToday?.date).toBe(TODAY);
  });

  it('respeta el límite', () => {
    const events = ['2026-11-20', '2026-11-13', '2026-11-30'].map((date, index) =>
      event({ id: String(index), date }),
    );
    expect(upcomingOccurrences(events, TODAY, 2).map((occurrence) => occurrence.date)).toEqual([
      '2026-11-13',
      '2026-11-20',
    ]);
  });
});

describe('recordatorios', () => {
  const plan = (events: AgendaEvent[], uid = ANA) => planEventReminders({ events, uid, now: NOW });

  it('con hora, cuenta desde el inicio', () => {
    const reminders = plan([event({ reminders: [60, 1440] })]);
    expect(reminders.map((reminder) => [reminder.minutesBefore, reminder.at])).toEqual([
      [1440, new Date(2026, 10, 13, 21, 0)],
      [60, new Date(2026, 10, 14, 20, 0)],
    ]);
  });

  it('de todo el día, cuenta desde las 9:00', () => {
    const reminders = plan([event({ time: null, reminders: [0, 1440] })]);
    expect(reminders.map((reminder) => reminder.at)).toEqual([
      new Date(2026, 10, 13, 9, 0),
      new Date(2026, 10, 14, 9, 0),
    ]);
  });

  it('no programa lo que ya ha pasado ni lo que queda fuera del horizonte', () => {
    expect(plan([event({ date: TODAY, time: '09:00', reminders: [0, 60] })])).toEqual([]);
    expect(plan([event({ date: '2027-06-01', reminders: [60] })])).toEqual([]);
  });

  it('solo avisa a quien le concierne', () => {
    const vet = event({ participants: [BRUNO], reminders: [60] });
    expect(plan([vet], ANA)).toEqual([]);
    expect(plan([vet], BRUNO)).toHaveLength(1);
  });

  it('recuerda el próximo cumpleaños, también una semana antes', () => {
    const reminders = plan([birthday('1990-11-25', { reminders: [0, 10080] })]);
    expect(reminders.map((reminder) => reminder.at)).toEqual([
      new Date(2026, 10, 18, 9, 0),
      new Date(2026, 10, 25, 9, 0),
    ]);
  });

  it('no repite un recordatorio duplicado', () => {
    expect(plan([event({ reminders: [60, 60] })])).toHaveLength(1);
  });
});
