import { normalizeName } from '@/domain/shopping/normalize';

import { activeTasks } from './today';
import type { Task } from './types';

/**
 * "Realizar tarea": apuntar algo que se acaba de hacer, esté o no previsto para hoy.
 * Solo se elige una tarea activa de la lista del hogar. Las altas se hacen por separado.
 */

export const LOG_TITLE_MAX = 60;

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
