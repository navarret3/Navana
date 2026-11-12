import { useTranslation } from 'react-i18next';

import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { Text } from '@/ui';

// Fase 2: mis tareas de hoy y atrasadas, las libres y las de la pareja.
export function TasksTodayCard() {
  const { t } = useTranslation();
  return (
    <TodaySummaryCard icon="🧹" title={t('tasks.todayCard.title')}>
      <Text color="inkSoft">{t('tasks.todayCard.empty')}</Text>
    </TodaySummaryCard>
  );
}
