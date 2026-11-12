import { Appearance, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Tokens de diseño de Navana: paleta cálida (crema, melocotón y salvia) en claro y en
 * oscuro, y tipografía redondeada (Nunito). El resto del kit solo usa estos valores.
 */

/** Paleta clara: crema, melocotón y salvia. */
const lightColors = {
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

  danger: '#C8553D',

  // Texto sobre colores que no cambian con el tema
  /** Sobre melocotón (botones, día elegido) y sobre los colores de los miembros. */
  onPeach: '#43342B',
  /** Sobre rojo. */
  onDanger: '#FFFFFF',
  white: '#FFFFFF',

  // Avisos flotantes ("Hecho: …  Deshacer"): van en contraste con el fondo.
  banner: '#43342B',
  onBanner: '#FFFDF8',
  bannerAccent: '#F6A77C',
};

type Palette = Record<keyof typeof lightColors, string>;

/** Paleta oscura: los mismos tonos cálidos sobre marrón muy oscuro. */
const darkColors: Palette = {
  background: '#1F1A17',
  surface: '#2A2420',
  surfaceSunken: '#362E29',
  border: '#4A3E36',

  peach: '#F6A77C',
  peachDeep: '#F4B592',
  peachSoft: '#4E382D',

  sage: '#7FA07A',
  sageDeep: '#A8C3A0',
  sageSoft: '#2F3A2D',

  ink: '#F3E9DC',
  inkSoft: '#C7B8A9',
  inkMuted: '#928273',

  danger: '#E5735B',

  onPeach: '#43342B',
  onDanger: '#FFFFFF',
  white: '#FFFFFF',

  banner: '#F3E9DC',
  onBanner: '#2A2420',
  bannerAccent: '#D96F42',
};

/**
 * El tema sigue al del sistema. Se decide una vez, al arrancar la app: los estilos se
 * crean con estos valores, así que un cambio de tema del sistema se ve al reabrirla.
 */
export const isDark = Appearance.getColorScheme() === 'dark';

export const colors: Palette = isDark ? darkColors : lightColors;

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
