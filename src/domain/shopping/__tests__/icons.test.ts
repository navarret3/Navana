import { categorize, seedProducts } from '@/domain/shopping/categorize';
import { categoryIcon, productIcon } from '@/domain/shopping/icons';

const icon = (name: string) => productIcon(name, categorize(name));

describe('icono de cada producto', () => {
  it('es el del producto, no el de su categoría', () => {
    expect(icon('Arroz')).toBe('🍚');
    expect(icon('Pollo')).toBe('🍗');
    expect(icon('Huevos')).toBe('🥚');
    expect(icon('Macarrones')).toBe('🍝');
    expect(icon('Tomates')).toBe('🍅');
    expect(icon('Papel higiénico')).toBe('🧻');
  });

  it('reconoce el producto aunque lleve más palabras, se escriba en singular o sin tildes', () => {
    expect(icon('arroz basmati')).toBe('🍚');
    expect(icon('tomate')).toBe('🍅');
    expect(icon('platano')).toBe('🍌');
    expect(icon('Patatas fritas congeladas')).toBe('🍟');
  });

  it('manda lo que va delante: un zumo de naranja es un zumo', () => {
    expect(icon('Zumo de naranja')).toBe('🧃');
    expect(icon('Leche de avena')).toBe('🥛');
    expect(icon('Tortitas de arroz')).toBe('🍚');
  });

  it('distingue lo que comparte palabra', () => {
    expect(icon('Pasta')).toBe('🍝');
    expect(icon('Pasta de dientes')).toBe('🦷');
    expect(icon('Sal')).toBe('🧂');
    expect(icon('Sal de lavavajillas')).toBe('🍽️');
    expect(icon('Tomate frito')).toBe('🥫');
    expect(icon('Leche de coco')).toBe('🥥');
  });

  it('lo que no reconoce usa el icono de su categoría', () => {
    expect(productIcon('Cosa rara', 'other')).toBe(categoryIcon('other'));
    expect(productIcon('Alcachofas', 'produce')).toBe(categoryIcon('produce'));
  });

  it('casi todo el diccionario tiene icono propio', () => {
    const generic = seedProducts.filter(
      (product) => productIcon(product.name, product.categoryId) === categoryIcon(product.categoryId),
    );
    // Lo que queda con el icono de la categoría es porque no hay un emoji que le pegue,
    // o porque el suyo coincide con el de la categoría (el brócoli, la arena del gato).
    expect(generic.length).toBeLessThan(seedProducts.length * 0.3);
  });
});
