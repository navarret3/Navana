import { addDays, type DateKey } from '@/domain/dates';

import { isDue } from './recurrence';
import { currentAssignee } from './rotation';
import type { Task } from './types';

export type TodayTasks = {
  /** Las que me tocan a mí, de hoy y atrasadas. */
  mine: Task[];
  /** Las libres: de quien las coja. */
  free: Task[];
  /** Las que le tocan a otra persona del hogar. */
  others: Task[];
};

/** Primero lo más atrasado; a igual fecha, por orden alfabético. */
export function byDueDate(a: Task, b: Task): number {
  return a.nextDueOn.localeCompare(b.nextDueOn) || a.title.localeCompare(b.title);
}

export function activeTasks(tasks: readonly Task[]): Task[] {
  return tasks.filter((task) => !task.archived);
}

/** Tareas con fecha: las que pueden estar pendientes, atrasadas o por venir. */
export function scheduledTasks(tasks: readonly Task[]): Task[] {
  return activeTasks(tasks).filter((task) => !task.onDemand);
}

/** Tareas "cuando surgen", con lo hecho más recientemente primero: suele ser lo que se repite. */
export function onDemandTasks(tasks: readonly Task[]): Task[] {
  return activeTasks(tasks)
    .filter((task) => task.onDemand)
    .sort(
      (a, b) =>
        (b.lastCompletedOn ?? '').localeCompare(a.lastCompletedOn ?? '') ||
        a.title.localeCompare(b.title),
    );
}

/** Reparte lo que hay que hacer hoy (o va con retraso) según a quién le toca. */
export function groupForToday(
  tasks: readonly Task[],
  context: { today: DateKey; uid: string; memberIds: readonly string[] },
): TodayTasks {
  const groups: TodayTasks = { mine: [], free: [], others: [] };

  for (const task of scheduledTasks(tasks)) {
    if (!isDue(task.nextDueOn, context.today)) continue;
    const assignee = currentAssignee(task, context.memberIds);
    if (assignee === null) groups.free.push(task);
    else if (assignee === context.uid) groups.mine.push(task);
    else groups.others.push(task);
  }

  groups.mine.sort(byDueDate);
  groups.free.sort(byDueDate);
  groups.others.sort(byDueDate);
  return groups;
}

/** Días hacia delante que entran en "Próximos días" en la pestaña Tareas. */
export const SOON_DAYS = 7;

export type TasksByWhen = {
  /** Lo de hoy y lo atrasado. */
  today: Task[];
  /** Lo que toca en los próximos días. */
  soon: Task[];
  /** El resto. */
  later: Task[];
};

/** Reparte las tareas con fecha según cuándo tocan, cada grupo de lo más urgente a lo menos. */
export function groupByWhen(tasks: readonly Task[], today: DateKey): TasksByWhen {
  const limit = addDays(today, SOON_DAYS);
  const groups: TasksByWhen = { today: [], soon: [], later: [] };
  for (const task of [...scheduledTasks(tasks)].sort(byDueDate)) {
    if (isDue(task.nextDueOn, today)) groups.today.push(task);
    else if (task.nextDueOn <= limit) groups.soon.push(task);
    else groups.later.push(task);
  }
  return groups;
}

/**
 * Filtro de la pestaña Tareas por persona: `null` deja todas; con un `uid`, las que le tocan
 * a esa persona y las libres, que puede coger cualquiera.
 */
export function tasksFor(
  tasks: readonly Task[],
  uid: string | null,
  memberIds: readonly string[],
): Task[] {
  if (uid === null) return [...tasks];
  return tasks.filter((task) => {
    const assignee = currentAssignee(task, memberIds);
    return assignee === null || assignee === uid;
  });
}
