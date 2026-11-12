/**
 * Inicio de sesión — versión web, solo para desarrollo.
 * El emulador de Auth acepta tokens de Google inventados, así que se puede entrar
 * como dos personas distintas (en dos pestañas) sin cuentas reales.
 */
import { auth, deleteUser, GoogleAuthProvider, signInWithCredential, signOut } from '@/data/fb';

import type * as Native from './signIn.native';

export type TestUser = { id: string; name: string; email: string };

export const testUsers: readonly TestUser[] = [
  { id: 'ana', name: 'Ana García', email: 'ana@example.test' },
  { id: 'bruno', name: 'Bruno Pérez', email: 'bruno@example.test' },
];

export type SignInResult = 'signedIn' | 'cancelled';

export async function signInWithGoogle(): Promise<SignInResult> {
  throw new Error('En la vista web se entra con los usuarios de prueba.');
}

export async function signInAsTestUser(user: TestUser): Promise<SignInResult> {
  const fakeIdToken = JSON.stringify({
    sub: user.id,
    email: user.email,
    email_verified: true,
    name: user.name,
  });
  await signInWithCredential(auth, GoogleAuthProvider.credential(fakeIdToken));
  return 'signedIn';
}

export async function signOutEverywhere(): Promise<void> {
  await signOut(auth);
}

/** Con los usuarios de prueba no hace falta confirmar nada. */
export async function reauthenticate(): Promise<boolean> {
  return true;
}

export async function deleteAuthAccount(): Promise<void> {
  const user = auth.currentUser;
  if (user) await deleteUser(user);
}

// Comprobación en tiempo de compilación: este fichero exporta lo mismo que el nativo.
type Web = typeof import('./signIn.web');
type MissingInWeb = Exclude<keyof typeof Native, keyof Web>;
type MissingInNative = Exclude<keyof Web, keyof typeof Native>;
const sameExports: [MissingInWeb, MissingInNative] extends [never, never] ? true : never = true;
void sameExports;
