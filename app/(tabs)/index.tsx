import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatLongDate, getDayPart } from '@/features/today/greeting';
import { getEnabledModules } from '@/modules/registry';
import { useSession } from '@/state/session';
import { Avatar, EmptyState, Screen, Text, spacing } from '@/ui';

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useSession((state) => state.user);
  const enabledModules = useSession((state) => state.enabledModules);
  const visibleModules = getEnabledModules(enabledModules);
  const now = new Date();

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
          <Avatar name={user?.displayName} />
        </Pressable>
      </View>

      {visibleModules.length === 0 ? (
        <EmptyState
          icon="😴"
          title={t('today.noModules.title')}
          description={t('today.noModules.description')}
        />
      ) : (
        visibleModules.map(({ id, TodayCard }) => <TodayCard key={id} />)
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
