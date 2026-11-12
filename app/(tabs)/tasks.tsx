import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, Text } from '@/ui';

// Fase 2: zonas, tareas, completar, historial y balance.
export default function TasksScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <Text variant="title">{t('tasks.title')}</Text>
      <EmptyState
        icon="🐈"
        title={t('tasks.empty.title')}
        description={t('tasks.empty.description')}
      />
    </Screen>
  );
}
