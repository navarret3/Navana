import { expoPushTransport } from './expoPush';

export type PushMessage = {
  title: string;
  body: string;
  /** Datos para saber qué abrir al tocar el aviso. */
  data?: Record<string, string>;
};

/**
 * Cómo se manda un aviso a los móviles de otra persona.
 *
 * Hoy lo envía el propio móvil que actúa, a través de Expo Push Service, porque el plan
 * gratuito de Firebase no tiene servidor. El resto de la app solo conoce esta interfaz,
 * así que el día que se pase a Cloud Functions basta con cambiar la implementación.
 */
export interface PushTransport {
  send(tokens: readonly string[], message: PushMessage): Promise<void>;
}

export const pushTransport: PushTransport = expoPushTransport;
