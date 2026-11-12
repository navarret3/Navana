import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, minTouchSize, spacing } from './theme';

type OptionPickerProps = {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** `emoji` pinta cada opción como texto; `color`, como un círculo de ese color. */
  kind: 'emoji' | 'color';
};

/** Fila de opciones redondas para elegir un emoji o un color. */
export function OptionPicker({ label, options, value, onChange, kind }: OptionPickerProps) {
  return (
    <View style={styles.root}>
      <Text variant="label" color="inkSoft">
        {label}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.options}>
        {options.map((option) => {
          const selected = option.toUpperCase() === value.toUpperCase();
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={[styles.option, selected && styles.selected]}>
              {kind === 'emoji' ? (
                <Text style={styles.emoji}>{option}</Text>
              ) : (
                <View style={[styles.swatch, { backgroundColor: option }]} />
              )}
            </Pressable>
          );
        })}
      </View>
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
    gap: spacing.xs,
  },
  option: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 32,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
