import { useTranslation } from 'react-i18next';

import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { Text } from '@/ui';

// Fase 3: resumen de lo que queda por comprar.
export function ShoppingTodayCard() {
  const { t } = useTranslation();
  return (
    <TodaySummaryCard icon="🛒" title={t('shopping.todayCard.title')} tone="sage">
      <Text color="inkSoft">{t('shopping.todayCard.empty')}</Text>
    </TodaySummaryCard>
  );
}
