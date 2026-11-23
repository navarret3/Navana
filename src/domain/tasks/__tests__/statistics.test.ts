import {
  activityTimeline,
  filterCompletions,
  historyTasks,
  newestCompletions,
  statisticsRange,
  taskStatistics,
} from '@/domain/tasks/statistics';
import type { Completion, Task } from '@/domain/tasks/types';

const previous = {
  nextDueOn: '2026-11-01',
  assigneeId: null,
  lastCompletedOn: null,
  lastCompletedBy: null,
  lastCompletionId: null,
  archived: false,
};
function entry(id: string, overrides: Partial<Completion> = {}): Completion {
  return {
    id,
    taskId: 'sweep',
    title: 'Barrer',
    icon: '🧹',
    zoneId: 'kitchen',
    effort: 2,
    completedBy: 'ana',
    completedOn: '2026-11-22',
    completedAtMs: 100,
    previous,
    ...overrides,
  };
}
function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: 'Barrer',
    icon: '🧹',
    zoneId: 'kitchen',
    effort: 2,
    mode: 'free',
    rotationOrder: [],
    intervalDays: null,
    onDemand: true,
    ...previous,
    ...overrides,
  };
}

describe('periodos de estadísticas', () => {
  it('usa días de calendario hasta hoy y semanas que empiezan en lunes', () => {
    const custom = { from: '2025-12-01', to: '2026-02-01' };
    expect(statisticsRange('week', '2026-11-22', custom)).toEqual({
      from: '2026-11-16',
      to: '2026-11-22',
    });
    expect(statisticsRange('month', '2024-02-29', custom)).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    });
    expect(statisticsRange('year', '2026-01-01', custom)).toEqual({
      from: '2026-01-01',
      to: '2026-01-01',
    });
    expect(statisticsRange('custom', '2026-01-01', custom)).toEqual(custom);
    expect(statisticsRange('all', '2026-01-01', custom)).toBeNull();
  });
});

describe('filtrar el historial', () => {
  const entries = [
    entry('a', { completedOn: '2026-11-01' }),
    entry('b'),
    entry('c', { completedBy: 'bruno' }),
    entry('d', { taskId: 'other' }),
    entry('e', { zoneId: null }),
    entry('f', { completedOn: '2026-10-31' }),
  ];
  it('combina persona, tarea, zona histórica y fechas con límites inclusivos', () => {
    expect(
      filterCompletions(entries, {
        range: { from: '2026-11-01', to: '2026-11-22' },
        memberId: 'ana',
        taskId: 'sweep',
        zoneId: 'kitchen',
      }).map((item) => item.id),
    ).toEqual(['b', 'a']);
    expect(
      filterCompletions(entries, { range: null, zoneId: null }).map((item) => item.id),
    ).toEqual(['e']);
    expect(filterCompletions(entries, { range: null })).toHaveLength(6);
  });
  it('no confunde al responsable actual con quien la hizo, ni tareas de igual título', () => {
    expect(
      filterCompletions(entries, { range: null, memberId: 'bruno' }).map((item) => item.id),
    ).toEqual(['c']);
    expect(
      filterCompletions(entries, { range: null, taskId: 'other' }).map((item) => item.id),
    ).toEqual(['d']);
  });
  it('un periodo invertido o una persona sin actividad no arrojan registros', () => {
    expect(filterCompletions(entries, { range: { from: '2026-12-01', to: '2026-01-01' } })).toEqual(
      [],
    );
    expect(filterCompletions(entries, { range: null, memberId: 'missing' })).toEqual([]);
  });
  it('ordena también dentro del mismo día, sin modificar el origen', () => {
    const source = [
      entry('first', { completedAtMs: 1 }),
      entry('last', { completedAtMs: 3 }),
      entry('pending', { completedAtMs: undefined }),
      entry('old', { completedOn: '2026-11-21', completedAtMs: 50 }),
    ];
    expect(newestCompletions(source).map((item) => item.id)).toEqual([
      'pending',
      'last',
      'first',
      'old',
    ]);
    expect(source[0]?.id).toBe('first');
  });
});

describe('resumen completo del trabajo', () => {
  it('cuenta repeticiones por separado, calcula esfuerzo y mantiene antiguos miembros', () => {
    const stats = taskStatistics(
      [
        entry('1'),
        entry('2', { effort: 3, completedBy: 'former' }),
        entry('3', { completedOn: '2026-11-20', taskId: 'dishes', effort: 1 }),
      ],
      ['ana', 'bruno'],
      null,
    );
    expect(stats).toMatchObject({ count: 3, distinctTasks: 2, activeDays: 2 });
    expect(stats.balance.totalEffort).toBe(6);
    expect(stats.balance.members).toEqual([
      { uid: 'ana', count: 2, effort: 3, share: 0.5 },
      { uid: 'bruno', count: 0, effort: 0, share: 0 },
      { uid: 'former', count: 1, effort: 3, share: 0.5 },
    ]);
    expect(stats.tasks[0]).toMatchObject({ taskId: 'sweep', count: 2, latest: { id: '2' } });
  });
  it('cuenta más de 300 registros y resta lo deshecho al recibir la nueva colección', () => {
    const entries = Array.from({ length: 450 }, (_, index) => entry(String(index)));
    expect(taskStatistics(entries, ['ana'], null).count).toBe(450);
    expect(taskStatistics(entries.slice(1), ['ana'], null).count).toBe(449);
  });
  it('vacío no produce NaN ni inventa una última vez', () => {
    expect(taskStatistics([], ['ana'], null)).toMatchObject({
      count: 0,
      activeDays: 0,
      distinctTasks: 0,
      latest: undefined,
      tasks: [],
      timeline: { buckets: [] },
      balance: { totalEffort: 0, members: [{ share: 0 }] },
    });
  });
  it('el selector conserva archivadas, borradas y cambios de nombre sin fusionar identidades', () => {
    const options = historyTasks(
      [task('sweep', { title: 'Barrer cocina' }), task('archived', { archived: true })],
      [entry('1'), entry('2', { taskId: 'deleted', title: 'Barrer' })],
    );
    expect(options).toHaveLength(3);
    expect(options.find((item) => item.id === 'sweep')?.title).toBe('Barrer cocina');
    expect(options.find((item) => item.id === 'archived')?.archived).toBe(true);
    expect(options.find((item) => item.id === 'deleted')).toMatchObject({
      title: 'Barrer',
      archived: true,
    });
  });
});

describe('actividad a lo largo del tiempo', () => {
  it('incluye días sin actividad y reparte cada barra por quien completó', () => {
    const result = activityTimeline(
      [
        entry('1', { completedOn: '2024-02-28' }),
        entry('2', { completedOn: '2024-03-01', completedBy: 'bruno' }),
      ],
      { from: '2024-02-28', to: '2024-03-01' },
    );
    expect(result.unit).toBe('day');
    expect(result.buckets).toEqual([
      { from: '2024-02-28', to: '2024-02-28', count: 1, byMember: { ana: 1 } },
      { from: '2024-02-29', to: '2024-02-29', count: 0, byMember: {} },
      { from: '2024-03-01', to: '2024-03-01', count: 1, byMember: { bruno: 1 } },
    ]);
  });
  it('agrupa por semanas recortando sus extremos al periodo elegido', () => {
    const result = activityTimeline([entry('1', { completedOn: '2026-10-01' }), entry('2')], {
      from: '2026-10-01',
      to: '2026-11-22',
    });
    expect(result.unit).toBe('week');
    expect(result.buckets[0]?.from).toBe('2026-10-01');
    expect(result.buckets.at(-1)?.to).toBe('2026-11-22');
    expect(result.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(2);
  });
  it('escala a meses o años, conserva huecos y no pierde registros entre años', () => {
    const entries = [
      entry('1', { completedOn: '2025-12-31' }),
      entry('2', { completedOn: '2026-11-22' }),
    ];
    const months = activityTimeline(entries, null);
    expect(months.unit).toBe('month');
    expect(months.buckets).toHaveLength(12);
    const years = activityTimeline([...entries, entry('3', { completedOn: '2020-01-01' })], null);
    expect(years.unit).toBe('year');
    expect(years.buckets).toHaveLength(7);
    expect(years.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
  });
});
