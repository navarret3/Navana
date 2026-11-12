import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  signInAsTestUser,
  signInWithGoogle,
  testUsers,
  type SignInResult,
} from '@/data/signIn';
import { Button, Card, Screen, Text, colors, spacing } from '@/ui';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // Detalle técnico del fallo; solo se enseña en desarrollo.
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const run = async (signIn: () => Promise<SignInResult>) => {
    setBusy(true);
    setFailed(false);
    setErrorDetail(null);
    try {
      await signIn();
      // Si entra, la sesión cambia y el router sale de esta pantalla por su cuenta.
    } catch (error) {
      console.warn('No se ha podido iniciar sesión', error);
      const code = (error as { code?: unknown }).code;
      const message = error instanceof Error ? error.message : String(error);
      setErrorDetail(typeof code === 'string' ? `${code}: ${message}` : message);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🐱</Text>
        </View>
        <Text variant="display" center>
          {t('common.appName')}
        </Text>
        <Text color="inkSoft" center>
          {t('auth.tagline')}
        </Text>
      </View>

      <View style={styles.actions}>
        {testUsers.length > 0 ? (
          <Card tone="sage">
            <Text variant="heading">{t('auth.testUsersTitle')}</Text>
            <Text variant="caption" color="inkSoft">
              {t('auth.testUsersHint')}
            </Text>
            {testUsers.map((user) => (
              <Button
                key={user.id}
                variant="secondary"
                label={t('auth.signInAs', { name: user.name })}
                disabled={busy}
                onPress={() => run(() => signInAsTestUser(user))}
              />
            ))}
          </Card>
        ) : (
          <Button label={t('auth.google')} loading={busy} onPress={() => run(signInWithGoogle)} />
        )}
        {failed ? (
          <Text variant="caption" color="danger" center>
            {t('auth.error')}
          </Text>
        ) : null}
        {__DEV__ && failed && errorDetail ? (
          <Text variant="caption" color="inkMuted" center selectable>
            {errorDetail}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: {
    fontSize: 60,
    lineHeight: 76,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
});
