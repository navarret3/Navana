import type { DateKey } from '@/domain/dates';

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
