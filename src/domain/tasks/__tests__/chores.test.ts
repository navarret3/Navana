import { CHORES, INTERVAL_PRESETS, iconForTitle, suggestChores } from '@/domain/tasks/chores';
import { TEMPLATE_ZONES } from '@/domain/tasks/template';

const titles = (text: string, existing: string[] = []) =>
  suggestChores(text, existing).map((chore) => chore.title);

describe('tareas habituales', () => {
  it('no repite títulos y usa zonas que existen', () => {
    expect(new Set(CHORES.map((chore) => chore.title)).size).toBe(CHORES.length);
    const zones = new Set<string>(TEMPLATE_ZONES.map((zone) => zone.key));
    for (const chore of CHORES) {
      if (chore.zone !== null) expect(zones.has(chore.zone)).toBe(true);
      if (chore.intervalDays !== null) expect(chore.intervalDays).toBeGreaterThan(0);
    }
  });

  it('propone lo que empieza por lo escrito, sin importar tildes ni mayúsculas', () => {
    expect(titles('asp')).toEqual(['Aspirar']);
    expect(titles('LIMPIAR EL BA')).toEqual(['Limpiar el baño']);
    expect(titles('sac')).toEqual(['Sacar la basura', 'Sacar el reciclaje']);
  });

  it('también busca por una palabra de dentro, después de lo que empieza igual', () => {
    expect(titles('basura')).toEqual(['Sacar la basura']);
    expect(titles('plan')).toEqual(['Planchar', 'Regar las plantas']);
    // "la" no es una palabra por la que buscar.
    expect(titles('la')).toEqual(['Lavar el coche']);
  });

  it('no propone lo que ya existe en el hogar', () => {
    expect(titles('asp', ['aspirar'])).toEqual([]);
    expect(titles('sac', ['Sacar la basura'])).toEqual(['Sacar el reciclaje']);
  });

  it('sin texto da ideas: las más habituales que aún no existen', () => {
    expect(titles('')).toHaveLength(5);
    expect(titles('')[0]).toBe('Limpiar la cocina');
    expect(titles('', ['Limpiar la cocina'])[0]).toBe('Limpiar el baño');
  });

  it('al crear una tarea recurrente no propone las que se hacen cuando surgen', () => {
    expect(titles('barr')).toEqual(['Barrer']);
    expect(suggestChores('barr', [], 5, true)).toEqual([]);
    expect(suggestChores('', [], 50, true).every((chore) => chore.intervalDays !== null)).toBe(true);
  });

  it('las frecuencias de un toque incluyen las de las tareas más habituales', () => {
    expect(INTERVAL_PRESETS).toEqual([1, 2, 3, 7, 14, 30]);
  });
});

describe('icono según el título', () => {
  it('usa el de la tarea habitual si el título coincide', () => {
    expect(iconForTitle('limpiar la cocina')).toBe('🧽');
    expect(iconForTitle('Aspirar')).toBe('🧹');
  });

  it('si no, lo deduce de las palabras', () => {
    expect(iconForTitle('Bajar la basura')).toBe('🗑️');
    expect(iconForTitle('Regar el jardín')).toBe('🪴');
    expect(iconForTitle('Fregar los platos de la cena')).toBe('🍽️');
    expect(iconForTitle('Fregar la entrada')).toBe('🪣');
    expect(iconForTitle('Llevar al gato al veterinario')).toBe('🐈');
    expect(iconForTitle('Pagar el alquiler')).toBe('🧾');
  });

  it('no inventa nada si no reconoce el título', () => {
    expect(iconForTitle('')).toBeNull();
    expect(iconForTitle('Llamar a mamá')).toBeNull();
  });
});
