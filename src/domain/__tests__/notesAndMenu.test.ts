import { ingredientsToBuy, parseIngredients, weekDays, type DayMenu } from '@/domain/menu';
import { isEmptyNote, noteHeading, sortNotes, type Note } from '@/domain/notes';

const note = (id: string, overrides: Partial<Note> = {}): Note => ({
  id,
  title: id,
  body: '',
  pinned: false,
  updatedAt: 0,
  updatedBy: 'ana',
  ...overrides,
});

describe('notas', () => {
  it('pone primero las fijadas y luego lo editado más recientemente', () => {
    const sorted = sortNotes([
      note('vieja', { updatedAt: 100 }),
      note('fijada', { pinned: true, updatedAt: 50 }),
      note('nueva', { updatedAt: 300 }),
      note('fijada-nueva', { pinned: true, updatedAt: 200 }),
    ]);
    expect(sorted.map((n) => n.id)).toEqual(['fijada-nueva', 'fijada', 'nueva', 'vieja']);
  });

  it('una nota sin título se nombra por su primera línea', () => {
    expect(noteHeading({ title: 'Wifi', body: 'clave' })).toBe('Wifi');
    expect(noteHeading({ title: '  ', body: 'Clave del wifi\n1234' })).toBe('Clave del wifi');
    expect(noteHeading({ title: '', body: '' })).toBe('');
  });

  it('detecta las notas vacías', () => {
    expect(isEmptyNote({ title: ' ', body: '\n' })).toBe(true);
    expect(isEmptyNote({ title: '', body: 'algo' })).toBe(false);
  });
});

describe('menú semanal', () => {
  it('la semana va de lunes a domingo', () => {
    expect(weekDays('2026-11-12')).toEqual([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    ]);
  });

  it('separa ingredientes por comas, punto y coma o líneas, sin repetidos ni vacíos', () => {
    expect(parseIngredients('tomates, cebolla;  ajo\nTomate\n\n , huevos')).toEqual([
      'Tomates',
      'Cebolla',
      'Ajo',
      'Huevos',
    ]);
    expect(parseIngredients('   ')).toEqual([]);
  });

  it('limita el número de ingredientes', () => {
    const many = Array.from({ length: 50 }, (_, index) => `cosa${index}x`).join(',');
    expect(parseIngredients(many)).toHaveLength(30);
  });

  const menu: DayMenu[] = [
    {
      date: '2026-11-12',
      lunch: { title: 'Lentejas', ingredients: ['Lentejas', 'Zanahorias', 'Chorizo'] },
      dinner: { title: 'Tortilla', ingredients: ['Huevos', 'Patatas'] },
    },
    {
      date: '2026-11-13',
      lunch: { title: 'Ensalada', ingredients: ['Tomates', 'huevo'] },
      dinner: null,
    },
    { date: '2026-11-20', lunch: { title: 'Pasta', ingredients: ['Macarrones'] }, dinner: null },
  ];

  it('junta los ingredientes de los días pedidos, sin repetir', () => {
    expect(ingredientsToBuy(menu, ['2026-11-12', '2026-11-13'], new Set())).toEqual([
      'Lentejas',
      'Zanahorias',
      'Chorizo',
      'Huevos',
      'Patatas',
      'Tomates',
    ]);
  });

  it('deja fuera lo que ya está pendiente en la lista y los días no pedidos', () => {
    const pending = new Set(['huevo', 'lenteja']);
    expect(ingredientsToBuy(menu, ['2026-11-12'], pending)).toEqual([
      'Zanahorias',
      'Chorizo',
      'Patatas',
    ]);
    expect(ingredientsToBuy(menu, ['2026-11-14'], new Set())).toEqual([]);
  });
});
