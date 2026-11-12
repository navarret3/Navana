import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import { moduleIds } from '@/modules/registry';

describe('textos en español', () => {
  it.each(moduleIds)('el módulo %s tiene todos los textos que usa la app', (id) => {
    expect(es.tabs[id]).toBeTruthy();
    expect(es[id].title).toBeTruthy();
    expect(es[id].description).toBeTruthy();
    expect(es[id].empty.title).toBeTruthy();
    expect(es[id].todayCard.title).toBeTruthy();
  });
});

/** Todas las claves de un fichero de textos, como rutas "a.b.c". */
function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** Los `{{huecos}}` de un texto, ordenados. */
function placeholders(text: string): string[] {
  return (text.match(/{{\w+}}/g) ?? []).sort();
}

function textAt(source: unknown, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], source);
  return String(value);
}

describe('textos en inglés', () => {
  it('tiene exactamente las mismas claves que el español', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(es).sort());
  });

  it('usa los mismos huecos que el español en cada texto', () => {
    const different = keysOf(es).filter(
      (key) => placeholders(textAt(es, key)).join() !== placeholders(textAt(en, key)).join(),
    );
    expect(different).toEqual([]);
  });

  it('no deja ningún texto vacío', () => {
    expect(keysOf(en).filter((key) => !textAt(en, key).trim())).toEqual([]);
  });
});
