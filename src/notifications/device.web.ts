/** Avisos en el dispositivo — versión web: la vista de desarrollo no tiene avisos. */
import type * as Native from './device.native';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type LocalNotification = {
  title: string;
  body: string;
  at: Date;
  data?: Record<string, string>;
};

export async function initNotifications(): Promise<void> {}

export async function getPermissionState(): Promise<PermissionState> {
  return 'unsupported';
}

export async function requestPermission(): Promise<PermissionState> {
  return 'unsupported';
}

export async function getPushToken(): Promise<string | null> {
  return null;
}

export async function scheduleLocalNotifications(
  _notifications: readonly LocalNotification[],
): Promise<void> {}

export function onNotificationOpened(
  _handler: (data: Record<string, unknown>) => void,
): () => void {
  return () => undefined;
}

// Comprobación en tiempo de compilación: este fichero exporta lo mismo que el nativo.
type Web = typeof import('./device.web');
type MissingInWeb = Exclude<keyof typeof Native, keyof Web>;
type MissingInNative = Exclude<keyof Web, keyof typeof Native>;
const sameExports: [MissingInWeb, MissingInNative] extends [never, never] ? true : never = true;
void sameExports;
