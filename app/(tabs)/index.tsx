import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getEnabledModules } from '@/modules/registry';
import { todayCards } from '@/modules/todayCards';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { EmptyState, Screen, Text } from '@/ui';

export default function TodayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const household = useSession((state) => state.household);
  const visibleModules = getEnabledModules(household?.enabledModules ?? {});
  const offerTemplate = useTasks((state) => state.offerTemplate);
  const setOfferTemplate = useTasks((state) => state.setOfferTemplate);

  // Recién creado el hogar, se ofrece una vez la plantilla de tareas típicas.
  useEffect(() => {
    if (offerTemplate) {
      setOfferTemplate(false);
      router.push('/task/template');
    }
  }, [offerTemplate, setOfferTemplate, router]);

  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">{t('common.appName')}</Text>

      {visibleModules.length === 0 ? (
        <EmptyState
          icon="😴"
          title={t('today.noModules.title')}
          description={t('today.noModules.description')}
        />
      ) : (
        visibleModules.map(({ id }) => {
          const TodayCard = todayCards[id];
          return <TodayCard key={id} />;
        })
      )}
    </Screen>
  );
}
