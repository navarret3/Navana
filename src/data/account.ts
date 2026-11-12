import { db, deleteDoc, doc } from '@/data/fb';
import { leaveHousehold } from '@/data/households';
import { deleteAuthAccount, reauthenticate } from '@/data/signIn';

/**
 * Elimina la cuenta de quien la pide: lo saca de su hogar, borra su perfil y, por
 * último, borra su acceso. Lo que hizo en el hogar (tareas completadas, productos
 * añadidos) se queda, ya sin nombre: es parte del historial de los demás.
 *
 * Primero se confirma la cuenta de Google, porque Firebase solo deja borrar una cuenta
 * con un inicio de sesión reciente y sería peor quedarse a medias.
 */
export async function deleteAccount(params: {
  uid: string;
  householdId: string | null;
}): Promise<'deleted' | 'cancelled'> {
  if (!(await reauthenticate())) return 'cancelled';
  if (params.householdId) {
    await leaveHousehold(params.householdId, params.uid);
  }
  await deleteDoc(doc(db, 'users', params.uid));
  await deleteAuthAccount();
  return 'deleted';
}
