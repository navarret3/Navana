import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  arrayRemove,
  arrayUnion,
  collection,
  increment,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  setLogLevel,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ANA = 'ana';
const BRUNO = 'bruno';
const CARLA = 'carla';
const HOME = 'home-1';
const CODE = 'K7M4QX';

const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days: number) => Timestamp.fromMillis(Date.now() + days * DAY_MS);

let env: RulesTestEnvironment;

/** Firestore visto por un usuario con sesión. */
const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const anonymous = () => env.unauthenticatedContext().firestore() as unknown as Firestore;

const member = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  color: '#F6A77C',
  avatar: '🐱',
  pushTokens: [],
  ...extra,
});

const household = (memberIds: string[], createdBy = memberIds[0]) => ({
  name: 'Casa',
  icon: '🏠',
  memberIds,
  enabledModules: {},
  createdBy,
});

const invite = (householdId: string, createdBy: string, expiresAt = inDays(7)) => ({
  householdId,
  householdName: 'Casa',
  createdBy,
  expiresAt,
});

/** Deja datos preparados saltándose las reglas. */
async function seed(write: (db: Firestore) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (context) => {
    await write(context.firestore() as unknown as Firestore);
  });
}

/** Hogar de Ana ya creado, con su ficha de miembro. */
async function seedHome() {
  await seed(async (db) => {
    await setDoc(doc(db, 'households', HOME), household([ANA]));
    await setDoc(doc(db, 'households', HOME, 'members', ANA), member('Ana'));
    await setDoc(doc(db, 'users', ANA), { name: 'Ana', photoURL: null, householdId: HOME });
  });
}

/** El lote con el que alguien se une a un hogar usando un código. */
function joinBatch(db: Firestore, uid: string, hid: string, code: string | null) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'households', hid), { memberIds: arrayUnion(uid) });
  batch.set(
    doc(db, 'households', hid, 'members', uid),
    member('Nuevo', code === null ? {} : { inviteCode: code }),
  );
  batch.set(doc(db, 'users', uid), { householdId: hid }, { merge: true });
  return batch;
}

beforeAll(async () => {
  // Los rechazos esperados no deben llenar la salida de avisos.
  setLogLevel('error');
  env = await initializeTestEnvironment({
    projectId: 'demo-navana',
    firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe('users/{uid}', () => {
  it('cada usuario crea, lee y actualiza su propio documento', async () => {
    const ref = doc(as(ANA), 'users', ANA);
    await assertSucceeds(setDoc(ref, { name: 'Ana', photoURL: null }, { merge: true }));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { name: 'Ana G.' }));
  });

  it('nadie lee ni escribe el documento de otro', async () => {
    await seed((db) => setDoc(doc(db, 'users', ANA), { name: 'Ana', photoURL: null }));
    await assertFails(getDoc(doc(as(BRUNO), 'users', ANA)));
    await assertFails(setDoc(doc(as(BRUNO), 'users', ANA), { name: 'Hackeada' }));
  });

  it('sin sesión no se accede a nada', async () => {
    await assertFails(getDoc(doc(anonymous(), 'users', ANA)));
    await assertFails(setDoc(doc(anonymous(), 'users', ANA), { name: 'Ana' }));
  });

  it('no puede apuntarse a un hogar del que no es miembro', async () => {
    await seedHome();
    await assertFails(
      setDoc(doc(as(BRUNO), 'users', BRUNO), { name: 'Bruno', householdId: HOME }),
    );
  });

  it('cada usuario puede borrar su propio documento, y solo el suyo', async () => {
    await seed((db) => setDoc(doc(db, 'users', ANA), { name: 'Ana', photoURL: null }));
    await assertFails(deleteDoc(doc(as(BRUNO), 'users', ANA)));
    await assertSucceeds(deleteDoc(doc(as(ANA), 'users', ANA)));
  });

  it('rechaza campos desconocidos', async () => {
    await assertFails(setDoc(doc(as(ANA), 'users', ANA), { name: 'Ana', admin: true }));
  });
});

describe('households/{hid}', () => {
  it('se crea un hogar con uno mismo como único miembro, en un solo lote', async () => {
    const db = as(ANA);
    const batch = writeBatch(db);
    batch.set(doc(db, 'households', HOME), household([ANA]));
    batch.set(doc(db, 'households', HOME, 'members', ANA), member('Ana'));
    batch.set(doc(db, 'users', ANA), { name: 'Ana', photoURL: null, householdId: HOME });
    await assertSucceeds(batch.commit());
  });

  it('no se puede crear un hogar metiendo a otra persona', async () => {
    await assertFails(setDoc(doc(as(ANA), 'households', HOME), household([ANA, BRUNO], ANA)));
    await assertFails(setDoc(doc(as(ANA), 'households', HOME), household([BRUNO], ANA)));
  });

  it('solo los miembros leen el hogar y sus miembros', async () => {
    await seedHome();
    await assertSucceeds(getDoc(doc(as(ANA), 'households', HOME)));
    await assertSucceeds(getDocs(collection(as(ANA), 'households', HOME, 'members')));

    await assertFails(getDoc(doc(as(BRUNO), 'households', HOME)));
    await assertFails(getDocs(collection(as(BRUNO), 'households', HOME, 'members')));
    await assertFails(getDoc(doc(anonymous(), 'households', HOME)));
  });

  it('nadie puede listar hogares', async () => {
    await seedHome();
    await assertFails(getDocs(collection(as(ANA), 'households')));
  });

  it('un miembro cambia nombre, icono y módulos', async () => {
    await seedHome();
    const ref = doc(as(ANA), 'households', HOME);
    await assertSucceeds(updateDoc(ref, { name: 'Nuestra casa', icon: '🪴' }));
    await assertSucceeds(updateDoc(ref, { 'enabledModules.agenda': false }));
  });

  it('un miembro no puede añadir a nadie ni quitar a otro a mano', async () => {
    await seedHome();
    await seed((db) => updateDoc(doc(db, 'households', HOME), { memberIds: [ANA, BRUNO] }));
    const ref = doc(as(ANA), 'households', HOME);
    await assertFails(updateDoc(ref, { memberIds: arrayUnion(CARLA) }));
    await assertFails(updateDoc(ref, { memberIds: [ANA] }));
    await assertFails(updateDoc(ref, { memberIds: [] }));
  });

  it('quien no es miembro no puede escribir', async () => {
    await seedHome();
    await assertFails(updateDoc(doc(as(BRUNO), 'households', HOME), { name: 'Mía' }));
  });

  it('rechaza nombres vacíos o demasiado largos', async () => {
    await seedHome();
    const ref = doc(as(ANA), 'households', HOME);
    await assertFails(updateDoc(ref, { name: '' }));
    await assertFails(updateDoc(ref, { name: 'x'.repeat(41) }));
  });
});

describe('invites/{code}', () => {
  it('un miembro crea una invitación para su hogar', async () => {
    await seedHome();
    await assertSucceeds(setDoc(doc(as(ANA), 'invites', CODE), invite(HOME, ANA)));
  });

  it('quien no es miembro no puede invitar a ese hogar', async () => {
    await seedHome();
    await assertFails(setDoc(doc(as(BRUNO), 'invites', CODE), invite(HOME, BRUNO)));
  });

  it('no admite invitaciones caducadas, eternas ni con códigos raros', async () => {
    await seedHome();
    const db = as(ANA);
    await assertFails(setDoc(doc(db, 'invites', CODE), invite(HOME, ANA, inDays(-1))));
    await assertFails(setDoc(doc(db, 'invites', CODE), invite(HOME, ANA, inDays(30))));
    await assertFails(setDoc(doc(db, 'invites', 'abc'), invite(HOME, ANA)));
    await assertFails(setDoc(doc(db, 'invites', CODE), invite(HOME, BRUNO)));
  });

  it('con el código se puede leer la invitación, pero no listarlas', async () => {
    await seed((db) => setDoc(doc(db, 'invites', CODE), invite(HOME, ANA)));
    await assertSucceeds(getDoc(doc(as(BRUNO), 'invites', CODE)));
    await assertFails(getDocs(collection(as(BRUNO), 'invites')));
    await assertFails(getDoc(doc(anonymous(), 'invites', CODE)));
  });

  it('una invitación no se puede modificar', async () => {
    await seedHome();
    await seed((db) => setDoc(doc(db, 'invites', CODE), invite(HOME, ANA)));
    await assertFails(updateDoc(doc(as(ANA), 'invites', CODE), { expiresAt: inDays(5) }));
  });
});

describe('unirse a un hogar', () => {
  beforeEach(seedHome);

  it('funciona con una invitación válida', async () => {
    await seed((db) => setDoc(doc(db, 'invites', CODE), invite(HOME, ANA)));
    const db = as(BRUNO);
    await assertSucceeds(joinBatch(db, BRUNO, HOME, CODE).commit());

    // Ya dentro, Bruno ve el hogar y a Ana.
    await assertSucceeds(getDoc(doc(db, 'households', HOME)));
    await assertSucceeds(getDoc(doc(db, 'households', HOME, 'members', ANA)));
  });

  it('falla sin invitación', async () => {
    await assertFails(joinBatch(as(BRUNO), BRUNO, HOME, null).commit());
    await assertFails(
      updateDoc(doc(as(BRUNO), 'households', HOME), { memberIds: arrayUnion(BRUNO) }),
    );
  });

  it('falla con un código que no existe', async () => {
    await assertFails(joinBatch(as(BRUNO), BRUNO, HOME, 'ZZZZZZ').commit());
  });

  it('falla con una invitación caducada', async () => {
    await seed((db) => setDoc(doc(db, 'invites', CODE), invite(HOME, ANA, inDays(-1))));
    await assertFails(joinBatch(as(BRUNO), BRUNO, HOME, CODE).commit());
  });

  it('falla con la invitación de otro hogar', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'households', 'home-2'), household([CARLA]));
      await setDoc(doc(db, 'invites', CODE), invite('home-2', CARLA));
    });
    await assertFails(joinBatch(as(BRUNO), BRUNO, HOME, CODE).commit());
  });

  it('no se puede colar a otra persona con una invitación válida', async () => {
    await seed((db) => setDoc(doc(db, 'invites', CODE), invite(HOME, ANA)));
    const db = as(BRUNO);
    const batch = writeBatch(db);
    batch.update(doc(db, 'households', HOME), { memberIds: arrayUnion(BRUNO, CARLA) });
    batch.set(doc(db, 'households', HOME, 'members', BRUNO), member('Bruno', { inviteCode: CODE }));
    await assertFails(batch.commit());
  });

  it('al unirse no se puede cambiar nada más del hogar', async () => {
    await seed((db) => setDoc(doc(db, 'invites', CODE), invite(HOME, ANA)));
    const db = as(BRUNO);
    const batch = writeBatch(db);
    batch.update(doc(db, 'households', HOME), { memberIds: arrayUnion(BRUNO), name: 'Mía' });
    batch.set(doc(db, 'households', HOME, 'members', BRUNO), member('Bruno', { inviteCode: CODE }));
    await assertFails(batch.commit());
  });
});

describe('households/{hid}/members/{uid}', () => {
  beforeEach(async () => {
    await seedHome();
    await seed(async (db) => {
      await updateDoc(doc(db, 'households', HOME), { memberIds: [ANA, BRUNO] });
      await setDoc(doc(db, 'households', HOME, 'members', BRUNO), member('Bruno'));
    });
  });

  it('cada miembro edita su propio perfil', async () => {
    await assertSucceeds(
      updateDoc(doc(as(BRUNO), 'households', HOME, 'members', BRUNO), {
        name: 'Bru',
        color: '#A8C3A0',
        avatar: '🦊',
      }),
    );
  });

  it('cada miembro guarda sus preferencias de avisos y los tokens de su móvil', async () => {
    const ref = doc(as(BRUNO), 'households', HOME, 'members', BRUNO);
    await assertSucceeds(updateDoc(ref, { notify: { dailySummary: false, summaryHour: 8 } }));
    await assertSucceeds(updateDoc(ref, { pushTokens: arrayUnion('ExponentPushToken[abc]') }));
    await assertFails(updateDoc(ref, { notify: 'todo' }));
  });

  it('los demás miembros leen esos tokens, pero nadie de fuera', async () => {
    await assertSucceeds(getDoc(doc(as(ANA), 'households', HOME, 'members', BRUNO)));
    await assertFails(getDoc(doc(as(CARLA), 'households', HOME, 'members', BRUNO)));
  });

  it('un miembro sale del hogar: se quita a sí mismo, borra su ficha y deja de verlo', async () => {
    const db = as(BRUNO);
    const batch = writeBatch(db);
    batch.update(doc(db, 'households', HOME), { memberIds: arrayRemove(BRUNO) });
    batch.delete(doc(db, 'households', HOME, 'members', BRUNO));
    batch.set(doc(db, 'users', BRUNO), { householdId: null }, { merge: true });
    await assertSucceeds(batch.commit());

    await assertFails(getDoc(doc(db, 'households', HOME)));
    await assertSucceeds(getDoc(doc(as(ANA), 'households', HOME)));
  });

  it('nadie puede echar a otro ni borrar su ficha', async () => {
    const db = as(ANA);
    await assertFails(updateDoc(doc(db, 'households', HOME), { memberIds: arrayRemove(BRUNO) }));
    await assertFails(deleteDoc(doc(db, 'households', HOME, 'members', BRUNO)));
  });

  it('al salir no se puede cambiar nada más del hogar', async () => {
    await assertFails(
      updateDoc(doc(as(BRUNO), 'households', HOME), {
        memberIds: arrayRemove(BRUNO),
        name: 'Adiós',
      }),
    );
  });

  it('nadie edita el perfil de otro miembro', async () => {
    await assertFails(
      updateDoc(doc(as(ANA), 'households', HOME, 'members', BRUNO), { name: 'Otro' }),
    );
  });

  it('rechaza colores que no son hexadecimales', async () => {
    await assertFails(
      updateDoc(doc(as(BRUNO), 'households', HOME, 'members', BRUNO), { color: 'rojo' }),
    );
  });

  it('alguien de fuera no puede crearse una ficha de miembro', async () => {
    await assertFails(
      setDoc(doc(as(CARLA), 'households', HOME, 'members', CARLA), member('Carla')),
    );
  });
});

describe('zonas, tareas e historial', () => {
  const zone = { name: 'Cocina', icon: '🍳', order: 0 };
  const task = (extra: Record<string, unknown> = {}) => ({
    title: 'Aspirar',
    icon: '🧹',
    zoneId: 'z1',
    effort: 2,
    mode: 'rotation',
    assigneeId: ANA,
    rotationOrder: [],
    intervalDays: 4,
    nextDueOn: '2026-11-12',
    lastCompletedOn: null,
    lastCompletedBy: null,
    lastCompletionId: null,
    archived: false,
    ...extra,
  });
  const completion = (completedBy: string) => ({
    taskId: 't1',
    title: 'Aspirar',
    icon: '🧹',
    effort: 2,
    zoneId: 'z1',
    completedBy,
    completedOn: '2026-11-12',
    previous: { nextDueOn: '2026-11-12', assigneeId: ANA, archived: false },
  });

  beforeEach(async () => {
    await seedHome();
    await seed(async (db) => {
      await setDoc(doc(db, 'households', HOME, 'zones', 'z1'), zone);
      await setDoc(doc(db, 'households', HOME, 'tasks', 't1'), task());
      await setDoc(doc(db, 'households', HOME, 'completions', 'c1'), completion(ANA));
    });
  });

  it('un miembro crea y edita zonas y tareas', async () => {
    const db = as(ANA);
    await assertSucceeds(setDoc(doc(db, 'households', HOME, 'zones', 'z2'), zone));
    await assertSucceeds(setDoc(doc(db, 'households', HOME, 'tasks', 't2'), task()));
    await assertSucceeds(
      updateDoc(doc(db, 'households', HOME, 'tasks', 't1'), { nextDueOn: '2026-11-13' }),
    );
    await assertSucceeds(updateDoc(doc(db, 'households', HOME, 'tasks', 't1'), { archived: true }));
  });

  it('completar es un lote: registro del historial y nuevo estado de la tarea', async () => {
    const db = as(ANA);
    const batch = writeBatch(db);
    batch.set(doc(db, 'households', HOME, 'completions', 'c2'), completion(ANA));
    batch.update(doc(db, 'households', HOME, 'tasks', 't1'), {
      nextDueOn: '2026-11-16',
      lastCompletedOn: '2026-11-12',
      lastCompletedBy: ANA,
      lastCompletionId: 'c2',
    });
    await assertSucceeds(batch.commit());
  });

  it('las estadísticas leen el periodo completo, aunque supere 300 registros, solo dentro del hogar', async () => {
    await seed(async (db) => {
      const batch = writeBatch(db);
      for (let index = 0; index < 350; index++) {
        batch.set(doc(db, 'households', HOME, 'completions', `history-${index}`), {
          ...completion(ANA), completedOn: index % 2 ? '2026-11-01' : '2026-11-30',
        });
      }
      batch.set(doc(db, 'households', HOME, 'completions', 'older'), {
        ...completion(ANA), completedOn: '2025-12-31',
      });
      await batch.commit();
    });
    const inNovember = (db: Firestore) => query(collection(db, 'households', HOME, 'completions'),
      orderBy('completedOn', 'desc'), where('completedOn', '>=', '2026-11-01'), where('completedOn', '<=', '2026-11-30'));
    const month = await assertSucceeds(getDocs(inNovember(as(ANA))));
    expect(month.size).toBe(351);
    const all = await assertSucceeds(getDocs(query(collection(as(ANA), 'households', HOME, 'completions'), orderBy('completedOn', 'desc'))));
    expect(all.size).toBe(352);
    await assertFails(getDocs(inNovember(as(BRUNO))));
  });

  it('deshacer borra el registro; el historial no se edita', async () => {
    const ref = doc(as(ANA), 'households', HOME, 'completions', 'c1');
    await assertFails(updateDoc(ref, { effort: 3 }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('nadie apunta una tarea a nombre de otro', async () => {
    await assertFails(
      setDoc(doc(as(ANA), 'households', HOME, 'completions', 'c2'), completion(BRUNO)),
    );
  });

  it.each([0, 4, 1.5, '2'])('rechaza un esfuerzo fuera de 1, 2 o 3: %s', async (effort) => {
    const db = as(ANA);
    await assertFails(updateDoc(doc(db, 'households', HOME, 'tasks', 't1'), { effort }));
    await assertFails(setDoc(doc(db, 'households', HOME, 'completions', 'invalid'), {
      ...completion(ANA), effort,
    }));
  });

  it.each([1, 2, 3])('permite editar el esfuerzo a %s y lo conserva al completar', async (effort) => {
    const db = as(ANA);
    const ref = doc(db, 'households', HOME, 'tasks', 't1');
    await assertSucceeds(updateDoc(ref, { effort }));
    await assertSucceeds(setDoc(doc(db, 'households', HOME, 'completions', 'next'), {
      ...completion(ANA), effort,
    }));
    // El historial previo no cambia al editar el esfuerzo del catálogo.
    expect((await getDoc(doc(db, 'households', HOME, 'completions', 'c1'))).data()?.effort).toBe(2);
  });

  it('rechaza completar tareas inexistentes o retiradas, conservando su historial', async () => {
    const db = as(ANA);
    const entryRef = doc(db, 'households', HOME, 'completions', 'next');
    await assertFails(setDoc(entryRef, { ...completion(ANA), taskId: 'missing' }));
    await assertSucceeds(updateDoc(doc(db, 'households', HOME, 'tasks', 't1'), {
      archived: true, lastCompletionId: null,
    }));
    await assertFails(setDoc(entryRef, completion(ANA)));
    await assertSucceeds(getDoc(doc(db, 'households', HOME, 'completions', 'c1')));
  });

  it('rechaza crear una tarea y realizarla en el mismo lote', async () => {
    const db = as(ANA);
    const batch = writeBatch(db);
    batch.set(doc(db, 'households', HOME, 'tasks', 'new'), task());
    batch.set(doc(db, 'households', HOME, 'completions', 'new'), {
      ...completion(ANA), taskId: 'new',
    });
    await assertFails(batch.commit());
  });

  it.each([
    { effort: 3 }, { title: 'Otra tarea' }, { icon: '✨' }, { zoneId: null },
  ])('rechaza alterar los datos de la tarea al realizarla: %s', async (changes) => {
    await assertFails(setDoc(doc(as(ANA), 'households', HOME, 'completions', 'spoof'), {
      ...completion(ANA), ...changes,
    }));
  });

  it('permite completar y deshacer una tarea puntual aunque se archive al hacerla', async () => {
    const db = as(ANA);
    const taskRef = doc(db, 'households', HOME, 'tasks', 't1');
    const entryRef = doc(db, 'households', HOME, 'completions', 'once');
    await updateDoc(taskRef, { intervalDays: null });
    const batch = writeBatch(db);
    batch.set(entryRef, completion(ANA));
    batch.update(taskRef, { archived: true, lastCompletionId: 'once' });
    await assertSucceeds(batch.commit());
    const undo = writeBatch(db);
    undo.delete(entryRef);
    undo.update(taskRef, { archived: false, lastCompletionId: null });
    await assertSucceeds(undo.commit());
  });

  it('rechaza tareas mal formadas', async () => {
    const ref = doc(as(ANA), 'households', HOME, 'tasks', 't2');
    await assertFails(setDoc(ref, task({ effort: 5 })));
    await assertFails(setDoc(ref, task({ mode: 'azar' })));
    await assertFails(setDoc(ref, task({ intervalDays: 0 })));
    await assertFails(setDoc(ref, task({ nextDueOn: 'mañana' })));
    await assertFails(setDoc(ref, task({ title: '' })));
    await assertFails(setDoc(ref, task({ sorpresa: true })));
  });

  it('admite tareas "cuando surgen" y apuntarlas varias veces', async () => {
    const db = as(ANA);
    const ref = doc(db, 'households', HOME, 'tasks', 't3');
    await assertSucceeds(
      setDoc(ref, task({ onDemand: true, mode: 'free', assigneeId: null, intervalDays: null })),
    );
    await assertFails(setDoc(ref, task({ onDemand: 'a veces' })));
    for (const id of ['c3', 'c4']) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'households', HOME, 'completions', id), {
        ...completion(ANA),
        taskId: 't3',
      });
      batch.update(ref, { lastCompletedOn: '2026-11-12', lastCompletedBy: ANA, lastCompletionId: id });
      await assertSucceeds(batch.commit());
    }
  });

  it('las tareas no se borran, se archivan', async () => {
    await assertFails(deleteDoc(doc(as(ANA), 'households', HOME, 'tasks', 't1')));
  });

  it('quien no es del hogar no ve ni toca nada', async () => {
    const db = as(BRUNO);
    await assertFails(getDocs(collection(db, 'households', HOME, 'tasks')));
    await assertFails(getDocs(collection(db, 'households', HOME, 'zones')));
    await assertFails(getDocs(collection(db, 'households', HOME, 'completions')));
    await assertFails(setDoc(doc(db, 'households', HOME, 'tasks', 't9'), task()));
    await assertFails(setDoc(doc(db, 'households', HOME, 'zones', 'z9'), zone));
    await assertFails(
      setDoc(doc(db, 'households', HOME, 'completions', 'c9'), completion(BRUNO)),
    );
    await assertFails(deleteDoc(doc(db, 'households', HOME, 'completions', 'c1')));
  });
});

describe('lista de la compra y catálogo', () => {
  const item = (extra: Record<string, unknown> = {}) => ({
    name: 'Leche',
    key: 'leche',
    categoryId: 'dairy',
    checked: false,
    addedBy: ANA,
    checkedBy: null,
    ...extra,
  });

  beforeEach(async () => {
    await seedHome();
    await seed((db) => setDoc(doc(db, 'households', HOME, 'shoppingItems', 'i1'), item()));
  });

  it('un miembro añade, tacha, recategoriza y quita productos', async () => {
    const db = as(ANA);
    await assertSucceeds(
      setDoc(doc(db, 'households', HOME, 'shoppingItems', 'i2'), item({ name: 'Pan', key: 'pan' })),
    );
    const ref = doc(db, 'households', HOME, 'shoppingItems', 'i1');
    await assertSucceeds(updateDoc(ref, { checked: true, checkedBy: ANA }));
    await assertSucceeds(updateDoc(ref, { categoryId: 'pantry' }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('un miembro gestiona tiendas y puede seguir usando un producto al quitar su tienda', async () => {
    const db = as(ANA);
    const store = doc(db, 'households', HOME, 'shoppingStores', 's1');
    const product = doc(db, 'households', HOME, 'shoppingItems', 'i1');
    await assertFails(setDoc(store, { name: '' }));
    await assertSucceeds(setDoc(store, { name: 'Frutería' }));
    await assertSucceeds(getDoc(store));
    await assertFails(updateDoc(product, { storeId: 'ruta/no-válida' }));
    await assertSucceeds(updateDoc(product, { storeId: 's1' }));
    await assertSucceeds(deleteDoc(store));
    // Llega una escritura que estaba pendiente en el móvil sin conexión.
    await assertSucceeds(setDoc(doc(db, 'households', HOME, 'shoppingItems', 'offline'), item({ storeId: 's1' })));
    await assertSucceeds(updateDoc(product, { checked: true }));
    await assertSucceeds(updateDoc(product, { storeId: null }));
  });

  it('los establecimientos solo son accesibles desde su hogar', async () => {
    const ref = doc(as(CARLA), 'households', HOME, 'shoppingStores', 's1');
    await assertFails(getDoc(ref));
    await assertFails(setDoc(ref, { name: 'Tienda' }));
    await assertFails(deleteDoc(ref));
  });

  it('terminar la compra borra lo tachado y suma al catálogo, en un lote', async () => {
    const db = as(ANA);
    const entry = doc(db, 'households', HOME, 'catalog', 'leche');
    for (const expected of [1, 2]) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'households', HOME, 'shoppingItems', 'i1'));
      batch.set(
        entry,
        { name: 'Leche', categoryId: 'dairy', timesBought: increment(1), lastBoughtAt: 1000 },
        { merge: true },
      );
      await assertSucceeds(batch.commit());
      expect((await getDoc(entry)).data()?.timesBought).toBe(expected);
    }
  });

  it('admite el contador como decimal, que es como lo incrementa el móvil', async () => {
    // React Native Firebase en Android envía `increment(1)` como 1.0. El SDK web no deja
    // reproducirlo tal cual (1.0 es un entero en JavaScript), así que se usa otro decimal.
    const db = as(ANA);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'households', HOME, 'shoppingItems', 'i1'));
    batch.set(
      doc(db, 'households', HOME, 'catalog', 'leche'),
      { name: 'Leche', categoryId: 'dairy', timesBought: increment(1.5), lastBoughtAt: 1000 },
      { merge: true },
    );
    await assertSucceeds(batch.commit());
  });

  it('se puede recordar una categoría de algo que aún no se ha comprado', async () => {
    await assertSucceeds(
      setDoc(
        doc(as(ANA), 'households', HOME, 'catalog', 'destornillador'),
        { name: 'Destornillador', categoryId: 'cleaning' },
        { merge: true },
      ),
    );
  });

  it('rechaza productos mal formados', async () => {
    const db = as(ANA);
    const ref = doc(db, 'households', HOME, 'shoppingItems', 'i3');
    await assertFails(setDoc(ref, item({ name: '' })));
    await assertFails(setDoc(ref, item({ checked: 'sí' })));
    await assertFails(setDoc(ref, item({ cantidad: 3 })));
    await assertFails(
      setDoc(doc(db, 'households', HOME, 'catalog', 'leche'), {
        name: 'Leche',
        categoryId: 'dairy',
        timesBought: -1,
      }),
    );
  });

  it('quien no es del hogar no ve ni toca la lista ni el catálogo', async () => {
    const db = as(BRUNO);
    await assertFails(getDocs(collection(db, 'households', HOME, 'shoppingItems')));
    await assertFails(getDocs(collection(db, 'households', HOME, 'catalog')));
    await assertFails(setDoc(doc(db, 'households', HOME, 'shoppingItems', 'i9'), item()));
    await assertFails(deleteDoc(doc(db, 'households', HOME, 'shoppingItems', 'i1')));
    await assertFails(
      setDoc(doc(db, 'households', HOME, 'catalog', 'leche'), { name: 'Leche', categoryId: 'dairy' }),
    );
  });
});

describe('agenda', () => {
  const event = (extra: Record<string, unknown> = {}) => ({
    title: 'Cena',
    type: 'event',
    date: '2026-11-14',
    endDate: null,
    time: '21:00',
    location: '',
    notes: '',
    participants: [],
    reminders: [60, 1440],
    yearly: false,
    createdBy: ANA,
    ...extra,
  });

  beforeEach(async () => {
    await seedHome();
    await seed((db) => setDoc(doc(db, 'households', HOME, 'events', 'e1'), event()));
  });

  it('un miembro crea, edita y borra eventos', async () => {
    const db = as(ANA);
    await assertSucceeds(
      setDoc(
        doc(db, 'households', HOME, 'events', 'e2'),
        event({ title: 'Cumple', type: 'birthday', time: null, yearly: true }),
      ),
    );
    await assertSucceeds(
      setDoc(
        doc(db, 'households', HOME, 'events', 'e3'),
        event({ title: 'Viaje', type: 'trip', endDate: '2026-11-18', time: null, participants: [ANA] }),
      ),
    );
    await assertSucceeds(
      setDoc(doc(db, 'households', HOME, 'events', 'e4'), event({ type: 'concert' })),
    );
    await assertSucceeds(
      setDoc(doc(db, 'households', HOME, 'events', 'e5'), event({ type: 'appointment' })),
    );
    // Los tipos antiguos siguen valiendo: los escriben las versiones anteriores de la app.
    await assertSucceeds(setDoc(doc(db, 'households', HOME, 'events', 'e6'), event({ type: 'plan' })));
    const ref = doc(db, 'households', HOME, 'events', 'e1');
    await assertSucceeds(updateDoc(ref, { time: '20:30', location: 'Casa' }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('rechaza eventos mal formados', async () => {
    const ref = doc(as(ANA), 'households', HOME, 'events', 'e9');
    await assertFails(setDoc(ref, event({ title: '' })));
    await assertFails(setDoc(ref, event({ type: 'fiesta' })));
    await assertFails(setDoc(ref, event({ date: '14/11/2026' })));
    await assertFails(setDoc(ref, event({ time: '25:00' })));
    await assertFails(setDoc(ref, event({ endDate: 'luego' })));
    await assertFails(setDoc(ref, event({ yearly: 'sí' })));
    await assertFails(setDoc(ref, event({ extra: true })));
  });

  it('quien no es del hogar no ve ni toca la agenda', async () => {
    const db = as(BRUNO);
    await assertFails(getDocs(collection(db, 'households', HOME, 'events')));
    await assertFails(setDoc(doc(db, 'households', HOME, 'events', 'e9'), event()));
    await assertFails(deleteDoc(doc(db, 'households', HOME, 'events', 'e1')));
  });
});

describe('notas y menú semanal', () => {
  const note = (extra: Record<string, unknown> = {}) => ({
    title: 'Wifi',
    body: 'clave: 1234',
    pinned: true,
    updatedAt: 1000,
    updatedBy: ANA,
    ...extra,
  });
  const meal = { title: 'Lentejas', ingredients: ['Lentejas', 'Zanahorias'] };

  beforeEach(seedHome);

  it('un miembro crea, edita y borra notas', async () => {
    const ref = doc(as(ANA), 'households', HOME, 'notes', 'n1');
    await assertSucceeds(setDoc(ref, note()));
    await assertSucceeds(updateDoc(ref, { body: 'clave: 5678', updatedAt: 2000 }));
    await assertSucceeds(setDoc(doc(as(ANA), 'households', HOME, 'notes', 'n2'), note({ title: '' })));
    await assertSucceeds(deleteDoc(ref));
  });

  it('rechaza notas vacías, a nombre de otro o mal formadas', async () => {
    const ref = doc(as(ANA), 'households', HOME, 'notes', 'n1');
    await assertFails(setDoc(ref, note({ title: '', body: '' })));
    await assertFails(setDoc(ref, note({ updatedBy: BRUNO })));
    await assertFails(setDoc(ref, note({ pinned: 'sí' })));
    await assertFails(setDoc(ref, note({ body: 'x'.repeat(5001) })));
  });

  it('un miembro apunta y vacía comidas, cada una por separado', async () => {
    const ref = doc(as(ANA), 'households', HOME, 'menu', '2026-11-12');
    await assertSucceeds(setDoc(ref, { lunch: meal }, { merge: true }));
    await assertSucceeds(setDoc(ref, { dinner: { title: 'Tortilla', ingredients: [] } }, { merge: true }));
    await assertSucceeds(setDoc(ref, { lunch: null }, { merge: true }));
    expect((await getDoc(ref)).data()).toEqual({
      lunch: null,
      dinner: { title: 'Tortilla', ingredients: [] },
    });
  });

  it('rechaza días o comidas mal formados', async () => {
    const db = as(ANA);
    await assertFails(setDoc(doc(db, 'households', HOME, 'menu', 'jueves'), { lunch: meal }));
    const ref = doc(db, 'households', HOME, 'menu', '2026-11-12');
    await assertFails(setDoc(ref, { lunch: 'Lentejas' }));
    await assertFails(setDoc(ref, { lunch: { title: 'x'.repeat(81), ingredients: [] } }));
    await assertFails(setDoc(ref, { merienda: meal }));
  });

  it('quien no es del hogar no ve ni toca las notas ni el menú', async () => {
    const db = as(BRUNO);
    await assertFails(getDocs(collection(db, 'households', HOME, 'notes')));
    await assertFails(getDocs(collection(db, 'households', HOME, 'menu')));
    await assertFails(setDoc(doc(db, 'households', HOME, 'notes', 'n9'), note({ updatedBy: BRUNO })));
    await assertFails(setDoc(doc(db, 'households', HOME, 'menu', '2026-11-12'), { lunch: meal }));
  });
});

describe('películas', () => {
  const film = (extra: Record<string, unknown> = {}) => ({
    title: 'Origen',
    year: 2010,
    posterPath: '/origen.jpg',
    overview: 'Un ladrón que roba secretos.',
    tmdbId: 27205,
    addedBy: ANA,
    addedAt: 1000,
    watched: false,
    watchedAt: null,
    watchedBy: null,
    ...extra,
  });

  beforeEach(seedHome);

  it('un miembro añade, marca como vista y quita películas', async () => {
    const db = as(ANA);
    const ref = doc(db, 'households', HOME, 'movies', 'm1');
    await assertSucceeds(setDoc(ref, film()));
    // Escrita a mano: solo el título.
    await assertSucceeds(
      setDoc(
        doc(db, 'households', HOME, 'movies', 'm2'),
        film({ title: 'Dune', year: null, posterPath: null, overview: '', tmdbId: null }),
      ),
    );
    await assertSucceeds(updateDoc(ref, { watched: true, watchedAt: 2000, watchedBy: ANA }));
    await assertSucceeds(updateDoc(ref, { watched: false, watchedAt: null, watchedBy: null }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('cada uno añade a su nombre y luego solo cambia si está vista', async () => {
    const db = as(ANA);
    await assertFails(setDoc(doc(db, 'households', HOME, 'movies', 'm9'), film({ addedBy: BRUNO })));
    const ref = doc(db, 'households', HOME, 'movies', 'm1');
    await assertSucceeds(setDoc(ref, film()));
    await assertFails(updateDoc(ref, { title: 'Otra' }));
    await assertFails(updateDoc(ref, { addedBy: BRUNO }));
  });

  it('rechaza películas mal formadas', async () => {
    const ref = doc(as(ANA), 'households', HOME, 'movies', 'm9');
    await assertFails(setDoc(ref, film({ title: '' })));
    await assertFails(setDoc(ref, film({ year: '2010' })));
    await assertFails(setDoc(ref, film({ overview: 'x'.repeat(1001) })));
    await assertFails(setDoc(ref, film({ watched: 'no' })));
    await assertFails(setDoc(ref, film({ extra: true })));
  });

  it('quien no es del hogar no ve ni toca las películas', async () => {
    const db = as(BRUNO);
    await assertFails(getDocs(collection(db, 'households', HOME, 'movies')));
    await assertFails(setDoc(doc(db, 'households', HOME, 'movies', 'm9'), film({ addedBy: BRUNO })));
  });
});
