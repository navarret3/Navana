import { OTHER_CATEGORY, isCategoryId, type CategoryId } from './categories';
import { displayName, productKey } from './normalize';
import seedCatalog from './seedCatalog.es.json';

export type SeedProduct = { key: string; name: string; categoryId: CategoryId };

/** Diccionario inicial de productos habituales, con su categoría. */
export const seedProducts: readonly SeedProduct[] = Object.entries(seedCatalog).flatMap(
  ([categoryId, names]) =>
    isCategoryId(categoryId)
      ? names.map((name) => ({ key: productKey(name), name: displayName(name), categoryId }))
      : [],
);

const seedByKey = new Map(seedProducts.map((product) => [product.key, product.categoryId]));
const seedNameByKey = new Map(seedProducts.map((product) => [product.key, product.name]));

/**
 * Nombre con el que se guarda y se muestra un producto. Si está en el diccionario se usa
 * el nombre de allí, que va en plural donde es lo natural: quien escribe "macarron" o
 * "patata" ve "Macarrones" y "Patatas". Lo que no está en el diccionario se deja como
 * se ha escrito.
 */
export function canonicalName(name: string): string {
  return seedNameByKey.get(productKey(name)) ?? displayName(name);
}

/**
 * Categoría de un producto. Por orden: lo aprendido en el hogar (incluidas las
 * correcciones a mano), el diccionario y, si no, "Otros".
 *
 * Si el nombre completo no se conoce, se prueba quitando palabras del final:
 * "leche de avena sin azúcar" acaba encontrando "leche".
 */
export function categorize(
  name: string,
  learned: ReadonlyMap<string, CategoryId> = new Map(),
): CategoryId {
  const words = productKey(name).split(' ').filter(Boolean);
  for (let length = words.length; length > 0; length--) {
    const key = words.slice(0, length).join(' ');
    const category = learned.get(key) ?? seedByKey.get(key);
    if (category) return category;
  }
  return OTHER_CATEGORY;
}
