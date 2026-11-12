import type { Href } from 'expo-router';

/**
 * Registro de módulos activables. Cada módulo aporta una pestaña y una tarjeta
 * para "Hoy" (en `todayCards.ts`); `household.enabledModules` decide cuáles se muestran.
 * Los módulos futuros (menú semanal, notas) se enchufan añadiendo una entrada aquí y allí.
 *
 * Este fichero solo tiene datos: no importa pantallas ni Firebase, así que se puede
 * usar desde los tests y desde la lógica de dominio.
 */

export const moduleIds = ['tasks', 'shopping', 'agenda', 'menu', 'notes'] as const;

export type ModuleId = (typeof moduleIds)[number];

export type EnabledModules = Partial<Record<string, boolean>>;

export type AppModule = {
  id: ModuleId;
  icon: string;
  /** Ruta de su pestaña dentro de `app/(tabs)/`. */
  href: Href;
  enabledByDefault: boolean;
};

export const modules: readonly AppModule[] = [
  { id: 'tasks', icon: '🧹', href: '/tasks', enabledByDefault: true },
  { id: 'shopping', icon: '🛒', href: '/shopping', enabledByDefault: true },
  { id: 'agenda', icon: '📅', href: '/agenda', enabledByDefault: true },
  // Los módulos opcionales empiezan apagados: se activan en Ajustes → Módulos.
  { id: 'menu', icon: '🍽️', href: '/menu', enabledByDefault: false },
  { id: 'notes', icon: '📝', href: '/notes', enabledByDefault: false },
];

/** Un módulo sin valor guardado en el hogar usa su valor por defecto. */
export function isModuleEnabled(module: AppModule, enabled: EnabledModules): boolean {
  return enabled[module.id] ?? module.enabledByDefault;
}

/** Módulos visibles, en el orden del registro. */
export function getEnabledModules(enabled: EnabledModules): AppModule[] {
  return modules.filter((module) => isModuleEnabled(module, enabled));
}
