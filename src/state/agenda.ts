import { create } from 'zustand';

import { watchEvents } from '@/data/events';
import type { AgendaEvent } from '@/domain/agenda/types';

type AgendaState = {
  events: AgendaEvent[];
};

export const useAgenda = create<AgendaState>()(() => ({
  events: [],
}));

/** Empieza a escuchar los eventos del hogar. Devuelve cómo parar. */
export function startAgendaSync(householdId: string): () => void {
  // Si se pierde el acceso al hogar, la sesión ya se encarga de sacar al usuario.
  const stop = watchEvents(
    householdId,
    (events) => useAgenda.setState({ events }),
    () => undefined,
  );
  return () => {
    stop();
    useAgenda.setState({ events: [] });
  };
}
