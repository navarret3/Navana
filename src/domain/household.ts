/** Tipos y reglas sencillas del hogar y sus miembros. Sin React ni Firebase. */

export type Household = {
  id: string;
  name: string;
  icon: string;
  memberIds: string[];
  /** Módulos activados o desactivados a mano; los que falten usan su valor por defecto. */
  enabledModules: Partial<Record<string, boolean>>;
};

/**
 * Qué avisos quiere recibir un miembro. Van en su ficha del hogar (y no en su usuario)
 * porque el móvil del otro tiene que poder leerlos antes de mandarle un aviso.
 */
export type NotifyPrefs = {
  /** Por la mañana, lo que le toca ese día. */
  dailySummary: boolean;
  /** Hora local del resumen, de 0 a 23. */
  summaryHour: number;
  /** Por la tarde, si tiene tareas atrasadas. */
  overdue: boolean;
  /** Cuando otra persona del hogar completa una tarea. */
  partnerCompleted: boolean;
  /** Cuando alguien le da un toque por una tarea. */
  nudges: boolean;
};

export const DEFAULT_NOTIFY_PREFS: NotifyPrefs = {
  dailySummary: true,
  summaryHour: 9,
  overdue: true,
  partnerCompleted: true,
  nudges: true,
};

export type Member = {
  uid: string;
  name: string;
  /** Color con el que se le distingue en tareas y balances. */
  color: string;
  /** Emoji que hace de avatar. */
  avatar: string;
  notify: NotifyPrefs;
  /** Tokens de Expo Push de sus móviles. Solo los leen los miembros del hogar. */
  pushTokens: string[];
};

export type MemberProfile = Pick<Member, 'name' | 'color' | 'avatar'>;

export const HOUSEHOLD_NAME_MAX = 40;
export const MEMBER_NAME_MAX = 30;

export const HOUSEHOLD_ICONS = ['🏠', '🏡', '🛋️', '🪴', '🐾', '☕', '🌈', '🍳'] as const;
export const DEFAULT_HOUSEHOLD_ICON = HOUSEHOLD_ICONS[0];

export const MEMBER_AVATARS = [
  '🐱',
  '😺',
  '😸',
  '😻',
  '🐈',
  '🦊',
  '🐻',
  '🐼',
  '🐰',
  '🐶',
  '🦉',
  '🐸',
] as const;
export const DEFAULT_MEMBER_AVATAR = MEMBER_AVATARS[0];

export const MEMBER_COLORS = [
  '#F6A77C', // melocotón
  '#A8C3A0', // salvia
  '#F2C66D', // miel
  '#B9A5D6', // lavanda
  '#8FBFD9', // cielo
  '#E99BB0', // rosa
  '#D9B38C', // canela
  '#9ED1C2', // menta
] as const;

/** Recorta espacios sobrantes y limita la longitud de un nombre escrito a mano. */
export function cleanName(input: string, maxLength: number): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Primer color que nadie usa todavía; si están todos cogidos, vuelve a empezar. */
export function pickMemberColor(takenColors: readonly string[]): string {
  const taken = new Set(takenColors.map((color) => color.toUpperCase()));
  return MEMBER_COLORS.find((color) => !taken.has(color.toUpperCase())) ?? MEMBER_COLORS[0];
}

/** Nombre de pila para saludar y para el perfil inicial: "Ana García" → "Ana". */
export function firstName(displayName: string | null | undefined): string {
  const first = (displayName ?? '').trim().split(/\s+/)[0] ?? '';
  return cleanName(first, MEMBER_NAME_MAX);
}
