import { categoryOrder, type CategoryId } from './categories';
import { seedProducts } from './categorize';
import { normalizeName } from './normalize';
import type { CatalogEntry, ShoppingItem } from './types';

export type Suggestion = { key: string; name: string; categoryId: CategoryId };

/** ¿Empieza el nombre, o alguna de sus palabras, por lo escrito? */
function matches(name: string, query: string): 'start' | 'word' | null {
  const normalized = normalizeName(name);
  if (normalized.startsWith(query)) return 'start';
  return normalized.split(' ').some((word) => word.startsWith(query)) ? 'word' : null;
}

/** Claves de lo que ya está pendiente en la lista: no tiene sentido volver a proponerlo. */
export function pendingKeys(items: readonly ShoppingItem[]): Set<string> {
  return new Set(items.filter((item) => !item.checked).map((item) => item.key));
}

/**
 * Autocompletar: primero lo que el hogar ya ha comprado (lo más comprado antes) y
 * después el diccionario. Dentro de cada grupo, antes lo que empieza por lo escrito.
 */
export function suggest(
  query: string,
  context: { catalog: readonly CatalogEntry[]; items: readonly ShoppingItem[]; limit?: number },
): Suggestion[] {
  const q = normalizeName(query);
  if (!q) return [];
  const onList = pendingKeys(context.items);
  const seen = new Set<string>();
  const found: (Suggestion & { rank: number })[] = [];

  const consider = (candidate: Suggestion, base: number, weight: number) => {
    if (seen.has(candidate.key) || onList.has(candidate.key)) return;
    const match = matches(candidate.name, q);
    if (!match) return;
    seen.add(candidate.key);
    found.push({ ...candidate, rank: base + (match === 'start' ? 0 : 1000) - weight });
  };

  for (const entry of context.catalog) consider(entry, 0, Math.min(entry.timesBought, 999));
  for (const product of seedProducts) consider(product, 10000, 0);

  return found
    .sort((a, b) => a.rank - b.rank || a.name.length - b.name.length || a.name.localeCompare(b.name))
    .slice(0, context.limit ?? 6)
    .map(({ rank: _rank, ...suggestion }) => suggestion);
}

/** Lo que más se compra en casa y no está ya en la lista. */
export function frequentProducts(
  catalog: readonly CatalogEntry[],
  items: readonly ShoppingItem[],
  limit = 8,
): CatalogEntry[] {
  const onList = pendingKeys(items);
  return catalog
    .filter((entry) => entry.timesBought > 0 && !onList.has(entry.key))
    .sort(
      (a, b) =>
        b.timesBought - a.timesBought ||
        (b.lastBoughtAt ?? 0) - (a.lastBoughtAt ?? 0) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

/** Lo último que se compró y no está ya en la lista ni entre los frecuentes que se enseñan. */
export function recentProducts(
  catalog: readonly CatalogEntry[],
  items: readonly ShoppingItem[],
  shown: readonly CatalogEntry[] = [],
  limit = 6,
): CatalogEntry[] {
  const skip = pendingKeys(items);
  for (const entry of shown) skip.add(entry.key);
  return catalog
    .filter((entry) => entry.lastBoughtAt !== null && !skip.has(entry.key))
    .sort((a, b) => (b.lastBoughtAt ?? 0) - (a.lastBoughtAt ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Lista pendiente agrupada por categoría, en el orden del súper y alfabética dentro. */
export function groupByCategory(
  items: readonly ShoppingItem[],
): { categoryId: CategoryId; items: ShoppingItem[] }[] {
  const groups = new Map<CategoryId, ShoppingItem[]>();
  for (const item of items) {
    const group = groups.get(item.categoryId) ?? [];
    group.push(item);
    groups.set(item.categoryId, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => categoryOrder(a) - categoryOrder(b))
    .map(([categoryId, group]) => ({
      categoryId,
      items: group.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

/** Categorías aprendidas en el hogar, para `categorize`. */
export function learnedCategories(catalog: readonly CatalogEntry[]): Map<string, CategoryId> {
  return new Map(catalog.map((entry) => [entry.key, entry.categoryId]));
}
