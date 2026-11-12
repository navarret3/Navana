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
  setDoc,
  setLogLevel,
  updateDoc,
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
    type: 'plan',
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
        event({ title: 'Viaje', endDate: '2026-11-18', time: null, participants: [ANA] }),
      ),
    );
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
