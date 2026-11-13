import {
  cleanLogTitle,
  draftForLoggedTask,
  findTaskByTitle,
  tasksToLog,
} from '@/domain/tasks/log';
import type { Task } from '@/domain/tasks/types';

const TODAY = '2026-11-13';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Fregar platos',
    icon: '🍽️',
    zoneId: null,
    effort: 1,
    mode: 'free',
    assigneeId: null,
    rotationOrder: [],
    intervalDays: null,
    onDemand: true,
    nextDueOn: TODAY,
    lastCompletedOn: null,
    lastCompletedBy: null,
    lastCompletionId: null,
    archived: false,
    ...overrides,
  };
}

const dishes = task({ id: 'dishes', title: 'Fregar platos', lastCompletedOn: '2026-11-12' });
const sweep = task({ id: 'sweep', title: 'Barrer la casa', lastCompletedOn: '2026-11-10' });
const litter = task({
  id: 'litter',
  title: 'Limpiar arenero gatos',
  onDemand: false,
  intervalDays: 1,
  mode: 'rotation',
});
const gone = task({ id: 'gone', title: 'Fregar la terraza', archived: true });
const all = [sweep, gone, litter, dishes];
const titles = (tasks: readonly Task[]) => tasks.map((entry) => entry.title);

describe('realizar tarea', () => {
  it('ofrece todas las tareas activas, con fecha o sin ella, lo hecho hace menos primero', () => {
    expect(titles(tasksToLog(all))).toEqual([
      'Fregar platos',
      'Barrer la casa',
      'Limpiar arenero gatos',
    ]);
  });

  it('filtra por lo escrito, sin importar mayúsculas ni tildes', () => {
    expect(titles(tasksToLog(all, 'FREG'))).toEqual(['Fregar platos']);
    expect(titles(tasksToLog(all, 'casa'))).toEqual(['Barrer la casa']);
    expect(titles(tasksToLog(all, 'planchar'))).toEqual([]);
  });

  it('reconoce una tarea que ya existe por su nombre', () => {
    expect(findTaskByTitle(all, '  fregar   PLATOS ')?.id).toBe('dishes');
    expect(findTaskByTitle(all, 'Fregar')).toBeUndefined();
    expect(findTaskByTitle(all, 'Fregar la terraza')).toBeUndefined();
    expect(findTaskByTitle(all, '')).toBeUndefined();
  });

  it('una tarea nueva solo necesita el título', () => {
    expect(cleanLogTitle('  sacar   la basura ')).toBe('Sacar la basura');
    expect(draftForLoggedTask(' sacar la basura', TODAY)).toEqual({
      title: 'Sacar la basura',
      icon: '🗑️',
      zoneId: null,
      effort: 1,
      mode: 'free',
      assigneeId: null,
      intervalDays: null,
      onDemand: true,
      nextDueOn: TODAY,
    });
    // Sin nada reconocible en el título, un icono neutro.
    expect(draftForLoggedTask('Llamar a mamá', TODAY).icon).toBe('✨');
  });
});
