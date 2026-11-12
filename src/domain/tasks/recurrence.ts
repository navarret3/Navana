import { addDays, diffDays, type DateKey } from '@/domain/dates';

export type DueStatus =
  | { kind: 'overdue'; days: number }
  | { kind: 'today' }
  | { kind: 'upcoming'; days: number };

export function dueStatus(nextDueOn: DateKey, today: DateKey): DueStatus {
  const days = diffDays(today, nextDueOn);
  if (days < 0) return { kind: 'overdue', days: -days };
  if (days === 0) return { kind: 'today' };
  return { kind: 'upcoming', days };
}

/** Toca hoy o va con retraso. */
export function isDue(nextDueOn: DateKey, today: DateKey): boolean {
  return nextDueOn <= today;
}

/**
 * Siguiente fecha tras hacer la tarea: siempre "cada X días desde la última vez que se hizo",
 * así que hacerla tarde no acumula retraso. Las puntuales no vuelven (`null`).
 */
export function nextDueAfterCompletion(
  intervalDays: number | null,
  completedOn: DateKey,
): DateKey | null {
  return intervalDays === null ? null : addDays(completedOn, intervalDays);
}

/** Posponer cuenta desde hoy, no desde la fecha antigua: una tarea atrasada no sigue atrasada. */
export function postponedDue(today: DateKey, days: number): DateKey {
  return addDays(today, days);
}
