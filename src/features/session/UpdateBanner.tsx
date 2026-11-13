import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppUpdate } from '@/updates/appUpdate';
import { Button, Text, colors, maxContentWidth, radii, shadows, spacing } from '@/ui';

/**
 * Aviso de que hay una versión nueva descargada. Al abrir la app salta un popup que pide
 * actualizar; al aceptar, la app se reinicia ya con ella. Sin esto habría que cerrarla del
 * todo y volver a abrirla, y no se sabría qué versión se está viendo.
 *
 * Quien elige "Más tarde" se queda con una franja arriba para actualizar cuando quiera.
 */
export function UpdateBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { pending, restart } = useAppUpdate();
  const [postponed, setPostponed] = useState(false);

  if (!pending) return null;

  if (!postponed) {
    return (
      <Modal
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setPostponed(true)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityRole="alert">
            <Text style={styles.dialogIcon}>✨</Text>
            <Text variant="title" center>
              {t('updates.title')}
            </Text>
            <Text color="inkSoft" center>
              {t('updates.body')}
            </Text>
            <View style={styles.actions}>
              <Button label={t('updates.now')} onPress={restart} />
              <Button variant="ghost" label={t('updates.later')} onPress={() => setPostponed(true)} />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={[styles.wrapper, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('updates.ready')} ${t('updates.restart')}`}
        onPress={restart}
        style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
        <Text style={styles.icon}>✨</Text>
        <Text color="onBanner" style={styles.message}>
          {t('updates.ready')}
        </Text>
        <Text variant="bodyStrong" color="bannerAccent">
          {t('updates.restart')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dialog: {
    width: '100%',
    maxWidth: maxContentWidth - spacing.xl * 2,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.raised,
  },
  dialogIcon: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  banner: {
    width: '100%',
    maxWidth: maxContentWidth - spacing.lg * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.banner,
    ...shadows.raised,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 18,
    lineHeight: 24,
  },
  message: {
    flex: 1,
  },
});
