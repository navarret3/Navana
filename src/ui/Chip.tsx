import { Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { colors, radii, spacing } from './theme';

type ChipProps = {
  label: string;
  icon?: string;
  selected?: boolean;
  /** `radio` cuando es una opción de un grupo; `button` cuando lanza una acción. */
  role?: 'radio' | 'button';
  onPress?: () => void;
  onLongPress?: () => void;
};

/** Pastilla seleccionable para elegir entre unas pocas opciones (zonas, modos…). */
export function Chip({
  label,
  icon,
  selected,
  role = 'radio',
  onPress,
  onLongPress,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={role === 'radio' ? { selected: !!selected } : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text variant="caption" color={selected ? 'ink' : 'inkSoft'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.peach,
    backgroundColor: colors.peachSoft,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    fontSize: 16,
    lineHeight: 22,
  },
});
