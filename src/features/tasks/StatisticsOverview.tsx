import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { dateKeyToLocalDate } from '@/domain/dates';
import type { Member } from '@/domain/household';
import type { taskStatistics } from '@/domain/tasks/statistics';
import type { Zone } from '@/domain/tasks/types';
import { Avatar, Card, ChipGroup, Text, colors, minTouchSize, radii, spacing } from '@/ui';

export type ShareMetric = 'count' | 'effort';
type Props = {
  stats: ReturnType<typeof taskStatistics>;
  members: Member[];
  zones: Zone[];
  metric: ShareMetric;
  onMetric: (metric: ShareMetric) => void;
  onMember: (uid: string) => void;
  onZone: (zoneId: string | null) => void;
};

export function StatisticsOverview({
  stats,
  members,
  zones,
  metric,
  onMetric,
  onMember,
  onZone,
}: Props) {
  const { t, i18n } = useTranslation();
  const memberOf = (uid: string) => members.find((member) => member.uid === uid);
  const nameOf = (uid: string) => memberOf(uid)?.name ?? t('common.formerMember');
  const colorOf = (uid: string) => memberOf(uid)?.color || colors.inkMuted;
  const total = metric === 'count' ? stats.count : stats.balance.totalEffort;
  const maxActivity = Math.max(1, ...stats.timeline.buckets.map((bucket) => bucket.count));
  const dateLabel = (day: string) =>
    new Intl.DateTimeFormat(
      i18n.language,
      stats.timeline.unit === 'year'
        ? { year: 'numeric' }
        : stats.timeline.unit === 'month'
          ? { month: 'short', year: 'numeric' }
          : { day: 'numeric', month: 'short' },
    ).format(dateKeyToLocalDate(day));
  return (
    <>
      <Card>
        <Text variant="heading">{t('tasks.statistics.byPerson')}</Text>
        <ChipGroup<ShareMetric>
          value={metric}
          onChange={onMetric}
          options={[
            { value: 'count', label: t('tasks.statistics.times') },
            { value: 'effort', label: t('tasks.effort.label') },
          ]}
        />
        <Text variant="caption" color="inkSoft">
          {t(metric === 'effort' ? 'tasks.statistics.effortHint' : 'tasks.statistics.countHint')}
        </Text>
        {stats.balance.members.map((entry) => {
          const percent = total ? Math.round((entry[metric] / total) * 100) : 0;
          const member = memberOf(entry.uid);
          return (
            <Pressable
              key={entry.uid}
              accessibilityRole="button"
              accessibilityLabel={t('tasks.statistics.filterPerson', { name: nameOf(entry.uid) })}
              onPress={() => onMember(entry.uid)}
              style={({ pressed }) => [styles.member, pressed && styles.pressed]}>
              <Avatar emoji={member?.avatar} name={member?.name} color={member?.color} size={36} />
              <View style={styles.grow}>
                <View style={styles.row}>
                  <Text variant="bodyStrong" style={styles.grow}>
                    {nameOf(entry.uid)}
                  </Text>
                  <Text variant="bodyStrong">
                    {t('tasks.statistics.percent', { value: percent })}
                  </Text>
                </View>
                <View style={styles.track} accessible={false}>
                  <View style={{ width: `${percent}%`, backgroundColor: colorOf(entry.uid) }} />
                </View>
                <Text variant="caption" color="inkSoft">
                  {t('tasks.statistics.timesCount', { count: entry.count })}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Card>
      <Card>
        <Text variant="heading">{t('tasks.statistics.evolution')}</Text>
        <Text variant="caption" color="inkSoft">
          {t(`tasks.statistics.timeline.${stats.timeline.unit}`)}
        </Text>
        <View style={styles.legend}>
          {stats.balance.members
            .filter((entry) => entry.count > 0)
            .map((entry) => (
              <View key={entry.uid} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: colorOf(entry.uid) }]} />
                <Text variant="caption">{nameOf(entry.uid)}</Text>
              </View>
            ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.chart}>
          {stats.timeline.buckets.map((bucket) => (
            <View
              key={bucket.from}
              accessible
              accessibilityLabel={[
                bucket.from === bucket.to
                  ? dateLabel(bucket.from)
                  : `${dateLabel(bucket.from)} – ${dateLabel(bucket.to)}`,
                t('tasks.statistics.timesCount', { count: bucket.count }),
                ...Object.entries(bucket.byMember).map(
                  ([uid, count]) => `${nameOf(uid)}: ${count}`,
                ),
              ].join('. ')}
              style={styles.column}>
              <Text variant="caption">{bucket.count}</Text>
              <View style={styles.barArea}>
                <View style={[styles.bar, { height: `${(bucket.count / maxActivity) * 100}%` }]}>
                  {stats.balance.members.map((entry) => (
                    <View
                      key={entry.uid}
                      style={{
                        height: `${bucket.count ? ((bucket.byMember[entry.uid] ?? 0) / bucket.count) * 100 : 0}%`,
                        backgroundColor: colorOf(entry.uid),
                      }}
                    />
                  ))}
                </View>
              </View>
              <Text variant="label" color="inkSoft" center>
                {dateLabel(bucket.from)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Card>
      {stats.balance.zones.length > 0 ? (
        <Card>
          <Text variant="heading">{t('tasks.balance.byZone')}</Text>
          {stats.balance.zones.map((entry) => {
            const zone = zones.find((item) => item.id === entry.zoneId);
            const label = zone
              ? `${zone.icon} ${zone.name}`
              : t(entry.zoneId === null ? 'tasks.noZone' : 'tasks.statistics.formerZone');
            return (
              <Pressable
                key={entry.zoneId ?? ''}
                accessibilityRole="button"
                accessibilityLabel={t('tasks.statistics.filterZone', { name: label })}
                onPress={() => onZone(entry.zoneId)}
                style={({ pressed }) => [styles.activity, styles.zone, pressed && styles.pressed]}>
                <Text variant="bodyStrong">{label}</Text>
                <View style={styles.track}>
                  {stats.balance.members.map((member) => (
                    <View
                      key={member.uid}
                      style={{
                        width: `${((entry.byMember[member.uid] ?? 0) / entry.effort) * 100}%`,
                        backgroundColor: colorOf(member.uid),
                      }}
                    />
                  ))}
                </View>
                <Text variant="caption" color="inkSoft">
                  {t('tasks.statistics.zoneEffort')}
                </Text>
                <Text variant="caption" color="inkSoft">
                  {stats.balance.members
                    .map(
                      (member) =>
                        `${nameOf(member.uid)}: ${t('tasks.statistics.percent', {
                          value: Math.round(
                            ((entry.byMember[member.uid] ?? 0) / entry.effort) * 100,
                          ),
                        })}`,
                    )
                    .join(' · ')}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize,
    paddingVertical: spacing.xs,
  },
  track: {
    height: 10,
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: radii.pill },
  activity: { gap: spacing.xxs },
  chart: { gap: spacing.sm, paddingBottom: spacing.md },
  column: { width: 46, alignItems: 'center', gap: spacing.xs },
  barArea: {
    height: 100,
    width: 24,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  bar: {
    width: '100%',
    flexDirection: 'column-reverse',
    overflow: 'hidden',
    borderRadius: radii.sm,
  },
  zone: { minHeight: minTouchSize, paddingVertical: spacing.xs },
  pressed: { opacity: 0.75 },
});
