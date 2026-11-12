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
};

export const TEMPLATE_TASKS = [
  { key: 'kitchen', icon: '🧽', zone: 'kitchen', effort: 2, intervalDays: 7 },
  { key: 'bathroom', icon: '🚿', zone: 'bathroom', effort: 3, intervalDays: 7 },
  { key: 'mop', icon: '🪣', zone: 'wholeHouse', effort: 2, intervalDays: 7 },
  { key: 'vacuum', icon: '🧹', zone: 'wholeHouse', effort: 2, intervalDays: 4 },
  { key: 'litter', icon: '🐈', zone: 'cats', effort: 1, intervalDays: 1 },
  { key: 'trash', icon: '🗑️', zone: 'kitchen', effort: 1, intervalDays: 2 },
  { key: 'sheets', icon: '🛏️', zone: 'bedroom', effort: 2, intervalDays: 14 },
] as const satisfies readonly TemplateTask[];

export type TemplateTaskKey = (typeof TEMPLATE_TASKS)[number]['key'];

/** Lo que se hace "cuando surge": sin fecha, se apunta cada vez. */
export const TEMPLATE_ON_DEMAND = [
  { key: 'sweep', icon: '🧹', zone: 'wholeHouse', effort: 1 },
  { key: 'dishes', icon: '🍽️', zone: 'kitchen', effort: 1 },
  { key: 'dishwasher', icon: '🫧', zone: 'kitchen', effort: 1 },
  { key: 'laundry', icon: '🧺', zone: 'wholeHouse', effort: 1 },
  { key: 'hang', icon: '👕', zone: 'wholeHouse', effort: 1 },
  { key: 'unhang', icon: '🧦', zone: 'wholeHouse', effort: 1 },
] as const satisfies readonly Omit<TemplateTask, 'intervalDays'>[];

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
