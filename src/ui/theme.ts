import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Tokens de diseño de Navana: paleta cálida (crema, melocotón y salvia)
 * y tipografía redondeada (Nunito). El resto del kit solo usa estos valores.
 */

export const colors = {
  // Fondos
  background: '#FBF3E4',
  surface: '#FFFDF8',
  surfaceSunken: '#F5E9D6',
  border: '#EBDDC8',

  // Melocotón: acción principal
  peach: '#F6A77C',
  peachDeep: '#D96F42',
  peachSoft: '#FDE3D3',

  // Salvia: hecho, positivo, calma
  sage: '#A8C3A0',
  sageDeep: '#5F8563',
  sageSoft: '#E3EEDD',

  // Texto
  ink: '#43342B',
  inkSoft: '#7C6A5E',
  inkMuted: '#A89A8E',
  onPeach: '#43342B',

  danger: '#C8553D',
} as const;

export type ColorName = keyof typeof colors;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** Nombres con los que se registran las fuentes en `app/_layout.tsx`. */
export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36 },
  title: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 23 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;

export const shadows = {
  card: {
    boxShadow: '0 2px 10px rgba(67, 52, 43, 0.07)',
  },
  raised: {
    boxShadow: '0 6px 18px rgba(67, 52, 43, 0.12)',
  },
} as const satisfies Record<string, ViewStyle>;

/** Ancho máximo del contenido; solo se nota en la vista web de desarrollo. */
export const maxContentWidth = 560;

/** Área táctil mínima recomendada en Android. */
export const minTouchSize = 48;
