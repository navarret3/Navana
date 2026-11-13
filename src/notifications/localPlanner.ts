import { addDays, toDateKey, type DateKey } from '@/domain/dates';
import type { NotifyPrefs } from '@/domain/household';
import { assigneeAfterCompletion, currentAssignee } from '@/domain/tasks/rotation';
import { scheduledTasks } from '@/domain/tasks/today';
import type { Task } from '@/domain/tasks/types';

/**
 * Avisos locales: los programa cada móvil para sí mismo, sin servidor.
 *
 * Esta función es pura: decide qué avisos tocan con lo que se sabe ahora. Cada vez que
 * cambian las tareas o se abre la app se vuelve a calcular y se reprograma todo.
 *
 * Como no hay servidor, un móvil solo sabe lo que sabía la última vez que tuvo la app
 * abierta. Por eso se planifica con dos supuestos:
 * - lo que me toca y está pendiente sigue pendiente hasta que yo lo haga (si lo hago, se
 *   replanifica al momento);
 * - lo que le toca a otra persona se hará el día que toca y el turno pasará al siguiente.
 *   Así, en una tarea que se alterna cada día, mi móvil ya sabe que mañana me toca a mí
 *   aunque no vuelva a abrir la app.
 */

/** Hora de la tarde a la que se recuerda lo que queda por hacer del día. */
export const PENDING_HOUR = 18;

/** Días hacia delante que se dejan programados, por si la app tarda en volver a abrirse. */
export const PLAN_DAYS = 7;

export type PlannedNotification = {
  /** `summary`: lo que toca ese día. `overdue`: lo que a media tarde sigue sin hacer. */
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

/**
 * Desde qué día le toca a `uid` esta tarea, mirando solo hasta `day`. `null` si no le toca.
 * Si es suya y está pendiente, desde que tocaba. Si ahora es de otra persona, se sigue el
 * turno: se da por hecho que cada vez se hace el día que toca (o hoy, si va con retraso).
 */
function dueForOn(
  task: Task,
  uid: string,
  memberIds: readonly string[],
  today: DateKey,
  day: DateKey,
): DateKey | null {
  let assignee = currentAssignee(task, memberIds);
  if (assignee === uid) return task.nextDueOn <= day ? task.nextDueOn : null;
  if (task.intervalDays === null || task.mode !== 'rotation') return null;

  let date = task.nextDueOn < today ? today : task.nextDueOn;
  while (assignee !== null) {
    date = addDays(date, task.intervalDays);
    if (date > day) return null;
    assignee = assigneeAfterCompletion({ ...task, assigneeId: assignee }, memberIds, assignee);
    if (assignee === uid && date === day) return date;
  }
  return null;
}

/** Lo que previsiblemente le toca a `uid` el día `day`: primero lo más atrasado. */
export function tasksDueFor(
  tasks: readonly Task[],
  uid: string,
  memberIds: readonly string[],
  today: DateKey,
  day: DateKey,
): Task[] {
  return scheduledTasks(tasks)
    .map((task) => ({ task, dueOn: dueForOn(task, uid, memberIds, today, day) }))
    .filter((entry): entry is { task: Task; dueOn: DateKey } => entry.dueOn !== null)
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.task.title.localeCompare(b.task.title))
    .map((entry) => entry.task);
}

export function planLocalNotifications(params: {
  tasks: readonly Task[];
  uid: string;
  memberIds: readonly string[];
  now: Date;
  prefs: Pick<NotifyPrefs, 'dailySummary' | 'summaryHour' | 'overdue'>;
}): PlannedNotification[] {
  const { tasks, uid, memberIds, now, prefs } = params;
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
    const due = tasksDueFor(tasks, uid, memberIds, today, day);
    if (prefs.dailySummary) add('summary', day, prefs.summaryHour, due);
    // Si para entonces ya está hecho, la app lo habrá replanificado y este aviso no existirá.
    if (prefs.overdue) add('overdue', day, PENDING_HOUR, due);
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime());
}
