import { normalizeName } from '@/domain/shopping/normalize';

import type { TemplateZoneKey } from './template';
import type { Effort } from './types';

/**
 * Tareas de casa habituales, para proponerlas mientras se escribe el título de una tarea
 * nueva: al elegir una se rellenan el icono, la zona, el esfuerzo y la frecuencia.
 * Como el diccionario de productos de la compra, está solo en español.
 */
export type Chore = {
  title: string;
  icon: string;
  zone: TemplateZoneKey | null;
  effort: Effort;
  /** Cada cuántos días se repite. `null` = "cuando surja": no tiene fecha. */
  intervalDays: number | null;
};

const chore = (
  title: string,
  icon: string,
  zone: TemplateZoneKey | null,
  effort: Effort,
  intervalDays: number | null,
): Chore => ({ title, icon, zone, effort, intervalDays });

export const CHORES: readonly Chore[] = [
  // Con frecuencia fija, de lo más habitual a lo menos.
  chore('Limpiar la cocina', '🧽', 'kitchen', 2, 7),
  chore('Limpiar el baño', '🚿', 'bathroom', 3, 7),
  chore('Aspirar', '🧹', 'wholeHouse', 2, 4),
  chore('Fregar el suelo', '🪣', 'wholeHouse', 2, 7),
  chore('Sacar la basura', '🗑️', 'kitchen', 1, 2),
  chore('Cambiar las sábanas', '🛏️', 'bedroom', 2, 14),
  chore('Limpiar el arenero', '🐈', 'cats', 1, 1),
  chore('Quitar el polvo', '✨', 'wholeHouse', 2, 7),
  chore('Regar las plantas', '🪴', 'livingRoom', 1, 3),
  chore('Hacer la compra', '🛒', null, 2, 7),
  chore('Cambiar las toallas', '🚿', 'bathroom', 1, 7),
  chore('Limpiar la vitrocerámica', '🍳', 'kitchen', 1, 3),
  chore('Limpiar el salón', '🛋️', 'livingRoom', 2, 7),
  chore('Ordenar el dormitorio', '🛏️', 'bedroom', 1, 7),
  chore('Planchar', '🧺', 'wholeHouse', 2, 7),
  chore('Sacar el reciclaje', '🗑️', 'kitchen', 1, 7),
  chore('Cambiar la arena', '🐈', 'cats', 2, 7),
  chore('Limpiar los comederos', '🐈', 'cats', 1, 3),
  chore('Cepillar a los gatos', '🐈', 'cats', 1, 3),
  chore('Limpiar el microondas', '🍳', 'kitchen', 1, 14),
  chore('Limpiar la nevera', '🍳', 'kitchen', 2, 30),
  chore('Limpiar los cristales', '✨', 'wholeHouse', 3, 30),
  chore('Limpiar la terraza', '🪴', 'wholeHouse', 2, 30),
  chore('Limpiar el horno', '🍳', 'kitchen', 3, 60),
  chore('Limpiar la campana', '🍳', 'kitchen', 2, 60),
  chore('Limpiar el filtro de la lavadora', '🧺', 'wholeHouse', 1, 60),
  chore('Lavar el coche', '🚗', null, 2, 30),
  chore('Revisar las facturas', '🧾', null, 1, 30),
  chore('Dar la vuelta al colchón', '🛏️', 'bedroom', 2, 90),

  // Cuando surgen.
  chore('Barrer', '🧹', 'wholeHouse', 1, null),
  chore('Fregar los platos', '🍽️', 'kitchen', 1, null),
  chore('Poner el lavavajillas', '🍽️', 'kitchen', 1, null),
  chore('Recoger el lavavajillas', '🍽️', 'kitchen', 1, null),
  chore('Poner la lavadora', '🧺', 'wholeHouse', 1, null),
  chore('Tender la ropa', '🧺', 'wholeHouse', 1, null),
  chore('Recoger la ropa', '🧺', 'wholeHouse', 1, null),
  chore('Doblar la ropa', '🧺', 'wholeHouse', 1, null),
  chore('Hacer la cama', '🛏️', 'bedroom', 1, null),
  chore('Cocinar', '🍳', 'kitchen', 2, null),
  chore('Poner la mesa', '🍽️', 'kitchen', 1, null),
  chore('Recoger la mesa', '🍽️', 'kitchen', 1, null),
  chore('Dar de comer a los gatos', '🐈', 'cats', 1, null),
  chore('Ordenar el salón', '🛋️', 'livingRoom', 1, null),
];

/** Frecuencias que se ofrecen con un toque, en días. Lo demás se escribe a mano. */
export const INTERVAL_PRESETS = [1, 2, 3, 7, 14, 30] as const;

/** Palabras que no sirven para buscar: "la" no debe proponer "Limpiar la cocina". */
const MIN_WORD = 3;

/**
 * Tareas habituales que encajan con lo escrito y que aún no existen en el hogar. Primero
 * las que empiezan por el texto y después las que tienen una palabra que empieza por él.
 * Sin texto devuelve las más habituales, como ideas. Con `recurringOnly` deja fuera las
 * que se hacen "cuando surge": es lo que se propone al crear una tarea recurrente.
 */
export function suggestChores(
  text: string,
  existingTitles: readonly string[] = [],
  limit = 5,
  recurringOnly = false,
): Chore[] {
  const query = normalizeName(text);
  const existing = new Set(existingTitles.map(normalizeName));
  const available = CHORES.filter(
    (entry) =>
      !existing.has(normalizeName(entry.title)) && (!recurringOnly || entry.intervalDays !== null),
  );
  if (!query) return available.slice(0, limit);

  const starts: Chore[] = [];
  const contains: Chore[] = [];
  for (const entry of available) {
    const title = normalizeName(entry.title);
    if (title.startsWith(query)) starts.push(entry);
    else if (
      query.length >= MIN_WORD &&
      title.split(' ').some((word) => word.length >= MIN_WORD && word.startsWith(query))
    ) {
      contains.push(entry);
    }
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Icono según las palabras del título. El orden importa: "fregar los platos" son platos. */
const ICON_KEYWORDS: readonly (readonly [icon: string, stems: readonly string[]])[] = [
  ['🗑️', ['basura', 'reciclaje', 'contenedor']],
  ['🐈', ['gato', 'arenero', 'arena', 'pienso', 'comedero', 'veterinario']],
  ['🪴', ['planta', 'regar', 'terraza', 'jardin', 'balcon']],
  ['🛏️', ['sabana', 'cama', 'colchon', 'dormitorio']],
  ['🚿', ['baño', 'ducha', 'toalla', 'lavabo', 'vater', 'inodoro']],
  ['🧺', ['lavadora', 'tender', 'ropa', 'planch', 'colada', 'secadora']],
  ['🍽️', ['plato', 'lavavajillas', 'mesa', 'vajilla']],
  ['🍳', ['cocin', 'horno', 'vitro', 'nevera', 'microondas', 'campana', 'cena', 'comida']],
  ['🪣', ['fregar', 'suelo', 'fregona']],
  ['🧹', ['aspir', 'barrer', 'escoba']],
  ['🛒', ['compra', 'super', 'mercado']],
  ['🧾', ['factura', 'recibo', 'papeleo', 'banco', 'pagar', 'seguro', 'alquiler']],
  ['🚗', ['coche', 'itv', 'gasolina', 'moto']],
  ['🔧', ['arregl', 'repar', 'bombilla', 'montar', 'colgar']],
  ['✨', ['polvo', 'cristal', 'ventana', 'espejo', 'limpi', 'orden']],
];

/**
 * Icono que le pega a un título, o `null` si no se reconoce nada. Si el título es una de
 * las tareas habituales, el suyo.
 */
export function iconForTitle(title: string): string | null {
  const text = normalizeName(title);
  if (!text) return null;
  const known = CHORES.find((entry) => normalizeName(entry.title) === text);
  if (known) return known.icon;
  const words = text.split(' ');
  for (const [icon, stems] of ICON_KEYWORDS) {
    if (stems.some((stem) => words.some((word) => word.startsWith(stem)))) return icon;
  }
  return null;
}
