import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, minTouchSize, spacing } from './theme';

type ListRowProps = {
  icon?: string;
  title: string;
  subtitle?: string;
  /** Contenido a la derecha: un interruptor, un valor, una flecha… */
  trailing?: ReactNode;
  onPress?: () => void;
};

export function ListRow({ icon, title, subtitle, trailing, onPress }: ListRowProps) {
  const content = (
    <>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <View style={styles.texts}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="inkSoft">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  icon: {
    fontSize: 24,
    lineHeight: 32,
    width: 32,
    textAlign: 'center',
  },
  texts: {
    flex: 1,
  },
});
