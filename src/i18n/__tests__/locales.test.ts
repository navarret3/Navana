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
