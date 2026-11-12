import {
  arrayRemove,
  arrayUnion,
  collection,
  db,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@/data/fb';
import { duringMembershipWrite } from '@/data/membershipWrites';
import {
  DEFAULT_NOTIFY_PREFS,
  type Household,
  type Member,
  type MemberProfile,
  type NotifyPrefs,
} from '@/domain/household';

const householdRef = (hid: string) => doc(db, 'households', hid);
const memberRef = (hid: string, uid: string) => doc(db, 'households', hid, 'members', uid);

type RawData = Record<string, unknown> | undefined;

function toHousehold(id: string, data: RawData): Household {
  return {
    id,
    name: typeof data?.name === 'string' ? data.name : '',
    icon: typeof data?.icon === 'string' ? data.icon : '',
    memberIds: Array.isArray(data?.memberIds) ? (data.memberIds as string[]) : [],
    enabledModules: (data?.enabledModules ?? {}) as Household['enabledModules'],
  };
}

function toNotifyPrefs(value: unknown): NotifyPrefs {
  const saved = (value ?? {}) as Partial<Record<keyof NotifyPrefs, unknown>>;
  const flag = (key: Exclude<keyof NotifyPrefs, 'summaryHour'>) =>
    typeof saved[key] === 'boolean' ? saved[key] : DEFAULT_NOTIFY_PREFS[key];
  const hour = saved.summaryHour;
  return {
    dailySummary: flag('dailySummary'),
    overdue: flag('overdue'),
    partnerCompleted: flag('partnerCompleted'),
    nudges: flag('nudges'),
    summaryHour:
      typeof hour === 'number' && hour >= 0 && hour <= 23
        ? Math.floor(hour)
        : DEFAULT_NOTIFY_PREFS.summaryHour,
  };
}

function toMember(uid: string, data: RawData): Member {
  return {
    uid,
    name: typeof data?.name === 'string' ? data.name : '',
    color: typeof data?.color === 'string' ? data.color : '',
    avatar: typeof data?.avatar === 'string' ? data.avatar : '',
    notify: toNotifyPrefs(data?.notify),
    pushTokens: Array.isArray(data?.pushTokens) ? (data.pushTokens as string[]) : [],
  };
}

/**
 * Crea el hogar, la ficha de miembro de quien lo crea y lo apunta en su usuario.
 * Va todo en un lote para que no pueda quedar a medias. Devuelve el id del hogar.
 */
export async function createHousehold(params: {
  uid: string;
  name: string;
  icon: string;
  profile: MemberProfile;
}): Promise<string> {
  const { uid, name, icon, profile } = params;
  const newHousehold = doc(collection(db, 'households'));
  const batch = writeBatch(db);
  batch.set(newHousehold, {
    name,
    icon,
    memberIds: [uid],
    enabledModules: {},
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  batch.set(memberRef(newHousehold.id, uid), {
    ...profile,
    pushTokens: [],
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid), { householdId: newHousehold.id }, { merge: true });
  await duringMembershipWrite(() => batch.commit());
  return newHousehold.id;
}

export function watchHousehold(
  hid: string,
  onChange: (household: Household | null) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    householdRef(hid),
    (snapshot) => {
      onChange(snapshot.exists() ? toHousehold(snapshot.id, snapshot.data()) : null);
    },
    onError,
  );
}

export function watchMembers(
  hid: string,
  onChange: (members: Member[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    collection(db, 'households', hid, 'members'),
    (snapshot) => {
      onChange(snapshot.docs.map((memberDoc) => toMember(memberDoc.id, memberDoc.data())));
    },
    onError,
  );
}

export async function updateHousehold(
  hid: string,
  changes: { name?: string; icon?: string },
): Promise<void> {
  await updateDoc(householdRef(hid), changes);
}

export async function setHouseholdModuleEnabled(
  hid: string,
  moduleId: string,
  enabled: boolean,
): Promise<void> {
  await updateDoc(householdRef(hid), { [`enabledModules.${moduleId}`]: enabled });
}

export async function updateMemberProfile(
  hid: string,
  uid: string,
  changes: Partial<MemberProfile>,
): Promise<void> {
  await updateDoc(memberRef(hid, uid), changes);
}

/**
 * Guarda solo las preferencias que cambian, campo a campo: así dos cambios seguidos
 * (o hechos desde dos móviles) no se pisan entre sí.
 */
export async function updateNotifyPrefs(
  hid: string,
  uid: string,
  changes: Partial<NotifyPrefs>,
): Promise<void> {
  const fields = Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [`notify.${key}`, value]),
  );
  await updateDoc(memberRef(hid, uid), fields);
}

/** Apunta el token de Expo Push de este móvil en la ficha del miembro. */
export async function addPushToken(hid: string, uid: string, token: string): Promise<void> {
  await updateDoc(memberRef(hid, uid), { pushTokens: arrayUnion(token) });
}

/**
 * Saca al usuario del hogar: lo quita de `memberIds`, borra su ficha de miembro y
 * deja su usuario sin hogar. Lo que hizo se queda en el historial, ya sin nombre.
 */
export async function leaveHousehold(hid: string, uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(householdRef(hid), { memberIds: arrayRemove(uid) });
  batch.delete(memberRef(hid, uid));
  batch.set(doc(db, 'users', uid), { householdId: null }, { merge: true });
  await duringMembershipWrite(() => batch.commit());
}
