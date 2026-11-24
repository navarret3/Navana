import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button, Card, Text, colors, spacing } from '@/ui';

import type { useCompletionHistory } from './useCompletionHistory';

export function CompletionHistoryStatus({
  history,
}: {
  history: ReturnType<typeof useCompletionHistory>;
}) {
  const { t } = useTranslation();
  if (history.error)
    return (
      <Card>
        <Text color="danger">{t('tasks.statistics.loadError')}</Text>
        <Button variant="secondary" label={t('tasks.statistics.retry')} onPress={history.retry} />
      </Card>
    );
  if (history.loading)
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ActivityIndicator color={colors.peachDeep} />
        <Text>{t('tasks.statistics.loading')}</Text>
      </View>
    );
  return history.fromCache ? (
    <Text variant="caption" color="inkSoft">
      {t('tasks.statistics.cached')}
    </Text>
  ) : null;
}
