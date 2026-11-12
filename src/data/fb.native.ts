/**
 * Shim de Firebase — versión nativa (Android/iOS).
 *
 * Usa React Native Firebase, que guarda la caché de Firestore en disco: la compra
 * funciona en el súper sin cobertura. El resto de la app importa siempre desde
 * `@/data/fb`; Metro elige este fichero en el móvil y `fb.web.ts` en el navegador.
 *
 * Los dos ficheros deben exportar los mismos nombres (lo comprueba `fb.web.ts`).
 * Al necesitar una función nueva, se añade en ambos.
 */
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

/** A qué backend habla la app: el proyecto real de Firebase. */
export const backend: 'firebase' | 'emulator' = 'firebase';

export const auth = getAuth();
export const db = getFirestore();

export {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from '@react-native-firebase/auth';

export {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
