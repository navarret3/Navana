import type { DateKey } from '@/domain/dates';

/**
 * - `fixed`: siempre la hace la misma persona (`assigneeId`).
 * - `rotation`: por turnos; `assigneeId` es a quién le toca ahora.
 * - `free`: de quien la coja.
 */
export type TaskMode = 'fixed' | 'rotation' | 'free';

export type Effort = 1 | 2 | 3;

export type Zone = {
  id: string;
  name: string;
  icon: string;
  order: number;
};

export type Task = {
  id: string;
  title: string;
  icon: string;
  zoneId: string | null;
  effort: Effort;
  mode: TaskMode;
  assigneeId: string | null;
  /** Orden de los turnos. Vacío significa "todos los miembros del hogar". */
  rotationOrder: string[];
  /** Cada cuántos días se repite, contando desde la última vez que se hizo. `null` = puntual. */
  intervalDays: number | null;
  /**
   * Tarea "cuando surge" (barrer, tender…): no tiene fecha ni le toca a nadie. No aparece
   * como pendiente; se apunta cada vez que alguien la hace, para el historial y el balance.
   */
  onDemand: boolean;
  /** Cuándo toca. En las tareas "cuando surgen" no se usa. */
  nextDueOn: DateKey;
  lastCompletedOn: DateKey | null;
  lastCompletedBy: string | null;
  /** Para saber qué registro del historial se puede deshacer. */
  lastCompletionId: string | null;
  /** Fuera de las listas: borrada, o puntual ya hecha. */
  archived: boolean;
};

/** Lo que cambia en una tarea al completarla, y lo que hay que restaurar al deshacer. */
export type TaskProgress = Pick<
  Task,
  'nextDueOn' | 'assigneeId' | 'lastCompletedOn' | 'lastCompletedBy' | 'lastCompletionId' | 'archived'
>;

export type Completion = {
  id: string;
  taskId: string;
  /** Copia de los datos de la tarea, para que el historial sobreviva a ediciones y borrados. */
  title: string;
  icon: string;
  effort: Effort;
  zoneId: string | null;
  completedBy: string;
  completedOn: DateKey;
  previous: TaskProgress;
};

/** Datos que se escriben al crear o editar una tarea. */
export type TaskDraft = Pick<
  Task,
  | 'title'
  | 'icon'
  | 'zoneId'
  | 'effort'
  | 'mode'
  | 'assigneeId'
  | 'intervalDays'
  | 'onDemand'
  | 'nextDueOn'
>;
