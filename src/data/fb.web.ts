/**
 * Shim de Firebase — versión web, solo para desarrollo.
 *
 * Usa el SDK JS contra los emuladores locales (`npm run emulators`) con un proyecto
 * `demo-`, así que nunca toca datos reales. Sirve para recorrer pantallas y flujos
 * en el navegador con usuarios de prueba; no es un producto web.
 */
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

import type * as Native from './fb.native';

const EMULATOR_HOST = '127.0.0.1';

const app = initializeApp({
  projectId: 'demo-navana',
  apiKey: 'demo-navana-key',
  appId: 'demo-navana-web',
});

export const backend: 'firebase' | 'emulator' = 'emulator';

export const auth = getAuth(app);
connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });

export const db = getFirestore(app);
connectFirestoreEmulator(db, EMULATOR_HOST, 8080);

export {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from 'firebase/auth';

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
} from 'firebase/firestore';

// Comprobación en tiempo de compilación: este fichero exporta lo mismo que el nativo.
type Web = typeof import('./fb.web');
type MissingInWeb = Exclude<keyof typeof Native, keyof Web>;
type MissingInNative = Exclude<keyof Web, keyof typeof Native>;
const sameExports: [MissingInWeb, MissingInNative] extends [never, never] ? true : never = true;
void sameExports;
