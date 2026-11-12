import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es.json';

/** Para añadir un idioma: crear `locales/<código>.json` y registrarlo aquí. */
export const resources = {
  es: { translation: es },
} as const;

export type AppLanguage = keyof typeof resources;

export const fallbackLanguage: AppLanguage = 'es';

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

export default i18n;
