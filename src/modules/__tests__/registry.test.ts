import { getEnabledModules, isModuleEnabled, moduleIds, modules } from '@/modules/registry';

describe('registro de módulos', () => {
  it('tiene una entrada por cada id, sin repetir', () => {
    expect(modules.map((module) => module.id).sort()).toEqual([...moduleIds].sort());
  });

  it('muestra los módulos por defecto cuando el hogar no ha guardado nada', () => {
    expect(getEnabledModules({}).map((module) => module.id)).toEqual(['tasks', 'shopping', 'agenda']);
  });

  it('oculta los módulos desactivados y conserva el orden del registro', () => {
    const visible = getEnabledModules({ shopping: false, agenda: true });
    expect(visible.map((module) => module.id)).toEqual(['tasks', 'agenda']);
  });

  it('el valor guardado en el hogar manda sobre el valor por defecto', () => {
    const tasks = modules.find((module) => module.id === 'tasks')!;
    expect(isModuleEnabled(tasks, {})).toBe(true);
    expect(isModuleEnabled(tasks, { tasks: false })).toBe(false);
  });

  it('puede quedarse sin ningún módulo', () => {
    expect(getEnabledModules({ tasks: false, shopping: false, agenda: false })).toEqual([]);
  });
});
