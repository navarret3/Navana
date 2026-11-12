import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, Text } from '@/ui';

// Fase 3: lista en tiempo real, autocompletar, frecuentes y categorías.
export default function ShoppingScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <Text variant="title">{t('shopping.title')}</Text>
      <EmptyState
        icon="🛒"
        title={t('shopping.empty.title')}
        description={t('shopping.empty.description')}
      />
    </Screen>
  );
}
