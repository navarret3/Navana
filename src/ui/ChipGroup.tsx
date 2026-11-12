import { StyleSheet, View } from 'react-native';

import { Chip } from './Chip';
import { Text } from './Text';
import { spacing } from './theme';

type ChipGroupProps<T extends string | number> = {
  label?: string;
  options: readonly { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
};

/** Grupo de pastillas en el que hay exactamente una elegida. */
export function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hint,
}: ChipGroupProps<T>) {
  return (
    <View style={styles.root}>
      {label ? (
        <Text variant="label" color="inkSoft">
          {label}
        </Text>
      ) : null}
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.options}>
        {options.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            icon={option.icon}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {hint ? (
        <Text variant="caption" color="inkSoft">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
