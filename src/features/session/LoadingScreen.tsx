import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { signOutEverywhere } from '@/data/signIn';
import { useSession } from '@/state/session';
import { Button, Text, colors, spacing } from '@/ui';

/** A partir de aquí la espera ya no es normal y se ofrece una salida. */
const SLOW_AFTER_MS = 8000;

/**
 * Pantalla de espera mientras se averigua quién hay y cuál es su hogar.
 *
 * Normalmente dura un instante. Si se alarga (sin conexión en un móvil nuevo, o una
 * sesión guardada que el servidor ya no reconoce), se explica y se deja cerrar sesión
 * para no dejar a nadie atrapado en un indicador de carga.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const hasUser = useSession((state) => state.user !== null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={colors.peachDeep} />
      {slow ? (
        <View style={styles.help}>
          <Text color="inkSoft" center>
            {t('common.loadingSlow')}
          </Text>
          {hasUser ? (
            <Button
              variant="secondary"
              label={t('auth.signOut')}
              onPress={() => signOutEverywhere()}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  help: {
    gap: spacing.md,
    maxWidth: 360,
  },
});
