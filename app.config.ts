import type { ExpoConfig } from 'expo/config';

/**
 * ID del proyecto en EAS. Se obtiene con `npx eas-cli@latest init` y se pega aquí.
 * Mientras esté vacío no se configuran las actualizaciones OTA (EAS Update).
 */
const EAS_PROJECT_ID: string | undefined = undefined;

const colors = {
  cream: '#FBF3E4',
  peach: '#F6A77C',
};

const config: ExpoConfig = {
  name: 'Navana',
  slug: 'navana',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'navana',
  icon: './assets/images/icon.png',
  // El tema oscuro llega en la Fase 6.
  userInterfaceStyle: 'light',
  backgroundColor: colors.cream,
  android: {
    package: 'com.navana.app',
    // En EAS se puede subir como variable de entorno de tipo fichero (GOOGLE_SERVICES_JSON).
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
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
  ...(EAS_PROJECT_ID
    ? {
        updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
        extra: { eas: { projectId: EAS_PROJECT_ID } },
      }
    : {}),
};

export default config;
