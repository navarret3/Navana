import type { DateKey } from '@/domain/dates';

import { nextDueAfterCompletion, postponedDue } from './recurrence';
import { assigneeAfterCompletion } from './rotation';
import type { Completion, Task, TaskProgress } from './types';

function progressOf(task: Task): TaskProgress {
  return {
    nextDueOn: task.nextDueOn,
    assigneeId: task.assigneeId,
    lastCompletedOn: task.lastCompletedOn,
    lastCompletedBy: task.lastCompletedBy,
    lastCompletionId: task.lastCompletionId,
    archived: task.archived,
  };
}

/**
 * Qué hay que escribir al completar una tarea: el registro del historial y el nuevo
 * estado de la tarea. No toca la base de datos; la capa de datos lo guarda en un lote.
 */
export function planCompletion(params: {
  task: Task;
  completionId: string;
  completedBy: string;
  today: DateKey;
  memberIds: readonly string[];
}): { completion: Completion; progress: TaskProgress } {
  const { task, completionId, completedBy, today, memberIds } = params;
  const completion: Completion = {
    id: completionId,
    taskId: task.id,
    title: task.title,
    icon: task.icon,
    effort: task.effort,
    zoneId: task.zoneId,
    completedBy,
    completedOn: today,
    previous: progressOf(task),
  };
  const done = {
    lastCompletedOn: today,
    lastCompletedBy: completedBy,
    lastCompletionId: completionId,
  };

  // Las tareas "cuando surgen" solo dejan constancia: ni fecha ni turno que mover.
  if (task.onDemand) {
    return { completion, progress: { ...progressOf(task), ...done } };
  }

  const nextDueOn = nextDueAfterCompletion(task.intervalDays, today);
  return {
    completion,
    progress: {
      // Una tarea puntual hecha conserva su fecha y sale de las listas.
      nextDueOn: nextDueOn ?? task.nextDueOn,
      archived: nextDueOn === null ? true : task.archived,
      assigneeId: assigneeAfterCompletion(task, memberIds, completedBy),
      ...done,
    },
  };
}

/** Solo se puede deshacer el último registro de cada tarea: es el único cuyo "antes" sigue valiendo. */
export function canUndo(completion: Completion, task: Task | undefined): boolean {
  return task !== undefined && task.lastCompletionId === completion.id;
}

export function planPostpone(today: DateKey, days: number): Pick<Task, 'nextDueOn'> {
  return { nextDueOn: postponedDue(today, days) };
}
