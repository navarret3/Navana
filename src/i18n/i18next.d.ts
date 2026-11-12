import 'i18next';

import type es from './locales/es.json';

// Tipa las claves de `t()` a partir del español, que es el idioma de referencia.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof es;
    };
  }
}
