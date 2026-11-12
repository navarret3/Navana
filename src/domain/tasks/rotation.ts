import type { Task } from './types';

type Assignable = Pick<Task, 'mode' | 'assigneeId' | 'rotationOrder'>;

/** Quiénes entran en los turnos: el orden propio de la tarea o, si no tiene, todo el hogar. */
export function rotationMembers(
  task: Pick<Task, 'rotationOrder'>,
  memberIds: readonly string[],
): string[] {
  const custom = task.rotationOrder.filter((uid) => memberIds.includes(uid));
  return custom.length > 0 ? custom : [...memberIds];
}

/** A quién le toca la tarea ahora mismo. `null` si es libre o no hay nadie a quien asignarla. */
export function currentAssignee(task: Assignable, memberIds: readonly string[]): string | null {
  if (task.mode === 'free') return null;
  if (task.mode === 'fixed') {
    return task.assigneeId && memberIds.includes(task.assigneeId) ? task.assigneeId : null;
  }
  const turns = rotationMembers(task, memberIds);
  if (task.assigneeId && turns.includes(task.assigneeId)) return task.assigneeId;
  return turns[0] ?? null;
}

/**
 * A quién le toca después de que `completedBy` la haga. En rotación el turno pasa al
 * siguiente de quien la hizo de verdad, aunque no fuera su turno.
 */
export function assigneeAfterCompletion(
  task: Assignable,
  memberIds: readonly string[],
  completedBy: string,
): string | null {
  if (task.mode !== 'rotation') return task.assigneeId;
  const turns = rotationMembers(task, memberIds);
  if (turns.length === 0) return null;
  const index = turns.indexOf(completedBy);
  if (index === -1) return currentAssignee(task, memberIds);
  return turns[(index + 1) % turns.length] ?? null;
}
