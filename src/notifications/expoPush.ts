import type { PushMessage, PushTransport } from './transport';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

/**
 * Canal de Android en el que se muestran los avisos (se crea en `device.native.ts`).
 *
 * Se llama `avisos` y no `default` porque el primero se creó con importancia normal, que no
 * despliega el aviso en pantalla, y Android no deja cambiar la importancia de un canal ya
 * creado: hay que estrenar otro. Un aviso enviado a un canal que el móvil de destino aún no
 * ha creado no se muestra, así que ese móvil tiene que haber abierto esta versión una vez.
 */
export const NOTIFICATION_CHANNEL = 'avisos';

/** Respuesta de Expo a cada aviso enviado, o al preguntar después qué fue de él. */
export type PushResult = {
  status: 'ok' | 'error';
  /** Con `ok` al enviar: identificador para preguntar luego por la entrega. */
  id?: string;
  message?: string;
  /** Código del fallo: `DeviceNotRegistered`, `InvalidCredentials`… */
  error?: string;
};

type RawResult = { status?: string; id?: string; message?: string; details?: { error?: string } };

function toResult(raw: RawResult | undefined): PushResult {
  return {
    status: raw?.status === 'ok' ? 'ok' : 'error',
    id: raw?.id,
    message: raw?.message,
    error: raw?.details?.error,
  };
}

async function post(url: string, body: unknown): Promise<{ data?: unknown }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Expo Push Service respondió ${response.status}`);
  }
  return (await response.json()) as { data?: unknown };
}

/** Envía el aviso a cada token y devuelve lo que Expo responde por cada uno, en orden. */
export async function sendExpoPush(
  tokens: readonly string[],
  message: PushMessage,
): Promise<PushResult[]> {
  if (tokens.length === 0) return [];
  const { data } = await post(
    EXPO_PUSH_URL,
    tokens.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      sound: 'default',
      channelId: NOTIFICATION_CHANNEL,
      // En Android la prioridad por defecto es "normal": con el móvil en reposo el aviso
      // se retrasa, a veces mucho. Con "high" se entrega al momento.
      priority: 'high',
    })),
  );
  const tickets = Array.isArray(data) ? data : [data];
  return tickets.map((ticket) => toResult(ticket as RawResult | undefined));
}

/**
 * Qué fue de un aviso ya enviado: si Google lo aceptó para entregarlo o por qué no.
 * Devuelve `null` si Expo todavía no lo sabe (suele tardar unos segundos).
 */
export async function getExpoPushReceipt(id: string): Promise<PushResult | null> {
  const { data } = await post(EXPO_RECEIPTS_URL, { ids: [id] });
  const receipt = (data as Record<string, RawResult> | undefined)?.[id];
  return receipt ? toResult(receipt) : null;
}

/** Envía avisos con Expo Push Service directamente desde el móvil. */
export const expoPushTransport: PushTransport = {
  async send(tokens: readonly string[], message: PushMessage): Promise<void> {
    const failed = (await sendExpoPush(tokens, message)).filter(
      (result) => result.status === 'error',
    );
    if (failed.length > 0) {
      throw new Error(
        failed.map((result) => result.error ?? result.message ?? 'error').join(', '),
      );
    }
  },
};
