/**
 * Inicio de sesión — versión nativa: cuenta de Google real y credencial de Firebase Auth.
 * En web (`signIn.web.ts`) se entra con usuarios de prueba del emulador.
 */
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

import { auth, deleteUser, GoogleAuthProvider, signInWithCredential, signOut } from '@/data/fb';

export type TestUser = { id: string; name: string; email: string };

/** Solo hay usuarios de prueba en la vista web de desarrollo. */
export const testUsers: readonly TestUser[] = [];

export type SignInResult = 'signedIn' | 'cancelled';

// `app.config.ts` saca este ID del cliente web de `google-services.json`.
const webClientId: unknown = Constants.expoConfig?.extra?.googleWebClientId;

GoogleSignin.configure({
  webClientId: typeof webClientId === 'string' ? webClientId : undefined,
});

export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return 'cancelled';
    const { idToken } = response.data;
    if (!idToken) {
      throw new Error('Google no ha devuelto un token de identidad (revisa el ID de cliente web).');
    }
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return 'signedIn';
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return 'cancelled';
    }
    throw error;
  }
}

export async function signInAsTestUser(_user: TestUser): Promise<SignInResult> {
  throw new Error('Los usuarios de prueba solo existen en la vista web de desarrollo.');
}

export async function signOutEverywhere(): Promise<void> {
  // Sin esto, el siguiente inicio de sesión reutilizaría la misma cuenta de Google sin preguntar.
  await GoogleSignin.signOut().catch(() => undefined);
  await signOut(auth);
}

/**
 * Vuelve a pedir la cuenta de Google. Firebase solo deja borrar una cuenta con un
 * inicio de sesión reciente. Devuelve `false` si la persona cancela.
 */
export async function reauthenticate(): Promise<boolean> {
  return (await signInWithGoogle()) === 'signedIn';
}

/** Borra el acceso de la cuenta actual. Los datos se borran antes, en `data/account.ts`. */
export async function deleteAuthAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await deleteUser(user);
  await GoogleSignin.signOut().catch(() => undefined);
}
