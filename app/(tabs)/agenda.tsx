import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, Text } from '@/ui';

// Fase 4: vista de mes, próximos, recordatorios y cuenta atrás.
export default function AgendaScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <Text variant="title">{t('agenda.title')}</Text>
      <EmptyState
        icon="📅"
        title={t('agenda.empty.title')}
        description={t('agenda.empty.description')}
      />
    </Screen>
  );
}
