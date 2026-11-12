import { create } from 'zustand';

import { watchCompletions, watchTasks, watchZones } from '@/data/tasks';
import type { Completion, Task, Zone } from '@/domain/tasks/types';

type TasksState = {
  zones: Zone[];
  /** Todas las tareas del hogar, también las archivadas. */
  tasks: Task[];
  /** Historial reciente, de más nuevo a más antiguo. */
  completions: Completion[];
  /** Lo último que se ha completado en este móvil, para ofrecer "Deshacer". */
  justCompleted: Completion | null;
  setJustCompleted: (completion: Completion | null) => void;
  /** Al estrenar un hogar se ofrece la plantilla de tareas una vez. */
  offerTemplate: boolean;
  setOfferTemplate: (offer: boolean) => void;
};

export const useTasks = create<TasksState>()((set) => ({
  zones: [],
  tasks: [],
  completions: [],
  justCompleted: null,
  setJustCompleted: (completion) => set({ justCompleted: completion }),
  offerTemplate: false,
  setOfferTemplate: (offer) => set({ offerTemplate: offer }),
}));

/** Empieza a escuchar las zonas, tareas e historial del hogar. Devuelve cómo parar. */
export function startTasksSync(householdId: string): () => void {
  // Si se pierde el acceso al hogar, la sesión ya se encarga de sacar al usuario.
  const ignore = () => undefined;
  const stops = [
    watchZones(householdId, (zones) => useTasks.setState({ zones }), ignore),
    watchTasks(householdId, (tasks) => useTasks.setState({ tasks }), ignore),
    watchCompletions(householdId, (completions) => useTasks.setState({ completions }), ignore),
  ];
  return () => {
    stops.forEach((stop) => stop());
    useTasks.setState({ zones: [], tasks: [], completions: [], justCompleted: null });
  };
}
