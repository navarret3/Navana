/**
 * Avisos en el dispositivo — versión nativa: permisos, token de Expo Push y avisos locales.
 * En la web (`device.web.ts`) no hay avisos y todo esto no hace nada.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { NOTIFICATION_CHANNEL } from './expoPush';

/**
 * - `granted`: se pueden mostrar avisos.
 * - `undetermined`: aún se puede preguntar al usuario.
 * - `denied`: Android ya no deja preguntar; hay que activarlos en los ajustes del sistema.
 * - `unsupported`: aquí no hay avisos (vista web).
 */
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type LocalNotification = {
  title: string;
  body: string;
  at: Date;
  /** Datos para saber qué abrir al tocar el aviso. */
  data?: Record<string, string>;
};

let initialized = false;

/** Prepara el canal de Android y hace que los avisos también se vean con la app abierta. */
export async function initNotifications(): Promise<void> {
  if (initialized) return;
  initialized = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
      name: 'Navana',
      importance: AndroidImportance.DEFAULT,
    });
  }
}

type RawPermission = { granted: boolean; canAskAgain: boolean };

// En Android 13 o superior, antes de preguntar por primera vez el sistema ya responde
// "denegado": lo que distingue ese caso de un bloqueo de verdad es `canAskAgain`.
function toState(permission: RawPermission): PermissionState {
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPermissionState(): Promise<PermissionState> {
  return toState(await Notifications.getPermissionsAsync());
}

/** Pide permiso si todavía se puede preguntar. Necesita que el canal ya exista. */
export async function requestPermission(): Promise<PermissionState> {
  await initNotifications();
  const current = toState(await Notifications.getPermissionsAsync());
  if (current !== 'undetermined') return current;
  return toState(await Notifications.requestPermissionsAsync());
}

/** Token de Expo Push de este móvil, o `null` si no hay permiso o es un emulador. */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if ((await getPermissionState()) !== 'granted') return null;
  const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== 'string') return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/** Sustituye todos los avisos locales programados por la lista dada. */
export async function scheduleLocalNotifications(
  notifications: readonly LocalNotification[],
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if ((await getPermissionState()) !== 'granted') return;
  for (const notification of notifications) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data ?? {},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notification.at,
        channelId: NOTIFICATION_CHANNEL,
      },
    });
  }
}

/**
 * Avisa cuando se toca una notificación, también si fue la que abrió la app.
 * Devuelve cómo dejar de escuchar.
 */
export function onNotificationOpened(
  handler: (data: Record<string, unknown>) => void,
): () => void {
  const last = Notifications.getLastNotificationResponse();
  if (last) {
    handler(last.notification.request.content.data ?? {});
    Notifications.clearLastNotificationResponse();
  }
  const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
    handler(response.notification.request.content.data ?? {}),
  );
  return () => subscription.remove();
}
