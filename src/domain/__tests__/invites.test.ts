import {
  INVITE_CODE_LENGTH,
  buildInviteLink,
  generateInviteCode,
  inviteExpiry,
  isInviteExpired,
  normalizeInviteCode,
} from '@/domain/invites';

describe('generateInviteCode', () => {
  it('genera códigos de 6 caracteres sin letras ni números ambiguos', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(INVITE_CODE_LENGTH);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    }
  });

  it('es determinista con la misma fuente de azar', () => {
    const sequence = [0, 0.99, 0.5, 0.25, 0.75, 0.1];
    let i = 0;
    expect(generateInviteCode(() => sequence[i++ % sequence.length]!)).toBe('A9SJ2D');
  });

  it('todo código generado se normaliza a sí mismo', () => {
    const code = generateInviteCode();
    expect(normalizeInviteCode(code)).toBe(code);
  });
});

describe('normalizeInviteCode', () => {
  it.each([
    ['k7m4qx', 'K7M4QX'],
    ['  K7M 4QX ', 'K7M4QX'],
    ['k7m-4qx', 'K7M4QX'],
    ['navana://join/K7M4QX', 'K7M4QX'],
    ['NAVANA://join/k7m4qx', 'K7M4QX'],
  ])('acepta %s', (input, expected) => {
    expect(normalizeInviteCode(input)).toBe(expected);
  });

  it.each(['', 'K7M4Q', 'K7M4QXX', 'K7M4Q0', 'K7M4QI', 'K7M4Q!', 'https://example.com/K7M4QX'])(
    'rechaza "%s"',
    (input) => {
      expect(normalizeInviteCode(input)).toBeNull();
    },
  );
});

describe('enlace y caducidad', () => {
  it('el enlace se puede volver a convertir en código', () => {
    expect(normalizeInviteCode(buildInviteLink('K7M4QX'))).toBe('K7M4QX');
  });

  it('caduca a los 7 días', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    const expiresAt = inviteExpiry(now);
    expect(expiresAt.toISOString()).toBe('2026-11-19T10:00:00.000Z');
    expect(isInviteExpired(expiresAt, now)).toBe(false);
    expect(isInviteExpired(expiresAt, new Date('2026-11-19T09:59:59Z'))).toBe(false);
    expect(isInviteExpired(expiresAt, new Date('2026-11-19T10:00:00Z'))).toBe(true);
  });
});
