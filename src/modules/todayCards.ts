import type { ComponentType } from 'react';

import { AgendaTodayCard } from '@/features/agenda/AgendaTodayCard';
import { MenuTodayCard } from '@/features/menu/MenuTodayCard';
import { NotesTodayCard } from '@/features/notes/NotesTodayCard';
import { ShoppingTodayCard } from '@/features/shopping/ShoppingTodayCard';
import { TasksTodayCard } from '@/features/tasks/TasksTodayCard';

import type { ModuleId } from './registry';

/** Tarjeta resumen que cada módulo aporta a "Hoy". */
export const todayCards: Record<ModuleId, ComponentType> = {
  tasks: TasksTodayCard,
  shopping: ShoppingTodayCard,
  agenda: AgendaTodayCard,
  menu: MenuTodayCard,
  notes: NotesTodayCard,
};
