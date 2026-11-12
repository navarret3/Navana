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

  it('avisa de lo atrasado por la tarde, a partir del día siguiente al que tocaba', () => {
    const overdue = plan([task({})]).filter((item) => item.kind === 'overdue');
    expect(overdue[0]).toMatchObject({ day: '2026-11-13', at: new Date(2026, 10, 13, 19, 0) });
    expect(overdue).toHaveLength(PLAN_DAYS - 1);
  });

  it('respeta las preferencias', () => {
    const kinds = (prefs: typeof PREFS) =>
      new Set(plan([task({ nextDueOn: '2026-11-10' })], { prefs }).map((item) => item.kind));
    expect(kinds({ ...PREFS, dailySummary: false })).toEqual(new Set(['overdue']));
    expect(kinds({ ...PREFS, overdue: false })).toEqual(new Set(['summary']));
    expect(kinds({ ...PREFS, dailySummary: false, overdue: false })).toEqual(new Set());
  });

  it('usa la hora elegida para el resumen', () => {
    const [first] = plan([task({})], { prefs: { ...PREFS, summaryHour: 20 } });
    expect(first).toMatchObject({ kind: 'summary', at: new Date(2026, 10, 12, 20, 0) });
  });

  it('devuelve los avisos ordenados por fecha', () => {
    const times = plan([task({ nextDueOn: '2026-11-10' })]).map((item) => item.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
