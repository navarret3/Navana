import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatLongDate, getDayPart } from '@/features/today/greeting';
import { getEnabledModules } from '@/modules/registry';
import { todayCards } from '@/modules/todayCards';
import { useCurrentMember, useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Avatar, EmptyState, Screen, Text, spacing } from '@/ui';

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const household = useSession((state) => state.household);
  const member = useCurrentMember();
  const visibleModules = getEnabledModules(household?.enabledModules ?? {});
  const offerTemplate = useTasks((state) => state.offerTemplate);
  const setOfferTemplate = useTasks((state) => state.setOfferTemplate);
  const now = new Date();

  // Recién creado el hogar, se ofrece una vez la plantilla de tareas típicas.
  useEffect(() => {
    if (offerTemplate) {
      setOfferTemplate(false);
      router.push('/task/template');
    }
  }, [offerTemplate, setOfferTemplate, router]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <Text variant="caption" color="inkSoft">
            {formatLongDate(now, i18n.language)}
          </Text>
          <Text variant="display">{t(`today.greeting.${getDayPart(now)}`)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('today.openSettings')}
          hitSlop={spacing.sm}
          onPress={() => router.push('/settings')}>
          <Avatar emoji={member?.avatar} name={member?.name} color={member?.color} />
        </Pressable>
      </View>

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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  headerTexts: {
    flex: 1,
  },
});
