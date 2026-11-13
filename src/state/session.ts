import { create } from 'zustand';

import { auth, onAuthStateChanged } from '@/data/fb';
import { watchHousehold, watchMembers } from '@/data/households';
import {
  saveUserProfile,
  watchUserHousehold,
  watchUserLanguage,
  type UserProfile,
} from '@/data/users';
import type { Household, Member } from '@/domain/household';
import { isAppLanguage, setAppLanguage } from '@/i18n';
import { startAgendaSync } from '@/state/agenda';
import { startExtrasSync } from '@/state/extras';
import { startShoppingSync } from '@/state/shopping';
import { startTasksSync } from '@/state/tasks';

export type SessionUser = UserProfile;

/**
 * - `loading`: aún no se sabe quién hay ni si tiene hogar.
 * - `signedOut`: sin sesión.
 * - `needsHousehold`: con sesión pero sin hogar (toca crear uno o unirse).
 * - `ready`: con sesión y hogar cargado.
 */
export type SessionStatus = 'loading' | 'signedOut' | 'needsHousehold' | 'ready';

type SessionState = {
  status: SessionStatus;
  user: SessionUser | null;
  household: Household | null;
  members: Member[];
  /** Código de un enlace de invitación abierto antes de poder usarlo. */
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
};

export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  user: null,
  household: null,
  members: [],
  pendingInviteCode: null,
  setPendingInviteCode: (code) => set({ pendingInviteCode: code }),
}));

/** La ficha de miembro del usuario actual dentro de su hogar. */
export function useCurrentMember(): Member | null {
  const uid = useSession((state) => state.user?.uid);
  const members = useSession((state) => state.members);
  return members.find((member) => member.uid === uid) ?? null;
}

/**
 * Mantiene la sesión al día: cuenta de Firebase Auth → `users/{uid}` → hogar y miembros.
 * Devuelve la función para dejar de escuchar.
 */
export function startSessionListener(): () => void {
  let stopUser: (() => void) | undefined;
  let stopLanguage: (() => void) | undefined;
  let stopHousehold: (() => void) | undefined;
  let currentHouseholdId: string | null | undefined;

  const stopWatchingHousehold = () => {
    stopHousehold?.();
    stopHousehold = undefined;
    currentHouseholdId = undefined;
  };

  const noHousehold = () => {
    stopWatchingHousehold();
    currentHouseholdId = null;
    useSession.setState({ status: 'needsHousehold', household: null, members: [] });
  };

  const onHouseholdId = (householdId: string | null) => {
    if (householdId === currentHouseholdId) return;
    if (!householdId) {
      noHousehold();
      return;
    }
    stopWatchingHousehold();
    currentHouseholdId = householdId;

    const stopDoc = watchHousehold(
      householdId,
      (household) => {
        if (!household) {
          noHousehold();
          return;
        }
        useSession.setState({ status: 'ready', household });
      },
      // Si deja de ser miembro, las reglas cortan la escucha: vuelve a estar sin hogar.
      noHousehold,
    );
    const stopMembers = watchMembers(
      householdId,
      (members) => useSession.setState({ members }),
      () => undefined,
    );
    const stopTasks = startTasksSync(householdId);
    const stopShopping = startShoppingSync(householdId);
    const stopAgenda = startAgendaSync(householdId);
    const stopExtras = startExtrasSync(householdId);
    stopHousehold = () => {
      stopDoc();
      stopMembers();
      stopTasks();
      stopShopping();
      stopAgenda();
      stopExtras();
    };
  };

  const stopAuth = onAuthStateChanged(auth, (firebaseUser) => {
    stopUser?.();
    stopUser = undefined;
    stopLanguage?.();
    stopLanguage = undefined;
    stopWatchingHousehold();

    if (!firebaseUser) {
      // Sin sesión, la app vuelve al idioma del móvil.
      setAppLanguage(null);
      useSession.setState({ status: 'signedOut', user: null, household: null, members: [] });
      return;
    }

    const user: SessionUser = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
    useSession.setState({ status: 'loading', user, household: null, members: [] });

    // Si falla (sin conexión), se reintenta sola al volver la red: la escritura queda en cola.
    saveUserProfile(user).catch(() => undefined);
    stopUser = watchUserHousehold(user.uid, onHouseholdId, noHousehold);
    // El idioma elegido en el perfil manda sobre el del móvil.
    stopLanguage = watchUserLanguage(user.uid, (language) =>
      setAppLanguage(isAppLanguage(language) ? language : null),
    );
  });

  return () => {
    stopAuth();
    stopUser?.();
    stopLanguage?.();
    stopWatchingHousehold();
  };
}
