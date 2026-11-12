import { useTranslation } from 'react-i18next';

import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { Text } from '@/ui';

// Fase 4: próximo plan con su cuenta atrás.
export function AgendaTodayCard() {
  const { t } = useTranslation();
  return (
    <TodaySummaryCard icon="📅" title={t('agenda.todayCard.title')} tone="peach">
      <Text color="inkSoft">{t('agenda.todayCard.empty')}</Text>
    </TodaySummaryCard>
  );
}
