import { create } from 'zustand';

import { auth, onAuthStateChanged } from '@/data/fb';
import type { EnabledModules, ModuleId } from '@/modules/registry';

export type SessionUser = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
};

type SessionState = {
  /** `loading` hasta que Firebase Auth informa del usuario guardado. */
  status: 'loading' | 'signedOut' | 'signedIn';
  user: SessionUser | null;
  /** Hogar del usuario. Se carga con el perfil en la Fase 1. */
  householdId: string | null;
  /** Copia de `household.enabledModules`. Hasta la Fase 1 solo vive en memoria. */
  enabledModules: EnabledModules;
  setModuleEnabled: (id: ModuleId, enabled: boolean) => void;
};

export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  user: null,
  householdId: null,
  enabledModules: {},
  setModuleEnabled: (id, enabled) =>
    set((state) => ({ enabledModules: { ...state.enabledModules, [id]: enabled } })),
}));

/** Mantiene la sesión al día con Firebase Auth. Devuelve la función para dejar de escuchar. */
export function startSessionListener(): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      useSession.setState({ status: 'signedOut', user: null, householdId: null });
      return;
    }
    useSession.setState({
      status: 'signedIn',
      user: {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      },
    });
  });
}
