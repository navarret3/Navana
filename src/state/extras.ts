import { create } from 'zustand';

import { watchMenu, watchNotes } from '@/data/extras';
import type { DayMenu } from '@/domain/menu';
import type { Note } from '@/domain/notes';

type ExtrasState = {
  notes: Note[];
  /** Días del menú semanal que tienen algo apuntado. */
  menu: DayMenu[];
};

/** Estado de los módulos opcionales: notas compartidas y menú semanal. */
export const useExtras = create<ExtrasState>()(() => ({
  notes: [],
  menu: [],
}));

/** Empieza a escuchar las notas y el menú del hogar. Devuelve cómo parar. */
export function startExtrasSync(householdId: string): () => void {
  // Si se pierde el acceso al hogar, la sesión ya se encarga de sacar al usuario.
  const ignore = () => undefined;
  const stops = [
    watchNotes(householdId, (notes) => useExtras.setState({ notes }), ignore),
    watchMenu(householdId, (menu) => useExtras.setState({ menu }), ignore),
  ];
  return () => {
    stops.forEach((stop) => stop());
    useExtras.setState({ notes: [], menu: [] });
  };
}
