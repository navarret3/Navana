import { db, doc, getDocFromServer } from '@/data/fb';

export type BackendStatus = 'ok' | 'unreachable';

/**
 * Comprueba que Firestore responde, forzando una lectura al servidor.
 * Las reglas deniegan esa ruta: un "permission-denied" también demuestra que hay conexión.
 */
export async function checkBackend(): Promise<BackendStatus> {
  try {
    await getDocFromServer(doc(db, '_health/ping'));
    return 'ok';
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    // El SDK JS devuelve "permission-denied"; el nativo, "firestore/permission-denied".
    return typeof code === 'string' && code.endsWith('permission-denied') ? 'ok' : 'unreachable';
  }
}
