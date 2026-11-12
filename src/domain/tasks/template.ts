import type { Effort } from './types';

/** Zonas y tareas típicas que se ofrecen al estrenar un hogar. Los textos están en i18n. */

export const TEMPLATE_ZONES = [
  { key: 'kitchen', icon: '🍳' },
  { key: 'bathroom', icon: '🚿' },
  { key: 'livingRoom', icon: '🛋️' },
  { key: 'bedroom', icon: '🛏️' },
  { key: 'cats', icon: '🐈' },
  { key: 'wholeHouse', icon: '🏠' },
] as const;

export type TemplateZoneKey = (typeof TEMPLATE_ZONES)[number]['key'];

export type TemplateTask = {
  key: string;
  icon: string;
  zone: TemplateZoneKey;
  effort: Effort;
  intervalDays: number;
  /** `weekend`: la primera vez toca el próximo fin de semana, no hoy. */
  starts?: 'weekend';
};

/** Lo que se hace cada cierto tiempo, por turnos. */
export const TEMPLATE_TASKS = [
  { key: 'litter', icon: '🐈', zone: 'cats', effort: 1, intervalDays: 1 },
  { key: 'waterBowl', icon: '💧', zone: 'cats', effort: 1, intervalDays: 7, starts: 'weekend' },
] as const satisfies readonly TemplateTask[];

export type TemplateTaskKey = (typeof TEMPLATE_TASKS)[number]['key'];

/** Lo que se hace "cuando surge": sin fecha, se apunta cada vez. */
export const TEMPLATE_ON_DEMAND = [
  { key: 'sweepKitchen', icon: '🧹', zone: 'kitchen', effort: 1 },
  { key: 'mopKitchen', icon: '🪣', zone: 'kitchen', effort: 1 },
  { key: 'dishes', icon: '🍽️', zone: 'kitchen', effort: 1 },
  { key: 'cook', icon: '🍳', zone: 'kitchen', effort: 2 },
  { key: 'sweepHouse', icon: '🧹', zone: 'wholeHouse', effort: 2 },
  { key: 'mopHouse', icon: '🪣', zone: 'wholeHouse', effort: 2 },
  { key: 'sheets', icon: '🛏️', zone: 'bedroom', effort: 2 },
  { key: 'hang', icon: '👕', zone: 'wholeHouse', effort: 1 },
  { key: 'unhang', icon: '🧦', zone: 'wholeHouse', effort: 1 },
  { key: 'bathroomSink', icon: '🚿', zone: 'bathroom', effort: 1 },
  { key: 'toilet', icon: '🚽', zone: 'bathroom', effort: 1 },
  { key: 'livingRoom', icon: '🛋️', zone: 'livingRoom', effort: 2 },
  { key: 'counter', icon: '🧽', zone: 'kitchen', effort: 1 },
  { key: 'microwave', icon: '✨', zone: 'kitchen', effort: 1 },
  { key: 'hood', icon: '💨', zone: 'kitchen', effort: 2 },
  { key: 'oven', icon: '🔥', zone: 'kitchen', effort: 3 },
  { key: 'fridge', icon: '🧊', zone: 'kitchen', effort: 2 },
] as const satisfies readonly Omit<TemplateTask, 'intervalDays' | 'starts'>[];

export type TemplateOnDemandKey = (typeof TEMPLATE_ON_DEMAND)[number]['key'];

/** Iconos para elegir al crear una tarea a mano. */
export const TASK_ICONS = [
  '🧹', '🧽', '🪣', '🚿', '🧺', '🛏️', '🗑️', '🍳', '🍽️', '🪴', '🐈', '🛒', '🧾', '🚗', '🔧', '✨',
] as const;

export const ZONE_ICONS = [
  '🍳', '🚿', '🛋️', '🛏️', '🐈', '🏠', '🪴', '🚗', '🧺', '💻', '🚪', '📦',
] as const;

/** Zonas que hacen falta para lo elegido en la plantilla, en el orden de la plantilla. */
export function zonesForTemplate(
  chosen: readonly { zone: TemplateZoneKey }[],
): TemplateZoneKey[] {
  const needed = new Set<string>(chosen.map((item) => item.zone));
  return TEMPLATE_ZONES.map((zone) => zone.key).filter((key) => needed.has(key));
}
