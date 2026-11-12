import { computeBalance, periodRange } from '@/domain/tasks/balance';
import { canUndo, planCompletion, planPostpone } from '@/domain/tasks/completion';
import { dueStatus, isDue, nextDueAfterCompletion } from '@/domain/tasks/recurrence';
import { assigneeAfterCompletion, currentAssignee } from '@/domain/tasks/rotation';
import { TEMPLATE_ON_DEMAND, TEMPLATE_TASKS, zonesForTemplate } from '@/domain/tasks/template';
import { groupForToday, onDemandTasks, scheduledTasks } from '@/domain/tasks/today';
import type { Completion, Task } from '@/domain/tasks/types';

const ANA = 'ana';
const BRUNO = 'bruno';
const MEMBERS = [ANA, BRUNO];
const TODAY = '2026-11-12';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Aspirar',
    icon: '🧹',
    zoneId: 'z1',
    effort: 2,
    mode: 'rotation',
    assigneeId: ANA,
    rotationOrder: [],
    intervalDays: 4,
    onDemand: false,
    nextDueOn: TODAY,
    lastCompletedOn: null,
    lastCompletedBy: null,
    lastCompletionId: null,
    archived: false,
    ...overrides,
  };
}

describe('recurrencia', () => {
  it('describe cuándo toca una tarea', () => {
    expect(dueStatus('2026-11-10', TODAY)).toEqual({ kind: 'overdue', days: 2 });
    expect(dueStatus(TODAY, TODAY)).toEqual({ kind: 'today' });
    expect(dueStatus('2026-11-15', TODAY)).toEqual({ kind: 'upcoming', days: 3 });
  });

  it('considera pendiente lo de hoy y lo atrasado', () => {
    expect(isDue('2026-11-11', TODAY)).toBe(true);
    expect(isDue(TODAY, TODAY)).toBe(true);
    expect(isDue('2026-11-13', TODAY)).toBe(false);
  });

  it('la siguiente fecha cuenta desde el día en que se hizo', () => {
    expect(nextDueAfterCompletion(4, TODAY)).toBe('2026-11-16');
    expect(nextDueAfterCompletion(1, '2026-12-31')).toBe('2027-01-01');
  });

  it('las tareas puntuales no vuelven', () => {
    expect(nextDueAfterCompletion(null, TODAY)).toBeNull();
  });
});

describe('a quién le toca', () => {
  it('fija: siempre la misma persona', () => {
    const fixed = task({ mode: 'fixed', assigneeId: BRUNO });
    expect(currentAssignee(fixed, MEMBERS)).toBe(BRUNO);
    expect(assigneeAfterCompletion(fixed, MEMBERS, ANA)).toBe(BRUNO);
  });

  it('fija: nadie si esa persona ya no está en el hogar', () => {
    expect(currentAssignee(task({ mode: 'fixed', assigneeId: 'carla' }), MEMBERS)).toBeNull();
  });

  it('libre: no es de nadie', () => {
    const free = task({ mode: 'free', assigneeId: null });
    expect(currentAssignee(free, MEMBERS)).toBeNull();
    expect(assigneeAfterCompletion(free, MEMBERS, ANA)).toBeNull();
  });

  it('rotación: el turno pasa al siguiente', () => {
    const rotating = task({ assigneeId: ANA });
    expect(currentAssignee(rotating, MEMBERS)).toBe(ANA);
    expect(assigneeAfterCompletion(rotating, MEMBERS, ANA)).toBe(BRUNO);
    expect(assigneeAfterCompletion(task({ assigneeId: BRUNO }), MEMBERS, BRUNO)).toBe(ANA);
  });

  it('rotación: si la hace quien no le tocaba, el turno pasa al siguiente de quien la hizo', () => {
    // Le tocaba a Ana pero la hizo Bruno: la próxima es de Ana.
    expect(assigneeAfterCompletion(task({ assigneeId: ANA }), MEMBERS, BRUNO)).toBe(ANA);
  });

  it('rotación: sin turno guardado empieza el primer miembro', () => {
    expect(currentAssignee(task({ assigneeId: null }), MEMBERS)).toBe(ANA);
  });

  it('rotación: respeta un orden propio e ignora a quien ya no está', () => {
    const custom = task({ rotationOrder: [BRUNO, 'carla', ANA], assigneeId: BRUNO });
    expect(assigneeAfterCompletion(custom, MEMBERS, BRUNO)).toBe(ANA);
    expect(assigneeAfterCompletion(custom, MEMBERS, ANA)).toBe(BRUNO);
  });

  it('rotación con una sola persona: siempre le toca', () => {
    expect(assigneeAfterCompletion(task(), [ANA], ANA)).toBe(ANA);
  });
});

describe('completar', () => {
  it('registra quién la hizo, mueve la fecha y pasa el turno', () => {
    const original = task({ nextDueOn: '2026-11-10' });
    const { completion, progress } = planCompletion({
      task: original,
      completionId: 'c1',
      completedBy: ANA,
      today: TODAY,
      memberIds: MEMBERS,
    });

    expect(progress).toEqual({
      nextDueOn: '2026-11-16',
      assigneeId: BRUNO,
      lastCompletedOn: TODAY,
      lastCompletedBy: ANA,
      lastCompletionId: 'c1',
      archived: false,
    });
    expect(completion).toMatchObject({
      id: 'c1',
      taskId: 't1',
      title: 'Aspirar',
      effort: 2,
      zoneId: 'z1',
      completedBy: ANA,
      completedOn: TODAY,
    });
  });

  it('guarda el estado anterior para poder deshacer', () => {
    const original = task({ nextDueOn: '2026-11-10', lastCompletedOn: '2026-11-06' });
    const { completion } = planCompletion({
      task: original,
      completionId: 'c1',
      completedBy: BRUNO,
      today: TODAY,
      memberIds: MEMBERS,
    });
    expect(completion.previous).toEqual({
      nextDueOn: '2026-11-10',
      assigneeId: ANA,
      lastCompletedOn: '2026-11-06',
      lastCompletedBy: null,
      lastCompletionId: null,
      archived: false,
    });
  });

  it('una tarea puntual sale de las listas al hacerla', () => {
    const { progress } = planCompletion({
      task: task({ intervalDays: null, mode: 'free', assigneeId: null }),
      completionId: 'c1',
      completedBy: ANA,
      today: TODAY,
      memberIds: MEMBERS,
    });
    expect(progress.archived).toBe(true);
    expect(progress.nextDueOn).toBe(TODAY);
  });

  it('solo se puede deshacer el último registro de la tarea', () => {
    const { completion, progress } = planCompletion({
      task: task(),
      completionId: 'c1',
      completedBy: ANA,
      today: TODAY,
      memberIds: MEMBERS,
    });
    const done = { ...task(), ...progress };
    expect(canUndo(completion, done)).toBe(true);
    expect(canUndo(completion, { ...done, lastCompletionId: 'c2' })).toBe(false);
    expect(canUndo(completion, undefined)).toBe(false);
  });

  it('posponer cuenta desde hoy aunque la tarea fuera atrasada', () => {
    expect(planPostpone(TODAY, 1)).toEqual({ nextDueOn: '2026-11-13' });
    expect(planPostpone(TODAY, 7)).toEqual({ nextDueOn: '2026-11-19' });
  });
});

describe('qué toca hoy', () => {
  it('separa lo mío, lo libre y lo de los demás, con lo más atrasado primero', () => {
    const groups = groupForToday(
      [
        task({ id: 'a', title: 'Aspirar', assigneeId: ANA }),
        task({ id: 'b', title: 'Baño', assigneeId: ANA, nextDueOn: '2026-11-09' }),
        task({ id: 'c', title: 'Cocina', assigneeId: BRUNO }),
        task({ id: 'd', title: 'Basura', mode: 'free', assigneeId: null }),
        task({ id: 'e', title: 'Sábanas', assigneeId: ANA, nextDueOn: '2026-11-20' }),
        task({ id: 'f', title: 'Borrada', assigneeId: ANA, archived: true }),
      ],
      { today: TODAY, uid: ANA, memberIds: MEMBERS },
    );

    expect(groups.mine.map((t) => t.id)).toEqual(['b', 'a']);
    expect(groups.free.map((t) => t.id)).toEqual(['d']);
    expect(groups.others.map((t) => t.id)).toEqual(['c']);
  });
});

describe('balance', () => {
  const completion = (overrides: Partial<Completion>): Completion => ({
    id: 'c',
    taskId: 't1',
    title: 'Aspirar',
    icon: '🧹',
    effort: 2,
    zoneId: 'z1',
    completedBy: ANA,
    completedOn: TODAY,
    previous: {
      nextDueOn: TODAY,
      assigneeId: ANA,
      lastCompletedOn: null,
      lastCompletedBy: null,
      lastCompletionId: null,
      archived: false,
    },
    ...overrides,
  });

  it('la semana va de lunes a domingo y el mes es el natural', () => {
    expect(periodRange('week', TODAY)).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(periodRange('month', TODAY)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(periodRange('month', '2026-12-31')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(periodRange('month', '2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('reparte el esfuerzo, no el número de tareas', () => {
    const balance = computeBalance(
      [
        completion({ effort: 3, completedBy: ANA }),
        completion({ effort: 1, completedBy: BRUNO }),
        completion({ effort: 1, completedBy: BRUNO }),
        completion({ effort: 1, completedBy: BRUNO }),
      ],
      MEMBERS,
      periodRange('week', TODAY),
    );

    expect(balance.totalEffort).toBe(6);
    expect(balance.members).toEqual([
      { uid: ANA, effort: 3, count: 1, share: 0.5 },
      { uid: BRUNO, effort: 3, count: 3, share: 0.5 },
    ]);
  });

  it('ignora lo que cae fuera del periodo', () => {
    const balance = computeBalance(
      [completion({ completedOn: '2026-11-08' }), completion({ completedOn: '2026-11-09' })],
      MEMBERS,
      periodRange('week', TODAY),
    );
    expect(balance.totalEffort).toBe(2);
  });

  it('sin nada hecho, nadie tiene parte', () => {
    const balance = computeBalance([], MEMBERS, periodRange('week', TODAY));
    expect(balance.totalEffort).toBe(0);
    expect(balance.members.map((member) => member.share)).toEqual([0, 0]);
    expect(balance.zones).toEqual([]);
  });

  it('desglosa por zona, con la de más esfuerzo primero', () => {
    const balance = computeBalance(
      [
        completion({ zoneId: 'cocina', effort: 1, completedBy: ANA }),
        completion({ zoneId: 'baño', effort: 3, completedBy: BRUNO }),
        completion({ zoneId: 'baño', effort: 3, completedBy: ANA }),
      ],
      MEMBERS,
      periodRange('week', TODAY),
    );
    expect(balance.zones).toEqual([
      { zoneId: 'baño', effort: 6, byMember: { [BRUNO]: 3, [ANA]: 3 } },
      { zoneId: 'cocina', effort: 1, byMember: { [ANA]: 1 } },
    ]);
  });
});

describe('tareas "cuando surgen"', () => {
  const sweep = task({
    id: 's',
    title: 'Barrer',
    onDemand: true,
    mode: 'free',
    assigneeId: null,
    intervalDays: null,
    nextDueOn: '2026-11-01',
  });

  it('apuntarlas deja constancia sin mover fecha ni turno, ni sacarlas de la lista', () => {
    const { completion, progress } = planCompletion({
      task: sweep,
      completionId: 'c1',
      completedBy: BRUNO,
      today: TODAY,
      memberIds: MEMBERS,
    });
    expect(progress).toEqual({
      nextDueOn: '2026-11-01',
      assigneeId: null,
      archived: false,
      lastCompletedOn: TODAY,
      lastCompletedBy: BRUNO,
      lastCompletionId: 'c1',
    });
    expect(completion).toMatchObject({ title: 'Barrer', completedBy: BRUNO, completedOn: TODAY });
  });

  it('se pueden apuntar varias veces el mismo día y deshacer la última', () => {
    const first = planCompletion({
      task: sweep,
      completionId: 'c1',
      completedBy: ANA,
      today: TODAY,
      memberIds: MEMBERS,
    });
    const afterFirst = { ...sweep, ...first.progress };
    const second = planCompletion({
      task: afterFirst,
      completionId: 'c2',
      completedBy: ANA,
      today: TODAY,
      memberIds: MEMBERS,
    });
    const afterSecond = { ...afterFirst, ...second.progress };

    expect(canUndo(second.completion, afterSecond)).toBe(true);
    expect(canUndo(first.completion, afterSecond)).toBe(false);
    // Al deshacer la segunda, la primera vuelve a ser la última.
    expect(second.completion.previous.lastCompletionId).toBe('c1');
  });

  it('nunca aparecen como pendientes, aunque su fecha sea antigua', () => {
    const groups = groupForToday([sweep], { today: TODAY, uid: ANA, memberIds: MEMBERS });
    expect(groups).toEqual({ mine: [], free: [], others: [] });
    expect(scheduledTasks([sweep, task()]).map((t) => t.id)).toEqual(['t1']);
  });

  it('se ordenan con lo hecho más recientemente primero', () => {
    const list = onDemandTasks([
      task({ id: 'a', title: 'Tender', onDemand: true }),
      task({ id: 'b', title: 'Barrer', onDemand: true, lastCompletedOn: '2026-11-10' }),
      task({ id: 'c', title: 'Destender', onDemand: true, lastCompletedOn: '2026-11-12' }),
      task({ id: 'd', title: 'Aspirar' }),
      task({ id: 'e', title: 'Vieja', onDemand: true, archived: true }),
    ]);
    expect(list.map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('plantilla inicial', () => {
  it('solo crea las zonas que usa lo elegido', () => {
    const litter = TEMPLATE_TASKS.find((item) => item.key === 'litter');
    const dishes = TEMPLATE_ON_DEMAND.find((item) => item.key === 'dishes');
    expect(zonesForTemplate([litter, dishes].filter((item) => item !== undefined))).toEqual([
      'kitchen',
      'cats',
    ]);
    expect(zonesForTemplate([])).toEqual([]);
  });

  it('ninguna tarea está a la vez como fija y como "cuando surge"', () => {
    const scheduled = new Set<string>(TEMPLATE_TASKS.map((item) => item.key));
    expect(TEMPLATE_ON_DEMAND.filter((item) => scheduled.has(item.key))).toEqual([]);
  });
});
