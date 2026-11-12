import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { dateKeyToLocalDate, toDateKey, yearMonthOf, type DateKey } from '@/domain/dates';

import { MonthGrid } from './MonthGrid';
import { Text } from './Text';
import { colors, maxContentWidth, minTouchSize, radii, shadows, spacing } from './theme';

type DateFieldProps = {
  label: string;
  value: DateKey;
  onChange: (value: DateKey) => void;
  /** Mensaje de error; pinta el borde en rojo. */
  error?: string | null;
};

/** Campo de fecha: muestra el día elegido y, al tocarlo, abre un calendario para cambiarlo. */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => yearMonthOf(value));

  const formatted = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateKeyToLocalDate(value));

  const show = () => {
    setMonth(yearMonthOf(value));
    setOpen(true);
  };

  return (
    <View style={styles.root}>
      <Text variant="label" color="inkSoft">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatted}`}
        onPress={show}
        style={({ pressed }) => [styles.field, !!error && styles.invalid, pressed && styles.pressed]}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.value}>{formatted.charAt(0).toUpperCase() + formatted.slice(1)}</Text>
      </Pressable>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel={label} style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Tocar dentro del calendario no debe cerrarlo. */}
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <MonthGrid
              month={month}
              onChangeMonth={setMonth}
              today={toDateKey(new Date())}
              selected={value}
              onSelect={(date) => {
                onChange(date);
                setOpen(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  field: {
    minHeight: minTouchSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  invalid: {
    borderColor: colors.danger,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  icon: {
    fontSize: 18,
    lineHeight: 24,
  },
  value: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(67, 52, 43, 0.35)',
  },
  sheet: {
    width: '100%',
    maxWidth: maxContentWidth - spacing.xxl,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.raised,
  },
});
