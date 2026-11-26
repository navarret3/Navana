import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setItemStore } from '@/data/shopping';
import { groupByStore } from '@/domain/shopping/stores';
import { newestFirst } from '@/domain/shopping/suggest';
import { AddBar } from '@/features/shopping/AddBar';
import { ShoppingItemRow } from '@/features/shopping/ShoppingItemRow';
import { useShoppingActions } from '@/features/shopping/useShoppingActions';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { useShopping } from '@/state/shopping';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  ChipGroup,
  EmptyState,
  Text,
  colors,
  maxContentWidth,
  spacing,
} from '@/ui';

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const items = useShopping((state) => state.items);
  const stores = useShopping((state) => state.stores);
  const hid = useSession((state) => state.household?.id);
  const { toggle, remove, finish } = useShoppingActions();

  const [choosingStore, setChoosingStore] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const activeStore = stores.find((store) => store.id === destination);
  const item = items.find((entry) => entry.id === itemId);
  const closePicker = () => {
    setChoosingStore(false);
    setItemId(null);
  };
  const itemStore = stores.find((store) => store.id === item?.storeId);
  const pending = newestFirst(items.filter((item) => !item.checked));
  const checked = items
    .filter((item) => item.checked)
    .sort((a, b) => a.name.localeCompare(b.name));
  const groups = groupByStore(pending, stores);

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
        <View style={styles.destination}>
          <Chip
            role="button"
            icon="🏪"
            label={activeStore
              ? t('shopping.stores.addTo', { name: activeStore.name })
              : t('shopping.stores.title')}
            onPress={() => setChoosingStore(true)}
          />
        </View>
        <AddBar storeId={activeStore?.id} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {items.length === 0 ? (
            <EmptyState
              icon="🛒"
              title={t('shopping.empty.title')}
              description={t('shopping.empty.description')}
            />
          ) : null}

          {groups.map((group) => (
            <Card key={group.store?.id ?? ''}>
              {stores.length > 0 ? (
                <Text variant="heading">{group.store?.name ?? t('shopping.stores.none')}</Text>
              ) : null}
              {group.items.map((item) => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  onToggle={toggle}
                  onOptions={(product) => setItemId(product.id)}
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
                  onOptions={(product) => setItemId(product.id)}
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

      <BottomSheet
        visible={choosingStore || !!item}
        title={item?.name ?? t('shopping.stores.title')}
        onClose={closePicker}>
        <View style={styles.actions}>
          <ChipGroup
            label={item ? t('shopping.stores.assign') : t('shopping.stores.destination')}
            options={[
              { value: '', label: t('shopping.stores.none') },
              ...stores.map((store) => ({ value: store.id, label: store.name })),
            ]}
            value={(item ? itemStore : activeStore)?.id ?? ''}
            onChange={(id) => {
              if (item && hid) {
                setItemStore(hid, item.id, id || null).catch(saveFailed('Asignar establecimiento'));
              } else {
                setDestination(id || null);
              }
              closePicker();
            }}
          />
          {item ? (
            <Button
              variant="secondary"
              label={t('shopping.remove')}
              onPress={() => {
                remove(item);
                closePicker();
              }}
            />
          ) : (
            <Button
              variant="secondary"
              label={t('shopping.stores.manage')}
              onPress={() => {
                closePicker();
                router.push('/shopping-stores');
              }}
            />
          )}
        </View>
      </BottomSheet>
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
  destination: { alignItems: 'flex-start' },
  actions: { gap: spacing.lg },
});
