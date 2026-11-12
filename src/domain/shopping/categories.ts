/**
 * Categorías de la lista de la compra, en el orden en que se suele recorrer un súper.
 * Son fijas (el plan descarta personalizarlas); los nombres están en i18n.
 */
export const SHOPPING_CATEGORIES = [
  { id: 'produce', icon: '🥦' },
  { id: 'bakery', icon: '🥖' },
  { id: 'meatFish', icon: '🥩' },
  { id: 'dairy', icon: '🥛' },
  { id: 'pantry', icon: '🥫' },
  { id: 'snacks', icon: '🍪' },
  { id: 'drinks', icon: '🧃' },
  { id: 'frozen', icon: '🧊' },
  { id: 'cleaning', icon: '🧴' },
  { id: 'hygiene', icon: '🧼' },
  { id: 'pets', icon: '🐈' },
  { id: 'other', icon: '🛒' },
] as const;

export type CategoryId = (typeof SHOPPING_CATEGORIES)[number]['id'];

export const OTHER_CATEGORY: CategoryId = 'other';

const categoryIds = new Set<string>(SHOPPING_CATEGORIES.map((category) => category.id));

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && categoryIds.has(value);
}

/** Posición de la categoría en el recorrido del súper. */
export function categoryOrder(id: CategoryId): number {
  return SHOPPING_CATEGORIES.findIndex((category) => category.id === id);
}
