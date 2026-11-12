import type { PushMessage, PushTransport } from './transport';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Canal de Android en el que se muestran los avisos (se crea en `device.native.ts`). */
export const NOTIFICATION_CHANNEL = 'default';

/** Envía avisos con Expo Push Service directamente desde el móvil. */
export const expoPushTransport: PushTransport = {
  async send(tokens: readonly string[], message: PushMessage): Promise<void> {
    if (tokens.length === 0) return;
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title: message.title,
          body: message.body,
          data: message.data ?? {},
          sound: 'default',
          channelId: NOTIFICATION_CHANNEL,
        })),
      ),
    });
    if (!response.ok) {
      throw new Error(`Expo Push Service respondió ${response.status}`);
    }
  },
};
