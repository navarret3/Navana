import type { Member, NotifyPrefs } from '@/domain/household';

import { pushTransport, type PushMessage } from './transport';

/**
 * Manda un aviso a los demás miembros del hogar que lo quieran recibir.
 * Si falla (sin red, token caducado…) no pasa nada: un aviso perdido no debe
 * estropear la acción que lo provocó.
 */
export function notifyOthers(params: {
  members: readonly Member[];
  fromUid: string;
  /** Preferencia del destinatario que tiene que estar activada. */
  pref: Extract<keyof NotifyPrefs, 'partnerCompleted' | 'nudges'>;
  message: PushMessage;
  /** Para avisar a una sola persona en vez de a todas las demás. */
  onlyUid?: string;
}): void {
  const { members, fromUid, pref, message, onlyUid } = params;
  const tokens = members
    .filter((member) => member.uid !== fromUid)
    .filter((member) => onlyUid === undefined || member.uid === onlyUid)
    .filter((member) => member.notify[pref])
    .flatMap((member) => member.pushTokens);

  pushTransport
    .send(tokens, message)
    .catch((error) => console.warn('No se ha podido enviar el aviso', error));
}
