/**
 * Al crear un hogar o unirse a uno, `users/{uid}.householdId` cambia en local antes de
 * que el lote se haya guardado en el servidor. Si en ese instante se empezara a escuchar
 * el hogar, las reglas responderían "permiso denegado" (todavía no es miembro).
 *
 * Este módulo marca cuándo hay una escritura de ese tipo en marcha, para que quien
 * observa el `householdId` espere a que termine.
 */

let writesInFlight = 0;
const waiters = new Set<() => void>();

export function isMembershipWriteInFlight(): boolean {
  return writesInFlight > 0;
}

/** Ejecuta la escritura y avisa a los observadores cuando ya no queda ninguna en marcha. */
export async function duringMembershipWrite<T>(write: () => Promise<T>): Promise<T> {
  writesInFlight++;
  try {
    return await write();
  } finally {
    writesInFlight--;
    if (writesInFlight === 0) {
      waiters.forEach((notify) => notify());
    }
  }
}

/** Se llama cada vez que deja de haber escrituras en marcha. Devuelve cómo darse de baja. */
export function onMembershipWritesSettled(notify: () => void): () => void {
  waiters.add(notify);
  return () => {
    waiters.delete(notify);
  };
}
