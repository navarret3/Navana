import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SHOPPING_CATEGORIES } from '@/domain/shopping/categories';
import { categoryIcon, productIcon } from '@/domain/shopping/icons';
import { frequentProducts, groupByCategory, recentProducts } from '@/domain/shopping/suggest';
import type { ShoppingItem } from '@/domain/shopping/types';
import { AddBar } from '@/features/shopping/AddBar';
import { ShoppingItemRow } from '@/features/shopping/ShoppingItemRow';
import { useShoppingActions } from '@/features/shopping/useShoppingActions';
import { useShopping } from '@/state/shopping';
import {
  ActionSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  Text,
  colors,
  maxContentWidth,
  spacing,
} from '@/ui';

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const items = useShopping((state) => state.items);
  const catalog = useShopping((state) => state.catalog);
  const { add, toggle, remove, changeCategory, finish } = useShoppingActions();

  /** Producto cuyo menú de opciones está abierto. */
  const [selected, setSelected] = useState<ShoppingItem | null>(null);
  /** Producto al que se le está eligiendo sección. Va aparte: el primer menú se cierra antes. */
  const [recategorizing, setRecategorizing] = useState<ShoppingItem | null>(null);

  const pending = items.filter((item) => !item.checked);
  const checked = items
    .filter((item) => item.checked)
    .sort((a, b) => a.name.localeCompare(b.name));
  const groups = groupByCategory(pending);
  const frequent = frequentProducts(catalog, items);
  const recent = recentProducts(catalog, items, frequent);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* La cabecera y la barra de añadir no se desplazan: siempre están a mano. */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            {t('shopping.title')}
          </Text>
          {pending.length > 0 ? (
            <Text variant="caption" color="inkSoft">
              {t('shopping.pendingCount', { count: pending.length })}
            </Text>
          ) : null}
        </View>
        <AddBar />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {[
            { key: 'frequent', label: t('shopping.frequent'), entries: frequent },
            { key: 'recent', label: t('shopping.recent'), entries: recent },
          ]
            .filter((group) => group.entries.length > 0)
            .map((group) => (
              <View key={group.key} style={styles.frequent}>
                <Text variant="label" color="inkSoft">
                  {group.label}
                </Text>
                <View style={styles.chips}>
                  {group.entries.map((entry) => (
                    <Chip
                      key={entry.key}
                      role="button"
                      icon={productIcon(entry.name, entry.categoryId)}
                      label={entry.name}
                      onPress={() => add(entry.name, entry.categoryId)}
                    />
                  ))}
                </View>
              </View>
            ))}

          {items.length === 0 ? (
            <EmptyState
              icon="🛒"
              title={t('shopping.empty.title')}
              description={t('shopping.empty.description')}
            />
          ) : null}

          {groups.map((group) => (
            <Card key={group.categoryId}>
              <Text variant="heading">
                {categoryIcon(group.categoryId)} {t(`shopping.categories.${group.categoryId}`)}
              </Text>
              {group.items.map((item) => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  onToggle={toggle}
                  onOptions={setSelected}
                />
              ))}
            </Card>
          ))}

          {checked.length > 0 ? (
            <Card tone="sage">
              <Text variant="heading">
                {pending.length === 0 ? `🎉 ${t('shopping.allChecked')}` : null}
                {pending.length === 0 ? '\n' : null}
                {t('shopping.checkedTitle', { count: checked.length })}
              </Text>
              {checked.map((item) => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  onToggle={toggle}
                  onOptions={setSelected}
                />
              ))}
              <Button label={t('shopping.finish')} onPress={finish} />
              <Text variant="caption" color="inkSoft" center>
                {t('shopping.finishHint')}
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>

      <ActionSheet
        visible={selected !== null}
        title={selected?.name ?? ''}
        onClose={() => setSelected(null)}
        options={[
          { label: t('shopping.changeCategory'), onPress: () => setRecategorizing(selected) },
          {
            label: t('shopping.remove'),
            destructive: true,
            onPress: () => selected && remove(selected),
          },
        ]}
      />
      <ActionSheet
        visible={recategorizing !== null}
        title={t('shopping.chooseCategory')}
        onClose={() => setRecategorizing(null)}
        options={SHOPPING_CATEGORIES.map((category) => ({
          label: `${category.icon}  ${t(`shopping.categories.${category.id}`)}`,
          onPress: () => recategorizing && changeCategory(recategorizing, category.id),
        }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  frequent: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
