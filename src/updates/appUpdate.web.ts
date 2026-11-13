/** Versión nueva de la app — versión web: la vista de desarrollo no recibe actualizaciones. */
import type * as Native from './appUpdate.native';

export type AppUpdate = {
  pending: boolean;
  restart: () => void;
};

export function useAppUpdate(): AppUpdate {
  return { pending: false, restart: () => undefined };
}

export function runningUpdateDate(): Date | null {
  return null;
}

// Comprobación en tiempo de compilación: este fichero exporta lo mismo que el nativo.
type Web = typeof import('./appUpdate.web');
type MissingInWeb = Exclude<keyof typeof Native, keyof Web>;
type MissingInNative = Exclude<keyof Web, keyof typeof Native>;
const sameExports: [MissingInWeb, MissingInNative] extends [never, never] ? true : never = true;
void sameExports;
