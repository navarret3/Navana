import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from './BottomSheet';
import { Text } from './Text';
import { colors, minTouchSize, radii, spacing } from './theme';

type Option<T> = { value: T; label: string; icon?: string; description?: string };

/** Una selección visible; las alternativas solo aparecen al abrir el campo. */
export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={styles.root}>
      <Text variant="label" color="inkSoft">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? ''}`}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
        {selected?.icon ? <Text>{selected.icon}</Text> : null}
        <Text style={styles.value}>{selected?.label}</Text>
        <Text color="inkSoft">⌄</Text>
      </Pressable>
      {hint ? (
        <Text variant="caption" color="inkSoft">
          {hint}
        </Text>
      ) : null}
      <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
        <View accessibilityRole="radiogroup" accessibilityLabel={label}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: value === option.value }}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
              {option.icon ? <Text>{option.icon}</Text> : null}
              <View style={styles.value}>
                <Text variant={value === option.value ? 'bodyStrong' : 'body'}>{option.label}</Text>
                {option.description ? (
                  <Text variant="caption" color="inkSoft">
                    {option.description}
                  </Text>
                ) : null}
              </View>
              {value === option.value ? <Text color="peachDeep">✓</Text> : null}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  field: {
    minHeight: minTouchSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  value: { flex: 1 },
  option: {
    minHeight: minTouchSize + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
});
