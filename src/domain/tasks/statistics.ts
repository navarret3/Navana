import {
  addDays,
  addMonths,
  diffDays,
  startOfMonth,
  startOfWeek,
  yearMonthOf,
  type DateKey,
} from '@/domain/dates';

import { computeBalance, periodRange, type DateRange } from './balance';
import type { Completion, Task } from './types';

export type StatisticsPeriod = 'week' | 'month' | 'year' | 'all' | 'custom';
export type StatisticsFilters = {
  range: DateRange | null;
  memberId?: string;
  taskId?: string;
  /** undefined = todas; null = sin zona. Se usa la zona del registro, no la actual. */
  zoneId?: string | null;
};

export function statisticsRange(
  period: StatisticsPeriod,
  today: DateKey,
  custom: DateRange,
): DateRange | null {
  if (period === 'all') return null;
  if (period === 'custom') return custom;
  if (period === 'year') return { from: `${today.slice(0, 4)}-01-01`, to: today };
  return { from: periodRange(period, today).from, to: today };
}

/** No modifica el origen. Los pendientes de sincronizar se consideran los más recientes. */
export function newestCompletions(entries: readonly Completion[]): Completion[] {
  return [...entries].sort(
    (a, b) =>
      b.completedOn.localeCompare(a.completedOn) ||
      (b.completedAtMs ?? Number.MAX_SAFE_INTEGER) - (a.completedAtMs ?? Number.MAX_SAFE_INTEGER) ||
      b.id.localeCompare(a.id),
  );
}

export function filterCompletions(
  entries: readonly Completion[],
  filters: StatisticsFilters,
): Completion[] {
  return newestCompletions(
    entries.filter(
      (entry) =>
        (!filters.range ||
          (entry.completedOn >= filters.range.from && entry.completedOn <= filters.range.to)) &&
        (filters.memberId === undefined || entry.completedBy === filters.memberId) &&
        (filters.taskId === undefined || entry.taskId === filters.taskId) &&
        (filters.zoneId === undefined || entry.zoneId === filters.zoneId),
    ),
  );
}

/** Días de calendario, del más reciente al más antiguo, sin convertirlos a UTC. */
export function completionDays(
  entries: readonly Completion[],
): { day: DateKey; data: Completion[] }[] {
  const days = new Map<DateKey, Completion[]>();
  for (const entry of newestCompletions(entries)) {
    const day = days.get(entry.completedOn);
    if (day) day.push(entry);
    else days.set(entry.completedOn, [entry]);
  }
  return [...days].map(([day, data]) => ({ day, data }));
}

export type HistoryTask = Pick<Task, 'id' | 'title' | 'icon' | 'archived'>;

/** Incluye puntuales, archivadas y borradas; dos títulos iguales siguen siendo dos tareas. */
export function historyTasks(
  tasks: readonly Task[],
  entries: readonly Completion[],
): HistoryTask[] {
  const byId = new Map<string, HistoryTask>();
  for (const entry of newestCompletions(entries)) {
    if (!byId.has(entry.taskId))
      byId.set(entry.taskId, {
        id: entry.taskId,
        title: entry.title,
        icon: entry.icon,
        archived: true,
      });
  }
  for (const task of tasks) byId.set(task.id, task);
  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export type ActivityBucket = {
  from: DateKey;
  to: DateKey;
  count: number;
  byMember: Record<string, number>;
};

/** Intervalos vacíos incluidos; la escala se adapta para no dibujar cientos de barras. */
export function activityTimeline(
  entries: readonly Completion[],
  range: DateRange | null,
): {
  unit: 'day' | 'week' | 'month' | 'year';
  buckets: ActivityBucket[];
} {
  const ordered = newestCompletions(entries);
  const from = range?.from ?? ordered.at(-1)?.completedOn;
  const to = range?.to ?? ordered[0]?.completedOn;
  if (!from || !to || from > to) return { unit: 'day' as const, buckets: [] as ActivityBucket[] };
  const days = diffDays(from, to) + 1;
  const unit = days <= 31 ? 'day' : days <= 120 ? 'week' : days <= 730 ? 'month' : 'year';
  const floor = (day: DateKey) =>
    unit === 'day'
      ? day
      : unit === 'week'
        ? startOfWeek(day)
        : unit === 'month'
          ? startOfMonth(day)
          : `${day.slice(0, 4)}-01-01`;
  const next = (day: DateKey) => {
    if (unit === 'day' || unit === 'week') return addDays(day, unit === 'day' ? 1 : 7);
    const month = addMonths(yearMonthOf(day), unit === 'month' ? 1 : 12);
    return `${month.year}-${String(month.month).padStart(2, '0')}-01`;
  };
  const buckets = new Map<DateKey, ActivityBucket>();
  for (let day = floor(from); day <= to; day = next(day)) {
    buckets.set(day, {
      from: day < from ? from : day,
      to: addDays(next(day), -1) > to ? to : addDays(next(day), -1),
      count: 0,
      byMember: {},
    });
  }
  for (const entry of entries) {
    if (entry.completedOn < from || entry.completedOn > to) continue;
    const bucket = buckets.get(floor(entry.completedOn));
    if (!bucket) continue;
    bucket.count++;
    bucket.byMember[entry.completedBy] = (bucket.byMember[entry.completedBy] ?? 0) + 1;
  }
  return { unit, buckets: [...buckets.values()] };
}

export type TaskActivity = {
  taskId: string;
  count: number;
  latest: Completion;
};

export function taskStatistics(
  entries: readonly Completion[],
  memberIds: readonly string[],
  range: DateRange | null,
) {
  const ordered = newestCompletions(entries);
  const byTask = new Map<string, TaskActivity>();
  const days = new Set<DateKey>();
  for (const entry of ordered) {
    days.add(entry.completedOn);
    const task = byTask.get(entry.taskId);
    if (task) task.count++;
    else
      byTask.set(entry.taskId, {
        taskId: entry.taskId,
        count: 1,
        latest: entry,
      });
  }
  return {
    count: entries.length,
    distinctTasks: byTask.size,
    activeDays: days.size,
    latest: ordered[0],
    tasks: [...byTask.values()].sort(
      (a, b) => b.count - a.count || a.latest.title.localeCompare(b.latest.title),
    ),
    balance: computeBalance(entries, memberIds, { from: '', to: '9999-12-31' }),
    timeline: activityTimeline(entries, range),
  };
}
