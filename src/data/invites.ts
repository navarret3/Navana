import {
  arrayUnion,
  db,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from '@/data/fb';
import { duringMembershipWrite } from '@/data/membershipWrites';
import type { MemberProfile } from '@/domain/household';
import { generateInviteCode, inviteExpiry, isInviteExpired } from '@/domain/invites';

export type Invite = {
  code: string;
  householdId: string;
  householdName: string;
  expiresAt: Date;
};

export type JoinErrorReason = 'notFound' | 'expired';

/** Fallo esperable al unirse: el código no existe o ya ha caducado. */
export class JoinError extends Error {
  constructor(readonly reason: JoinErrorReason) {
    super(`No se puede usar la invitación: ${reason}`);
    this.name = 'JoinError';
  }
}

const inviteRef = (code: string) => doc(db, 'invites', code);

const CREATE_ATTEMPTS = 3;

/** Crea una invitación nueva para el hogar, válida durante unos días. */
export async function createInvite(params: {
  householdId: string;
  householdName: string;
  uid: string;
}): Promise<Invite> {
  const expiresAt = inviteExpiry(new Date());
  let lastError: unknown;
  // Si el código ya existiera, las reglas rechazan sobrescribirlo: se prueba con otro.
  for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt++) {
    const code = generateInviteCode();
    try {
      await setDoc(inviteRef(code), {
        householdId: params.householdId,
        householdName: params.householdName,
        createdBy: params.uid,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });
      return {
        code,
        householdId: params.householdId,
        householdName: params.householdName,
        expiresAt,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function getInvite(code: string): Promise<Invite | null> {
  const snapshot = await getDoc(inviteRef(code));
  const data = snapshot.data();
  if (!snapshot.exists() || !data) return null;
  return {
    code,
    householdId: String(data.householdId),
    householdName: typeof data.householdName === 'string' ? data.householdName : '',
    expiresAt: (data.expiresAt as { toDate: () => Date }).toDate(),
  };
}

/**
 * Une al usuario al hogar de la invitación. En un solo lote: se añade a `memberIds`,
 * crea su ficha de miembro (con el código, que es lo que validan las reglas) y
 * apunta el hogar en su usuario.
 */
export async function joinHousehold(params: {
  code: string;
  uid: string;
  profile: MemberProfile;
}): Promise<Invite> {
  const { code, uid, profile } = params;
  const invite = await getInvite(code);
  if (!invite) throw new JoinError('notFound');
  if (isInviteExpired(invite.expiresAt, new Date())) throw new JoinError('expired');

  const batch = writeBatch(db);
  batch.update(doc(db, 'households', invite.householdId), { memberIds: arrayUnion(uid) });
  batch.set(doc(db, 'households', invite.householdId, 'members', uid), {
    ...profile,
    pushTokens: [],
    inviteCode: code,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid), { householdId: invite.householdId }, { merge: true });
  await duringMembershipWrite(() => batch.commit());
  return invite;
}
