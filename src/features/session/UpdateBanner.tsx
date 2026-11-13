import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppUpdate } from '@/updates/appUpdate';
import { Text, colors, maxContentWidth, radii, shadows, spacing } from '@/ui';

/**
 * Aviso de que hay una versión nueva descargada. Sale arriba, sobre cualquier pantalla, y
 * al tocarlo la app se reinicia ya con ella: sin esto habría que cerrarla del todo y
 * volver a abrirla para verla.
 */
export function UpdateBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { pending, restart } = useAppUpdate();

  if (!pending) return null;

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
