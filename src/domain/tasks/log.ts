import type { DateKey } from '@/domain/dates';
import { normalizeName } from '@/domain/shopping/normalize';

import { iconForTitle } from './chores';
import { activeTasks } from './today';
import type { Task, TaskDraft } from './types';

/**
 * "Realizar tarea": apuntar algo que se acaba de hacer, esté o no previsto para hoy.
 * Se elige de la lista de tareas del hogar o se escribe una nueva.
 */

export const LOG_TITLE_MAX = 60;

/** Icono de lo que se apunta sin elegir icono y cuyo título no dice nada. */
const DEFAULT_ICON = '✨';

/**
 * Tareas que se pueden apuntar, filtradas por lo escrito. Primero lo que se ha hecho hace
 * menos: suele ser lo que se repite. A igualdad, por orden alfabético.
 */
export function tasksToLog(tasks: readonly Task[], text = ''): Task[] {
  const query = normalizeName(text);
  return activeTasks(tasks)
    .filter((task) => !query || normalizeName(task.title).includes(query))
    .sort(
      (a, b) =>
        (b.lastCompletedOn ?? '').localeCompare(a.lastCompletedOn ?? '') ||
        a.title.localeCompare(b.title),
    );
}

/** La tarea del hogar que se llama así, sin mirar mayúsculas, tildes ni espacios de más. */
export function findTaskByTitle(tasks: readonly Task[], title: string): Task | undefined {
  const wanted = normalizeName(title);
  if (!wanted) return undefined;
  return activeTasks(tasks).find((task) => normalizeName(task.title) === wanted);
}

/** Título tal como se guarda: sin espacios de más y con mayúscula inicial. */
export function cleanLogTitle(input: string): string {
  const clean = input.replace(/\s+/g, ' ').trim().slice(0, LOG_TITLE_MAX);
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Tarea nueva a partir de solo un título: "cuando surja", sin zona (en el balance sale en
 * "Otros"), de poco esfuerzo y con el icono que le pegue al título.
 */
export function draftForLoggedTask(title: string, today: DateKey): TaskDraft {
  const clean = cleanLogTitle(title);
  return {
    title: clean,
    icon: iconForTitle(clean) ?? DEFAULT_ICON,
    zoneId: null,
    effort: 1,
    mode: 'free',
    assigneeId: null,
    intervalDays: null,
    onDemand: true,
    nextDueOn: today,
  };
}
