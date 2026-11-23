import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField, colors, minTouchSize, radii, spacing } from '@/ui';

type Option = { value: string; label: string; detail?: string };
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function StatisticsPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected =
    options.find((option) => option.value === value)?.label ?? t('tasks.statistics.unavailable');
  const matching = options.filter((option) => normalize(option.label).includes(normalize(search)));
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected}`}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
        <View style={styles.grow}>
          <Text variant="label" color="inkSoft">
            {label}
          </Text>
          <Text variant="bodyStrong" numberOfLines={2}>
            {selected}
          </Text>
        </View>
        <Text color="inkSoft">⌄</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Screen scroll={false} edges={['top', 'bottom']}>
          <View style={styles.row}>
            <Text variant="title" accessibilityRole="header" style={styles.grow}>
              {label}
            </Text>
            <Button variant="ghost" label={t('common.cancel')} onPress={() => setOpen(false)} />
          </View>
          <TextField
            label={t('tasks.statistics.search')}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          <FlatList
            data={matching}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text color="inkSoft">{t('tasks.statistics.noOptions')}</Text>}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: item.value === value }}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  item.value === value && styles.selected,
                  pressed && styles.pressed,
                ]}>
                <Text variant="bodyStrong">{item.label}</Text>
                {item.detail ? (
                  <Text variant="caption" color="inkSoft">
                    {item.detail}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
        </Screen>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  option: {
    minHeight: minTouchSize,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  selected: { backgroundColor: colors.peachSoft },
  pressed: { opacity: 0.75 },
});
