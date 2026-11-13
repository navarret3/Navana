import type { Task } from '@/domain/tasks/types';
import { PLAN_DAYS, planLocalNotifications } from '@/notifications/localPlanner';

const ANA = 'ana';
const BRUNO = 'bruno';
const MEMBERS = [ANA, BRUNO];
/** Jueves 12 de noviembre de 2026, a las 8:00. */
const NOW = new Date(2026, 10, 12, 8, 0);
const PREFS = { dailySummary: true, summaryHour: 9, overdue: true };

function task(overrides: Partial<Task>): Task {
  return {
    id: 't',
    title: 'Aspirar',
    icon: '🧹',
    zoneId: null,
    effort: 2,
    mode: 'fixed',
    assigneeId: ANA,
    rotationOrder: [],
    intervalDays: 7,
    onDemand: false,
    nextDueOn: '2026-11-12',
    lastCompletedOn: null,
    lastCompletedBy: null,
    lastCompletionId: null,
    archived: false,
    ...overrides,
  };
}

const plan = (tasks: Task[], overrides: Partial<Parameters<typeof planLocalNotifications>[0]> = {}) =>
  planLocalNotifications({ tasks, uid: ANA, memberIds: MEMBERS, now: NOW, prefs: PREFS, ...overrides });

describe('avisos locales', () => {
  it('sin tareas mías no programa nada', () => {
    expect(plan([])).toEqual([]);
    expect(plan([task({ assigneeId: BRUNO })])).toEqual([]);
    expect(plan([task({ mode: 'free', assigneeId: null })])).toEqual([]);
    expect(plan([task({ archived: true })])).toEqual([]);
    expect(plan([task({ onDemand: true, nextDueOn: '2026-11-01' })])).toEqual([]);
  });

  it('programa el resumen de hoy a su hora, con cuántas tocan y la más atrasada', () => {
    const [first] = plan([
      task({ id: 'a', title: 'Aspirar' }),
      task({ id: 'b', title: 'Baño', nextDueOn: '2026-11-10' }),
    ]);
    expect(first).toEqual({
      kind: 'summary',
      at: new Date(2026, 10, 12, 9, 0),
      day: '2026-11-12',
      count: 2,
      firstTitle: 'Baño',
    });
  });

  it('no programa avisos para una hora que ya ha pasado', () => {
    const late = new Date(2026, 10, 12, 9, 30);
    const days = plan([task({})], { now: late })
      .filter((item) => item.kind === 'summary')
      .map((item) => item.day);
    expect(days[0]).toBe('2026-11-13');
  });

  it('una tarea futura solo entra en el resumen desde el día que toca', () => {
    const summaries = plan([task({ nextDueOn: '2026-11-14' })]).filter(
      (item) => item.kind === 'summary',
    );
    expect(summaries.map((item) => item.day)).toEqual([
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
    ]);
  });

  it('a las 18:00 recuerda lo del día que sigue sin hacer, desde el mismo día que toca', () => {
    const pending = plan([task({})]).filter((item) => item.kind === 'overdue');
    expect(pending[0]).toMatchObject({ day: '2026-11-12', at: new Date(2026, 10, 12, 18, 0), count: 1 });
    expect(pending).toHaveLength(PLAN_DAYS);
    // Pasadas las 18:00, el de hoy ya no se programa.
    const evening = new Date(2026, 10, 12, 18, 30);
    expect(plan([task({})], { now: evening }).filter((item) => item.kind === 'overdue')[0]?.day).toBe(
      '2026-11-13',
    );
  });

  describe('tareas por turnos', () => {
    const daily = (assigneeId: string, overrides: Partial<Task> = {}) =>
      task({ title: 'Arenero', mode: 'rotation', assigneeId, intervalDays: 1, ...overrides });
    const summaryDays = (tasks: Task[]) =>
      plan(tasks)
        .filter((item) => item.kind === 'summary')
        .map((item) => item.day);

    it('si hoy le toca al otro, mi móvil ya sabe que mañana me toca a mí', () => {
      expect(summaryDays([daily(BRUNO)])).toEqual(['2026-11-13', '2026-11-15', '2026-11-17']);
    });

    it('si hoy me toca a mí, sigue pendiente hasta que la haga', () => {
      expect(summaryDays([daily(ANA)])).toHaveLength(PLAN_DAYS);
    });

    it('cuenta desde hoy si la del otro va con retraso', () => {
      const late = daily(BRUNO, { intervalDays: 2, nextDueOn: '2026-11-09' });
      // Se da por hecha hoy (día 12): la siguiente es mía el 14 y la otra mía, el 18.
      expect(summaryDays([late])).toEqual(['2026-11-14', '2026-11-18']);
    });

    it('lo fijo de otra persona y lo que no se repite nunca pasan a ser míos', () => {
      expect(summaryDays([task({ assigneeId: BRUNO, intervalDays: 1 })])).toEqual([]);
      expect(summaryDays([daily(BRUNO, { intervalDays: null })])).toEqual([]);
    });

    it('nombra primero lo que lleva más tiempo esperando', () => {
      const [first] = plan([daily(BRUNO), task({ title: 'Baño', nextDueOn: '2026-11-10' })]).filter(
        (item) => item.day === '2026-11-13' && item.kind === 'summary',
      );
      expect(first).toMatchObject({ count: 2, firstTitle: 'Baño' });
    });
  });

  it('respeta las preferencias', () => {
    const kinds = (prefs: typeof PREFS) =>
      new Set(plan([task({ nextDueOn: '2026-11-10' })], { prefs }).map((item) => item.kind));
    expect(kinds({ ...PREFS, dailySummary: false })).toEqual(new Set(['overdue']));
    expect(kinds({ ...PREFS, overdue: false })).toEqual(new Set(['summary']));
    expect(kinds({ ...PREFS, dailySummary: false, overdue: false })).toEqual(new Set());
  });

  it('usa la hora elegida para el resumen', () => {
    const summary = plan([task({})], { prefs: { ...PREFS, summaryHour: 20 } }).find(
      (item) => item.kind === 'summary',
    );
    expect(summary).toMatchObject({ at: new Date(2026, 10, 12, 20, 0) });
    // Vale cualquier hora del día, también de madrugada.
    const early = new Date(2026, 10, 12, 0, 30);
    const [first] = plan([task({})], { now: early, prefs: { ...PREFS, summaryHour: 6 } });
    expect(first).toMatchObject({ kind: 'summary', at: new Date(2026, 10, 12, 6, 0) });
  });

  it('devuelve los avisos ordenados por fecha', () => {
    const times = plan([task({ nextDueOn: '2026-11-10' })]).map((item) => item.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
