import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Member } from '@/domain/household';
import type { taskStatistics } from '@/domain/tasks/statistics';
import { Avatar, Card, Text, colors, radii, spacing } from '@/ui';

/** Un único criterio: cada vez que alguien completa una tarea cuenta una vez. */
export function StatisticsOverview({
  stats,
  members,
}: {
  stats: ReturnType<typeof taskStatistics>;
  members: Member[];
}) {
  const { t } = useTranslation();
  const formerIds = stats.balance.members
    .filter((entry) => !members.some((member) => member.uid === entry.uid))
    .map((entry) => entry.uid);
  return (
    <Card>
      <Text variant="heading">{t('tasks.statistics.byPerson')}</Text>
      {stats.balance.members.map((entry) => {
        const member = members.find((item) => item.uid === entry.uid);
        const name =
          member?.name ??
          t('tasks.statistics.formerPerson', {
            number: formerIds.indexOf(entry.uid) + 1,
          });
        return (
          <View key={entry.uid} style={styles.member}>
            <Avatar emoji={member?.avatar} name={name} color={member?.color} size={36} />
            <View style={styles.grow}>
              <View style={styles.row}>
                <Text variant="bodyStrong" style={styles.grow}>
                  {name}
                </Text>
                <Text variant="caption">
                  {t('tasks.statistics.timesCount', { count: entry.count })}
                </Text>
              </View>
              <View style={styles.track} accessible={false}>
                <View
                  style={{
                    width: `${stats.count ? (entry.count / stats.count) * 100 : 0}%`,
                    backgroundColor: member?.color || colors.inkMuted,
                  }}
                />
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  track: {
    height: 8,
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
});
