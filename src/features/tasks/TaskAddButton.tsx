import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTasks } from '@/state/tasks';
import {
  BottomSheet,
  Text,
  colors,
  maxContentWidth,
  minTouchSize,
  radii,
  shadows,
  spacing,
} from '@/ui';

export function TaskAddButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasUndo = useTasks((state) => !!state.justCompleted);
  return (
    <>
      <View pointerEvents="box-none" style={[styles.position, hasUndo && styles.aboveUndo]}>
        <View pointerEvents="box-none" style={styles.inner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tasks.quick.add')}
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen(true)}
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
            <Text style={styles.plus}>＋</Text>
          </Pressable>
        </View>
      </View>
      <BottomSheet visible={open} title={t('tasks.quick.add')} onClose={() => setOpen(false)}>
        {(
          [
            { label: t('tasks.quick.oneOff'), icon: '✓', path: '/task/log' },
            { label: t('tasks.quick.recurring'), icon: '↻', path: '/task/new' },
          ] as const
        ).map((option) => (
          <Pressable
            key={option.path}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            onPress={() => {
              setOpen(false);
              router.push(option.path);
            }}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
            <View style={styles.optionIcon}>
              <Text variant="title" color="peachDeep">
                {option.icon}
              </Text>
            </View>
            <Text variant="bodyStrong" style={styles.label}>
              {option.label}
            </Text>
            <Text color="inkSoft">›</Text>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, bottom: spacing.lg, alignItems: 'center' },
  aboveUndo: { bottom: 80 },
  inner: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  plus: { fontSize: 30, lineHeight: 42, color: colors.onPeach },
  pressed: { transform: [{ scale: 0.95 }] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: minTouchSize + 24,
    borderRadius: radii.sm,
  },
  optionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.peachSoft,
    borderRadius: radii.sm,
  },
  label: { flex: 1 },
  optionPressed: { backgroundColor: colors.surfaceSunken },
});
