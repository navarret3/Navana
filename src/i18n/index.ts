import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

/** Para añadir un idioma: crear `locales/<código>.json` y registrarlo aquí. */
export const resources = {
  es: { translation: es },
  en: { translation: en },
} as const;

export type AppLanguage = keyof typeof resources;

export const fallbackLanguage: AppLanguage = 'es';

/** Cada idioma, escrito en ese idioma: así se reconoce aunque la app esté en otro. */
export const languageNames: Record<AppLanguage, string> = {
  es: 'Español',
  en: 'English',
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && value in resources;
}

function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  return code && code in resources ? (code as AppLanguage) : fallbackLanguage;
}

const i18n = createInstance();

// Los recursos van incluidos en el bundle, así que la inicialización es síncrona.
void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: fallbackLanguage,
  interpolation: { escapeValue: false },
});

/**
 * Pone la app en un idioma. Con `null` vuelve al del móvil, que es el que se usa mientras
 * la persona no elige uno en su perfil.
 */
export function setAppLanguage(language: AppLanguage | null): void {
  const next = language ?? deviceLanguage();
  if (i18n.language !== next) void i18n.changeLanguage(next);
}

export default i18n;
