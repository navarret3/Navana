import '@/i18n';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LoadingScreen } from '@/features/session/LoadingScreen';
import { NoticeBanner } from '@/features/session/NoticeBanner';
import { startSessionListener, useSession } from '@/state/session';
import { colors, isDark } from '@/ui';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  // Si las fuentes fallan seguimos con la del sistema antes que dejar la app en blanco.
  const fontsReady = fontsLoaded || fontError != null;
  const status = useSession((state) => state.status);

  useEffect(() => startSessionListener(), []);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {status === 'loading' ? (
        <LoadingScreen />
      ) : (
        // Cada estado de la sesión deja a la vista solo sus pantallas; al cambiar,
        // el router lleva sola a la primera disponible.
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Protected guard={status === 'ready'}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="task" />
            <Stack.Screen name="event" />
            <Stack.Screen name="note" />
            <Stack.Screen name="meal" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'needsHousehold'}>
            <Stack.Screen name="(onboarding)/create-or-join" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="(auth)/sign-in" />
          </Stack.Protected>
          <Stack.Screen name="join/[code]" />
        </Stack>
      )}
      <NoticeBanner />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
