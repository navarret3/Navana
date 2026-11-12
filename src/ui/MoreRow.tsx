import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, minTouchSize, radii, spacing } from './theme';

type MoreRowProps = {
  label: string;
  /** Qué hay dentro, para saber si merece la pena abrirlo. */
  hint?: string;
  icon?: string;
  onPress: () => void;
};

/** Fila que despliega la parte de un formulario que casi nunca hace falta tocar. */
export function MoreRow({ label, hint, icon, onPress }: MoreRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <View style={styles.texts}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? (
          <Text variant="caption" color="inkSoft">
            {hint}
          </Text>
        ) : null}
      </View>
      <Text color="inkMuted">›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchSize + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    fontSize: 22,
    lineHeight: 28,
    width: 28,
    textAlign: 'center',
  },
  texts: {
    flex: 1,
  },
});
