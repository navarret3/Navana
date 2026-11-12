import {
  collection,
  db,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from '@/data/fb';
import type { DateKey } from '@/domain/dates';
import { planCompletion, planPostpone } from '@/domain/tasks/completion';
import type {
  Completion,
  Effort,
  Task,
  TaskDraft,
  TaskMode,
  TaskProgress,
  Zone,
} from '@/domain/tasks/types';

const zonesCol = (hid: string) => collection(db, 'households', hid, 'zones');
const tasksCol = (hid: string) => collection(db, 'households', hid, 'tasks');
const completionsCol = (hid: string) => collection(db, 'households', hid, 'completions');
const taskRef = (hid: string, id: string) => doc(db, 'households', hid, 'tasks', id);

/** Registros del historial que se mantienen cargados: de sobra para el balance del mes. */
const COMPLETIONS_LIMIT = 300;

type Raw = Record<string, unknown>;

const text = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const textOrNull = (value: unknown) => (typeof value === 'string' ? value : null);
const effortOf = (value: unknown): Effort => (value === 1 || value === 3 ? value : 2);
const modeOf = (value: unknown): TaskMode =>
  value === 'fixed' || value === 'free' ? value : 'rotation';

function toZone(id: string, data: Raw): Zone {
  return {
    id,
    name: text(data.name),
    icon: text(data.icon),
    order: typeof data.order === 'number' ? data.order : 0,
  };
}

function toProgress(data: Raw): TaskProgress {
  return {
    nextDueOn: text(data.nextDueOn),
    assigneeId: textOrNull(data.assigneeId),
    lastCompletedOn: textOrNull(data.lastCompletedOn),
    lastCompletedBy: textOrNull(data.lastCompletedBy),
    lastCompletionId: textOrNull(data.lastCompletionId),
    archived: data.archived === true,
  };
}

function toTask(id: string, data: Raw): Task {
  return {
    id,
    title: text(data.title),
    icon: text(data.icon),
    zoneId: textOrNull(data.zoneId),
    effort: effortOf(data.effort),
    mode: modeOf(data.mode),
    rotationOrder: Array.isArray(data.rotationOrder) ? (data.rotationOrder as string[]) : [],
    intervalDays: typeof data.intervalDays === 'number' ? data.intervalDays : null,
    onDemand: data.onDemand === true,
    ...toProgress(data),
  };
}

function toCompletion(id: string, data: Raw): Completion {
  return {
    id,
    taskId: text(data.taskId),
    title: text(data.title),
    icon: text(data.icon),
    effort: effortOf(data.effort),
    zoneId: textOrNull(data.zoneId),
    completedBy: text(data.completedBy),
    completedOn: text(data.completedOn),
    previous: toProgress((data.previous ?? {}) as Raw),
  };
}

type OnError = (error: unknown) => void;

export function watchZones(hid: string, onChange: (zones: Zone[]) => void, onError: OnError) {
  return onSnapshot(
    zonesCol(hid),
    (snapshot) => {
      const zones = snapshot.docs.map((zoneDoc) => toZone(zoneDoc.id, zoneDoc.data()));
      onChange(zones.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
    },
    onError,
  );
}

/** Incluye las archivadas: hacen falta para deshacer una tarea puntual ya hecha. */
export function watchTasks(hid: string, onChange: (tasks: Task[]) => void, onError: OnError) {
  return onSnapshot(
    tasksCol(hid),
    (snapshot) => onChange(snapshot.docs.map((taskDoc) => toTask(taskDoc.id, taskDoc.data()))),
    onError,
  );
}

export function watchCompletions(
  hid: string,
  onChange: (completions: Completion[]) => void,
  onError: OnError,
) {
  return onSnapshot(
    query(completionsCol(hid), orderBy('completedAt', 'desc'), limit(COMPLETIONS_LIMIT)),
    (snapshot) =>
      onChange(snapshot.docs.map((entry) => toCompletion(entry.id, entry.data()))),
    onError,
  );
}

// ---------- Zonas ----------

export async function createZone(hid: string, zone: Omit<Zone, 'id'>): Promise<string> {
  const ref = doc(zonesCol(hid));
  await setDoc(ref, zone);
  return ref.id;
}

export async function updateZone(hid: string, id: string, changes: Partial<Omit<Zone, 'id'>>) {
  await updateDoc(doc(db, 'households', hid, 'zones', id), changes);
}

export async function deleteZone(hid: string, id: string) {
  await deleteDoc(doc(db, 'households', hid, 'zones', id));
}

// ---------- Tareas ----------

function newTaskData(draft: TaskDraft) {
  return {
    ...draft,
    rotationOrder: [],
    lastCompletedOn: null,
    lastCompletedBy: null,
    lastCompletionId: null,
    archived: false,
    createdAt: serverTimestamp(),
  };
}

export async function createTask(hid: string, draft: TaskDraft): Promise<string> {
  const ref = doc(tasksCol(hid));
  await setDoc(ref, newTaskData(draft));
  return ref.id;
}

export async function updateTask(hid: string, id: string, changes: Partial<TaskDraft>) {
  await updateDoc(taskRef(hid, id), changes);
}

export async function archiveTask(hid: string, id: string) {
  await updateDoc(taskRef(hid, id), { archived: true });
}

export async function postponeTask(hid: string, id: string, today: DateKey, days: number) {
  await updateDoc(taskRef(hid, id), planPostpone(today, days));
}

/**
 * Marca la tarea como hecha por `completedBy`. Escritura atómica: el registro del
 * historial y el nuevo estado de la tarea van en un lote, que además funciona sin conexión.
 *
 * Devuelve el registro al momento y, aparte, la promesa de guardado: sin red esa promesa
 * no se resuelve hasta que vuelve la conexión, y la interfaz no debe esperarla.
 */
export function completeTask(
  hid: string,
  task: Task,
  context: { completedBy: string; today: DateKey; memberIds: readonly string[] },
): { completion: Completion; saved: Promise<void> } {
  const completionRef = doc(completionsCol(hid));
  const { completion, progress } = planCompletion({
    task,
    completionId: completionRef.id,
    ...context,
  });
  const { id: _id, ...completionData } = completion;

  const batch = writeBatch(db);
  batch.set(completionRef, { ...completionData, completedAt: serverTimestamp() });
  batch.update(taskRef(hid, task.id), progress);
  return { completion, saved: batch.commit() };
}

/** Borra el registro y devuelve la tarea a como estaba antes de completarla. */
export async function undoCompletion(hid: string, completion: Completion) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'households', hid, 'completions', completion.id));
  batch.update(taskRef(hid, completion.taskId), completion.previous);
  await batch.commit();
}

/**
 * Crea de una vez las zonas y tareas elegidas en la plantilla inicial.
 * Las zonas que ya existen (por nombre) se reutilizan.
 */
export async function applyTemplate(
  hid: string,
  params: {
    zones: { key: string; name: string; icon: string }[];
    tasks: {
      title: string;
      icon: string;
      zoneKey: string;
      effort: Effort;
      /** `null` en las tareas "cuando surgen". */
      intervalDays: number | null;
      onDemand: boolean;
    }[];
    existingZones: readonly Zone[];
    firstAssigneeId: string;
    today: DateKey;
  },
) {
  const batch = writeBatch(db);
  const zoneIds = new Map<string, string>();
  let order = params.existingZones.reduce((max, zone) => Math.max(max, zone.order + 1), 0);

  for (const zone of params.zones) {
    const existing = params.existingZones.find(
      (candidate) => candidate.name.toLowerCase() === zone.name.toLowerCase(),
    );
    if (existing) {
      zoneIds.set(zone.key, existing.id);
      continue;
    }
    const ref = doc(zonesCol(hid));
    batch.set(ref, { name: zone.name, icon: zone.icon, order: order++ });
    zoneIds.set(zone.key, ref.id);
  }

  for (const task of params.tasks) {
    batch.set(
      doc(tasksCol(hid)),
      newTaskData({
        title: task.title,
        icon: task.icon,
        zoneId: zoneIds.get(task.zoneKey) ?? null,
        effort: task.effort,
        // Con fecha, por turnos: es el reparto que mejor encaja para empezar siendo dos.
        // Las que surgen no son de nadie.
        mode: task.onDemand ? 'free' : 'rotation',
        assigneeId: task.onDemand ? null : params.firstAssigneeId,
        intervalDays: task.intervalDays,
        onDemand: task.onDemand,
        nextDueOn: params.today,
      }),
    );
  }

  await batch.commit();
}
