/** Invitaciones a un hogar: un código corto que también viaja dentro de un enlace. */

export const INVITE_CODE_LENGTH = 6;

/** Sin 0/O ni 1/I, que se confunden al dictar o copiar el código. */
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const INVITE_TTL_DAYS = 7;

const INVITE_LINK_PREFIX = 'navana://join/';

export function generateInviteCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET.charAt(Math.floor(random() * INVITE_ALPHABET.length));
  }
  return code;
}

/**
 * Acepta lo que la gente pega: el código con espacios o guiones, en minúsculas,
 * o el enlace entero. Devuelve el código limpio o `null` si no tiene forma de código.
 */
export function normalizeInviteCode(input: string): string | null {
  const trimmed = input.trim();
  const fromLink = trimmed.toLowerCase().startsWith(INVITE_LINK_PREFIX)
    ? trimmed.slice(INVITE_LINK_PREFIX.length)
    : trimmed;
  const code = fromLink.replace(/[\s-]/g, '').toUpperCase();
  if (code.length !== INVITE_CODE_LENGTH) return null;
  for (const char of code) {
    if (!INVITE_ALPHABET.includes(char)) return null;
  }
  return code;
}

export function buildInviteLink(code: string): string {
  return `${INVITE_LINK_PREFIX}${code}`;
}

export function inviteExpiry(now: Date): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isInviteExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}
