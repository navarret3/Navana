import type { Href } from 'expo-router';
import type { ComponentType } from 'react';

import { AgendaTodayCard } from '@/features/agenda/AgendaTodayCard';
import { ShoppingTodayCard } from '@/features/shopping/ShoppingTodayCard';
import { TasksTodayCard } from '@/features/tasks/TasksTodayCard';

/**
 * Registro de módulos activables. Cada módulo aporta una pestaña y una tarjeta
 * para "Hoy"; `household.enabledModules` decide cuáles se muestran.
 * Los módulos futuros (menú semanal, notas) se enchufan añadiendo una entrada.
 */

export const moduleIds = ['tasks', 'shopping', 'agenda'] as const;

export type ModuleId = (typeof moduleIds)[number];

export type EnabledModules = Partial<Record<ModuleId, boolean>>;

export type AppModule = {
  id: ModuleId;
  icon: string;
  /** Ruta de su pestaña dentro de `app/(tabs)/`. */
  href: Href;
  /** Tarjeta resumen que aparece en "Hoy". */
  TodayCard: ComponentType;
  enabledByDefault: boolean;
};

export const modules: readonly AppModule[] = [
  { id: 'tasks', icon: '🧹', href: '/tasks', TodayCard: TasksTodayCard, enabledByDefault: true },
  {
    id: 'shopping',
    icon: '🛒',
    href: '/shopping',
    TodayCard: ShoppingTodayCard,
    enabledByDefault: true,
  },
  { id: 'agenda', icon: '📅', href: '/agenda', TodayCard: AgendaTodayCard, enabledByDefault: true },
];

/** Un módulo sin valor guardado en el hogar usa su valor por defecto. */
export function isModuleEnabled(module: AppModule, enabled: EnabledModules): boolean {
  return enabled[module.id] ?? module.enabledByDefault;
}

/** Módulos visibles, en el orden del registro. */
export function getEnabledModules(enabled: EnabledModules): AppModule[] {
  return modules.filter((module) => isModuleEnabled(module, enabled));
}
