import { db, doc, onSnapshot, setDoc } from '@/data/fb';
import { isMembershipWriteInFlight, onMembershipWritesSettled } from '@/data/membershipWrites';

export type UserProfile = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
};

const userRef = (uid: string) => doc(db, 'users', uid);

/**
 * Guarda nombre y foto de la cuenta de Google en `users/{uid}`.
 * Usa `merge` para no pisar `householdId` si el documento ya existía.
 */
export async function saveUserProfile(user: UserProfile): Promise<void> {
  await setDoc(
    userRef(user.uid),
    { name: user.displayName ?? '', photoURL: user.photoURL },
    { merge: true },
  );
}

/**
 * Avisa del hogar del usuario cada vez que cambia.
 *
 * Mientras se está creando un hogar o uniéndose a uno, espera a que la escritura
 * termine antes de avisar (ver `membershipWrites.ts`).
 */
export function watchUserHousehold(
  uid: string,
  onChange: (householdId: string | null) => void,
  onError: (error: unknown) => void,
): () => void {
  let latest: string | null | undefined;
  const emit = () => {
    if (latest !== undefined && !isMembershipWriteInFlight()) {
      onChange(latest);
    }
  };

  const stopWaiting = onMembershipWritesSettled(emit);
  const stopSnapshots = onSnapshot(
    userRef(uid),
    // Hace falta para enterarse de cuándo un dato en caché pasa a estar confirmado.
    { includeMetadataChanges: true },
    (snapshot) => {
      const householdId: unknown = snapshot.data()?.householdId;
      if (typeof householdId === 'string') {
        // Con hogar apuntado nos fiamos también de la caché: así la app abre sin conexión.
        latest = householdId;
      } else if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) {
        // "Sin hogar" no es fiable mientras solo se vea lo escrito en local: al abrir
        // sesión se guarda el perfil y, hasta que el servidor responde, el documento
        // aparece sin el resto de sus campos. Se espera a la versión confirmada.
        return;
      } else {
        latest = null;
      }
      emit();
    },
    onError,
  );

  return () => {
    stopWaiting();
    stopSnapshots();
  };
}
