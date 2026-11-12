import type { ExpoConfig } from 'expo/config';
import { readFileSync } from 'node:fs';

/** Proyecto @0nly/navana en EAS (creado con `eas init`). */
const EAS_OWNER = '0nly';
const EAS_PROJECT_ID = '16ae9b40-ad95-45f5-9c2c-51445070fdfe';

// En EAS llega como variable de entorno de tipo fichero; en local, el fichero de la raíz.
const GOOGLE_SERVICES_FILE = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';

type GoogleServices = {
  client?: { oauth_client?: { client_id?: string; client_type?: number }[] }[];
};

/**
 * ID del cliente OAuth de tipo web (client_type 3). Google Sign-In lo necesita para
 * devolver el token con el que se entra en Firebase Auth. No es un secreto.
 */
function readGoogleWebClientId(): string | undefined {
  try {
    const services = JSON.parse(readFileSync(GOOGLE_SERVICES_FILE, 'utf8')) as GoogleServices;
    return services.client
      ?.flatMap((client) => client.oauth_client ?? [])
      .find((oauth) => oauth.client_type === 3)?.client_id;
  } catch {
    // Sin el fichero (por ejemplo, en la vista web con emuladores) no hace falta.
    return undefined;
  }
}

const colors = {
  cream: '#FBF3E4',
  darkBackground: '#1F1A17',
  peach: '#F6A77C',
};

const config: ExpoConfig = {
  name: 'Navana',
  slug: 'navana',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'navana',
  icon: './assets/images/icon.png',
  // Claro u oscuro, según el sistema.
  userInterfaceStyle: 'automatic',
  backgroundColor: colors.cream,
  android: {
    package: 'com.navana.app',
    googleServicesFile: GOOGLE_SERVICES_FILE,
    adaptiveIcon: {
      backgroundColor: colors.peach,
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    // La web es solo una vista de desarrollo contra los emuladores, no un producto.
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: colors.cream,
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
        dark: { backgroundColor: colors.darkBackground },
      },
    ],
    'expo-localization',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-google-signin/google-signin',
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: colors.peach,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  runtimeVersion: { policy: 'appVersion' },
  owner: EAS_OWNER,
  updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
  extra: {
    eas: { projectId: EAS_PROJECT_ID },
    googleWebClientId: readGoogleWebClientId(),
  },
};

export default config;
