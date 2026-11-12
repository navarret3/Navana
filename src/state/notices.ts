import { create } from 'zustand';

import i18n from '@/i18n';

type Notice = { id: number; message: string };

type NoticesState = {
  /** Aviso que se está mostrando sobre la pantalla, si hay alguno. */
  notice: Notice | null;
  dismiss: () => void;
};

export const useNotices = create<NoticesState>()((set) => ({
  notice: null,
  dismiss: () => set({ notice: null }),
}));

let lastId = 0;

/**
 * Para el `.catch()` de las escrituras que no esperan al servidor.
 *
 * Esas escrituras se aplican en local al momento; si luego el servidor las rechaza,
 * Firestore las deshace sin más y lo que se había hecho desaparece de la pantalla.
 * Esto lo hace visible: deja el detalle en la consola y enseña un aviso.
 *
 * Estar sin conexión no cuenta como fallo: el cambio queda en cola y no llega aquí.
 */
export function saveFailed(what: string) {
  return (error: unknown) => {
    console.warn(what, error);
    useNotices.setState({ notice: { id: ++lastId, message: i18n.t('common.saveFailed') } });
  };
}
