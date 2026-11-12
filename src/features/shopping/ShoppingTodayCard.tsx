import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { useShopping } from '@/state/shopping';
import { Text } from '@/ui';

/** Cuántos nombres caben en el resumen antes de decir "y N más". */
const PREVIEW = 4;

/** Tarjeta de "Hoy": lo que queda por comprar, de un vistazo. Tocarla abre la lista. */
export function ShoppingTodayCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const pending = useShopping((state) => state.items)
    .filter((item) => !item.checked)
    .sort((a, b) => a.name.localeCompare(b.name));

  const names = pending.slice(0, PREVIEW).map((item) => item.name);
  const rest = pending.length - names.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('shopping.todayCard.open')}
      onPress={() => router.push('/shopping')}>
      <TodaySummaryCard icon="🛒" title={t('shopping.todayCard.title')} tone="sage">
        {pending.length === 0 ? (
          <Text color="inkSoft">{t('shopping.todayCard.empty')}</Text>
        ) : (
          <>
            <Text variant="bodyStrong">
              {t('shopping.todayCard.count', { count: pending.length })}
            </Text>
            <Text color="inkSoft">
              {names.join(', ')}
              {rest > 0 ? ` ${t('shopping.todayCard.more', { count: rest })}` : ''}
            </Text>
          </>
        )}
      </TodaySummaryCard>
    </Pressable>
  );
}
