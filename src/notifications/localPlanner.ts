import { addDays, toDateKey, type DateKey } from '@/domain/dates';
import type { NotifyPrefs } from '@/domain/household';
import { currentAssignee } from '@/domain/tasks/rotation';
import { byDueDate, scheduledTasks } from '@/domain/tasks/today';
import type { Task } from '@/domain/tasks/types';

/**
 * Avisos locales: los programa cada móvil para sí mismo, sin servidor.
 *
 * Esta función es pura: decide qué avisos tocan con lo que se sabe ahora. Cada vez que
 * cambian las tareas o se abre la app se vuelve a calcular y se reprograma todo.
 */

/** Hora de la tarde a la que se recuerda lo atrasado. */
export const OVERDUE_HOUR = 19;

/** Días hacia delante que se dejan programados, por si la app tarda en volver a abrirse. */
export const PLAN_DAYS = 7;

export type PlannedNotification = {
  kind: 'summary' | 'overdue';
  at: Date;
  day: DateKey;
  /** Cuántas tareas entran en el aviso. */
  count: number;
  /** Título de la primera, para nombrarla en el texto. */
  firstTitle: string;
};

function atHour(day: DateKey, hour: number): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1, hour);
}

export function planLocalNotifications(params: {
  tasks: readonly Task[];
  uid: string;
  memberIds: readonly string[];
  now: Date;
  prefs: Pick<NotifyPrefs, 'dailySummary' | 'summaryHour' | 'overdue'>;
}): PlannedNotification[] {
  const { tasks, uid, memberIds, now, prefs } = params;
  const mine = scheduledTasks(tasks)
    .filter((task) => currentAssignee(task, memberIds) === uid)
    .sort(byDueDate);
  const today = toDateKey(now);
  const planned: PlannedNotification[] = [];

  const add = (kind: PlannedNotification['kind'], day: DateKey, hour: number, due: Task[]) => {
    const at = atHour(day, hour);
    const first = due[0];
    if (!first || at.getTime() <= now.getTime()) return;
    planned.push({ kind, at, day, count: due.length, firstTitle: first.title });
  };

  for (let offset = 0; offset < PLAN_DAYS; offset++) {
    const day = addDays(today, offset);
    // Se da por hecho que lo pendiente sigue pendiente: si se completa algo, se replanifica.
    if (prefs.dailySummary) {
      add('summary', day, prefs.summaryHour, mine.filter((task) => task.nextDueOn <= day));
    }
    if (prefs.overdue) {
      add('overdue', day, OVERDUE_HOUR, mine.filter((task) => task.nextDueOn < day));
    }
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime());
}
