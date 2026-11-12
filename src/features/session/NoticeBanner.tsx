import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotices } from '@/state/notices';
import { Text, colors, maxContentWidth, radii, shadows, spacing } from '@/ui';

const VISIBLE_MS = 7000;

/** Aviso de que un cambio no se ha guardado. Sale arriba, sobre cualquier pantalla. */
export function NoticeBanner() {
  const insets = useSafeAreaInsets();
  const notice = useNotices((state) => state.notice);
  const dismiss = useNotices((state) => state.dismiss);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, dismiss]);

  if (!notice) return null;

  return (
    <View style={[styles.wrapper, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        onPress={dismiss}
        style={styles.banner}>
        <Text style={styles.icon}>⚠️</Text>
        <Text color="onDanger" style={styles.message}>
          {notice.message}
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
    backgroundColor: colors.danger,
    ...shadows.raised,
  },
  icon: {
    fontSize: 18,
    lineHeight: 24,
  },
  message: {
    flex: 1,
  },
});
