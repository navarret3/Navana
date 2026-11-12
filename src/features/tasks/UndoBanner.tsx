import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTasks } from '@/state/tasks';
import { Text, colors, maxContentWidth, radii, shadows, spacing } from '@/ui';

import { useTaskActions } from './useTaskActions';

const VISIBLE_MS = 6000;

/** Aviso breve tras completar una tarea, con la opción de deshacer. */
export function UndoBanner() {
  const { t } = useTranslation();
  const justCompleted = useTasks((state) => state.justCompleted);
  const setJustCompleted = useTasks((state) => state.setJustCompleted);
  const { undo } = useTaskActions();

  useEffect(() => {
    if (!justCompleted) return;
    const timer = setTimeout(() => setJustCompleted(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [justCompleted, setJustCompleted]);

  if (!justCompleted) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View accessibilityLiveRegion="polite" style={styles.banner}>
        <Text color="onBanner" numberOfLines={1} style={styles.message}>
          {t('tasks.actions.done', { title: justCompleted.title })}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={spacing.sm}
          onPress={() => undo(justCompleted)}>
          <Text variant="bodyStrong" color="bannerAccent">
            {t('tasks.actions.undo')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.md,
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
  message: {
    flex: 1,
  },
});
