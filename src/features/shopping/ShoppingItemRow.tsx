import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ShoppingItem } from '@/domain/shopping/types';
import { Text, colors, minTouchSize, radii, spacing } from '@/ui';

type ShoppingItemRowProps = {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onOptions: (item: ShoppingItem) => void;
};

/** Un producto de la lista: tocarlo lo tacha (o lo recupera); "⋯" abre sus opciones. */
export function ShoppingItemRow({ item, onToggle, onOptions }: ShoppingItemRowProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={
          item.checked
            ? t('shopping.uncheck', { name: item.name })
            : t('shopping.check', { name: item.name })
        }
        onPress={() => onToggle(item)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={[styles.box, item.checked && styles.boxChecked]}>
          {item.checked ? <Text style={styles.tick}>✓</Text> : null}
        </View>
        <Text
          color={item.checked ? 'inkMuted' : 'ink'}
          style={[styles.name, item.checked && styles.struck]}>
          {item.name}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('shopping.options', { name: item.name })}
        hitSlop={spacing.xs}
        onPress={() => onOptions(item)}
        style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
        <Text color="inkMuted" style={styles.moreIcon}>
          ⋯
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.sageDeep,
  },
  tick: {
    color: colors.surface,
    fontSize: 15,
    lineHeight: 19,
  },
  name: {
    flex: 1,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  more: {
    width: minTouchSize - 8,
    height: minTouchSize - 8,
    borderRadius: (minTouchSize - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
