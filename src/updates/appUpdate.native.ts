/**
 * Versión nueva de la app — versión nativa. Las actualizaciones (EAS Update) se descargan
 * al abrir la app, pero por defecto no se aplican hasta que se cierra del todo y se vuelve
 * a abrir. Aquí se avisa en cuanto hay una descargada y se puede aplicar con un toque.
 */
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/** Tiempo mínimo entre dos comprobaciones al volver a la app. */
const CHECK_EVERY_MS = 5 * 60 * 1000;

// En desarrollo y con las actualizaciones apagadas, las llamadas de expo-updates fallan.
const available = Updates.isEnabled && !__DEV__;

let lastCheck = 0;

async function downloadIfAny(): Promise<void> {
  if (!available || Date.now() - lastCheck < CHECK_EVERY_MS) return;
  lastCheck = Date.now();
  try {
    const check = await Updates.checkForUpdateAsync();
    if (check.isAvailable) await Updates.fetchUpdateAsync();
  } catch (error) {
    // Sin red o con el servidor caído no pasa nada: se vuelve a intentar más tarde.
    console.warn('No se ha podido comprobar si hay versión nueva', error);
  }
}

export type AppUpdate = {
  /** Hay una versión nueva descargada, lista para aplicarse. */
  pending: boolean;
  /** Reinicia la app con la versión nueva. */
  restart: () => void;
};

/** Mira si hay versión nueva al abrir la app y cada vez que se vuelve a ella. */
export function useAppUpdate(): AppUpdate {
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (!available) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void downloadIfAny();
    });
    return () => subscription.remove();
  }, []);

  return {
    pending: available && isUpdatePending,
    restart: () => {
      Updates.reloadAsync().catch((error) =>
        console.warn('No se ha podido reiniciar con la versión nueva', error),
      );
    },
  };
}

/**
 * Cuándo se publicó lo que está en marcha: la fecha de la actualización, o `null` si es la
 * versión que venía en el instalador (o en desarrollo). Sirve para saber qué versión se ve.
 */
export function runningUpdateDate(): Date | null {
  return available && !Updates.isEmbeddedLaunch ? Updates.createdAt : null;
}
