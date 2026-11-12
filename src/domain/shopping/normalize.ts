/** Longitud máxima del nombre de un producto. */
export const ITEM_NAME_MAX = 60;

const ACCENTS: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };

/**
 * Texto para comparar: minúsculas, sin tildes (la ñ se conserva) y sin signos.
 * "  Papel  Higiénico " → "papel higienico".
 */
export function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[áéíóúü]/g, (letter) => ACCENTS[letter] ?? letter)
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

/**
 * Singular aproximado de una palabra ya normalizada. No es gramática: basta con que
 * "tomates" y "tomate" (o "macarrones" y "macarron") acaben siendo lo mismo.
 */
function singular(word: string): string {
  if (word.length <= 3) return word;
  if (/[aeiou]ces$/.test(word)) return `${word.slice(0, -3)}z`; // nueces → nuez
  // Vocal + consonante + "es": el singular acaba en consonante (yogures → yogur).
  // Si antes de la consonante hay otra, acaba en "e" (legumbres → legumbre) y sigue abajo.
  if (/[aeiou][rlndj]es$/.test(word)) return word.slice(0, -2);
  if (/[aeiou]s$/.test(word)) return word.slice(0, -1); // tomates → tomate
  if (word.length > 4 && /[^aeious]s$/.test(word)) return word.slice(0, -1); // nuggets → nugget
  return word;
}

/**
 * Clave de un producto: identifica "Tomates", "tomate" y "TOMATE " como lo mismo.
 * Se usa para no duplicar en la lista y como id en el catálogo del hogar.
 */
export function productKey(name: string): string {
  return normalizeName(name).split(' ').filter(Boolean).map(singular).join(' ').slice(0, 80);
}

/** Nombre tal como se guarda y se muestra: sin espacios de más y con mayúscula inicial. */
export function displayName(input: string): string {
  const clean = input.replace(/\s+/g, ' ').trim().slice(0, ITEM_NAME_MAX);
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
