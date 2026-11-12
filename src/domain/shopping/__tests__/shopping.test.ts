import { SHOPPING_CATEGORIES } from '@/domain/shopping/categories';
import { canonicalName, categorize, seedProducts } from '@/domain/shopping/categorize';
import { displayName, normalizeName, productKey } from '@/domain/shopping/normalize';
import {
  frequentProducts,
  groupByCategory,
  recentProducts,
  learnedCategories,
  suggest,
} from '@/domain/shopping/suggest';
import type { CatalogEntry, ShoppingItem } from '@/domain/shopping/types';

const item = (name: string, overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: name,
  name,
  key: productKey(name),
  categoryId: categorize(name),
  checked: false,
  addedBy: 'ana',
  checkedBy: null,
  ...overrides,
});

const entry = (name: string, timesBought: number, overrides: Partial<CatalogEntry> = {}): CatalogEntry => ({
  key: productKey(name),
  name,
  categoryId: categorize(name),
  timesBought,
  lastBoughtAt: 1000,
  ...overrides,
});

describe('nombres de producto', () => {
  it('normaliza mayúsculas, tildes, signos y espacios, pero conserva la ñ', () => {
    expect(normalizeName('  Papel   Higiénico ')).toBe('papel higienico');
    expect(normalizeName('Champiñón')).toBe('champiñon');
    expect(normalizeName('Coca-Cola (zero)')).toBe('coca cola zero');
  });

  it.each([
    ['Tomates', 'tomate'],
    ['tomate', 'tomate'],
    ['HUEVOS', 'huevo'],
    ['Yogures', 'yogur'],
    ['yogur', 'yogur'],
    ['limones', 'limon'],
    ['Nueces', 'nuez'],
    ['Pimientos rojos', 'pimiento rojo'],
    ['Papel higiénico', 'papel higienico'],
    ['pan', 'pan'],
    ['Sal', 'sal'],
    ['Arroz', 'arroz'],
    ['Macarrones', 'macarron'],
    ['macarrón', 'macarron'],
    ['Legumbres cocidas', 'legumbre cocida'],
    ['legumbre cocida', 'legumbre cocida'],
    ['Dulces', 'dulce'],
    ['Nuggets', 'nugget'],
    ['croissants', 'croissant'],
    ['Chicles', 'chicle'],
    ['calamares', 'calamar'],
  ])('la clave de %s es %s', (name, key) => {
    expect(productKey(name)).toBe(key);
  });

  it('prepara el nombre para mostrarlo', () => {
    expect(displayName('  leche   de avena ')).toBe('Leche de avena');
    expect(displayName('x'.repeat(100))).toHaveLength(60);
  });
});

describe('diccionario inicial', () => {
  it('tiene unos 300 productos, todos con categoría válida y sin claves repetidas', () => {
    expect(seedProducts.length).toBeGreaterThanOrEqual(300);
    const categories = new Set<string>(SHOPPING_CATEGORIES.map((category) => category.id));
    expect(seedProducts.every((product) => categories.has(product.categoryId))).toBe(true);

    const keys = seedProducts.map((product) => product.key);
    const repeated = keys.filter((key, index) => keys.indexOf(key) !== index);
    expect(repeated).toEqual([]);
  });
});

describe('nombres en plural', () => {
  it.each([
    ['macarron', 'Macarrones'],
    ['Macarrón', 'Macarrones'],
    ['patata', 'Patatas'],
    ['PATATAS', 'Patatas'],
    ['huevo', 'Huevos'],
    ['tomate', 'Tomates'],
    ['yogur', 'Yogures'],
    ['galleta', 'Galletas'],
  ])('%s se muestra como %s', (typed, shown) => {
    expect(canonicalName(typed)).toBe(shown);
  });

  it.each(['Leche', 'Pan', 'Arroz', 'Lechuga', 'Papel higiénico', 'Aceite de oliva', 'Pollo'])(
    '%s se queda en singular',
    (name) => {
      expect(canonicalName(name.toLowerCase())).toBe(name);
    },
  );

  it('lo que no está en el diccionario se deja como se ha escrito', () => {
    expect(canonicalName('  tofu   ahumado ')).toBe('Tofu ahumado');
    expect(canonicalName('Destornillador')).toBe('Destornillador');
  });
});

describe('categoría automática', () => {
  it.each([
    ['Tomates', 'produce'],
    ['leche', 'dairy'],
    ['Huevos', 'dairy'],
    ['pan', 'bakery'],
    ['Pechuga de pollo', 'meatFish'],
    ['arroz', 'pantry'],
    ['Cerveza', 'drinks'],
    ['papel higiénico', 'hygiene'],
    ['Lavavajillas', 'cleaning'],
    ['arena de gato', 'pets'],
    ['Helado', 'frozen'],
    ['galletas', 'snacks'],
  ])('%s va a %s', (name, category) => {
    expect(categorize(name)).toBe(category);
  });

  it('si no conoce el nombre completo, prueba con el principio', () => {
    expect(categorize('Leche de avena sin azúcar')).toBe('dairy');
    expect(categorize('Queso curado de oveja')).toBe('dairy');
  });

  it('lo desconocido va a "Otros"', () => {
    expect(categorize('Destornillador')).toBe('other');
    expect(categorize('')).toBe('other');
  });

  it('lo aprendido en el hogar manda sobre el diccionario', () => {
    const learned = learnedCategories([
      entry('Tomate', 0, { categoryId: 'pantry' }),
      entry('Destornillador', 0, { categoryId: 'cleaning' }),
    ]);
    expect(categorize('tomates', learned)).toBe('pantry');
    expect(categorize('Destornillador', learned)).toBe('cleaning');
    expect(categorize('leche', learned)).toBe('dairy');
  });
});

describe('autocompletar', () => {
  it('no propone nada sin texto', () => {
    expect(suggest('  ', { catalog: [], items: [] })).toEqual([]);
  });

  it('busca en el diccionario por el principio del nombre o de una palabra', () => {
    const names = suggest('tom', { catalog: [], items: [] }).map((s) => s.name);
    expect(names[0]).toBe('Tomates');
    expect(names).toContain('Tomates cherry');
    expect(suggest('higi', { catalog: [], items: [] }).map((s) => s.name)).toContain(
      'Papel higiénico',
    );
  });

  it('pone primero lo que el hogar ya ha comprado, y antes lo más comprado', () => {
    const catalog = [entry('Tofu ahumado', 2), entry('Tortitas', 9)];
    const names = suggest('to', { catalog, items: [] }).map((s) => s.name);
    expect(names.slice(0, 2)).toEqual(['Tortitas', 'Tofu ahumado']);
    expect(names).toContain('Tomates');
  });

  it('no repite un producto que está en el diccionario y en el catálogo', () => {
    const names = suggest('tomate', { catalog: [entry('Tomates', 3)], items: [] }).map(
      (s) => s.name,
    );
    expect(names.filter((name) => name === 'Tomates')).toHaveLength(1);
  });

  it('no propone lo que ya está pendiente, pero sí lo que está tachado', () => {
    const pending = suggest('lech', { catalog: [], items: [item('Leche')] }).map((s) => s.key);
    expect(pending).not.toContain('leche');
    const checked = suggest('lech', { catalog: [], items: [item('Leche', { checked: true })] });
    expect(checked.map((s) => s.key)).toContain('leche');
  });

  it('respeta el límite', () => {
    expect(suggest('a', { catalog: [], items: [], limit: 3 })).toHaveLength(3);
  });
});

describe('frecuentes', () => {
  it('ordena por veces compradas y deja fuera lo que ya está en la lista o nunca se ha comprado', () => {
    const catalog = [
      entry('Leche', 10),
      entry('Pan', 4),
      entry('Huevos', 7),
      entry('Tomate', 0),
    ];
    expect(frequentProducts(catalog, [item('Huevos')]).map((e) => e.name)).toEqual(['Leche', 'Pan']);
  });

  it('a igualdad, primero lo comprado más recientemente', () => {
    const catalog = [
      entry('Pan', 2, { lastBoughtAt: 100 }),
      entry('Leche', 2, { lastBoughtAt: 900 }),
    ];
    expect(frequentProducts(catalog, []).map((e) => e.name)).toEqual(['Leche', 'Pan']);
  });
});

describe('comprado hace poco', () => {
  it('da lo último comprado, sin repetir lo pendiente ni los frecuentes ya mostrados', () => {
    const catalog = [
      entry('Leche', 10, { lastBoughtAt: 500 }),
      entry('Pan', 1, { lastBoughtAt: 900 }),
      entry('Huevos', 1, { lastBoughtAt: 800 }),
      entry('Arroz', 1, { lastBoughtAt: 700 }),
      entry('Destornillador', 0, { lastBoughtAt: null }),
    ];
    const frequent = frequentProducts(catalog, [], 1);
    expect(frequent.map((e) => e.name)).toEqual(['Leche']);
    expect(recentProducts(catalog, [item('Huevos')], frequent).map((e) => e.name)).toEqual([
      'Pan',
      'Arroz',
    ]);
  });
});

describe('lista agrupada', () => {
  it('sigue el orden del súper y es alfabética dentro de cada categoría', () => {
    const groups = groupByCategory([
      item('Leche'),
      item('Tomates'),
      item('Destornillador'),
      item('Ajo'),
      item('Pan'),
    ]);
    expect(groups.map((group) => group.categoryId)).toEqual(['produce', 'bakery', 'dairy', 'other']);
    expect(groups[0]?.items.map((i) => i.name)).toEqual(['Ajo', 'Tomates']);
  });
});
