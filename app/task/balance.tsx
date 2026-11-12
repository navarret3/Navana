import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { toDateKey } from '@/domain/dates';
import { computeBalance, periodRange, type BalancePeriod } from '@/domain/tasks/balance';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Avatar, Card, ChipGroup, Screen, ScreenHeader, Text, colors, radii, spacing } from '@/ui';

/** A partir de esta diferencia de reparto se deja de decir "vais a la par". */
const EVEN_MARGIN = 0.15;

export default function TaskBalanceScreen() {
  const { t } = useTranslation();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const completions = useTasks((state) => state.completions);
  const zones = useTasks((state) => state.zones);
  const [period, setPeriod] = useState<BalancePeriod>('week');

  if (!household) return null;

  const balance = computeBalance(
    completions,
    household.memberIds,
    periodRange(period, toDateKey(new Date())),
  );
  const memberOf = (uid: string) => members.find((member) => member.uid === uid);
  const colorOf = (uid: string) => memberOf(uid)?.color || colors.peach;

  const shares = balance.members.map((member) => member.share);
  const spread = Math.max(...shares, 0) - Math.min(...shares, 0);
  const top = [...balance.members].sort((a, b) => b.share - a.share)[0];
  // Con una sola persona en el hogar no hay reparto que comentar.
  const summary =
    balance.members.length < 2
      ? null
      : spread <= EVEN_MARGIN
        ? t('tasks.balance.even')
        : t('tasks.balance.uneven', { name: memberOf(top?.uid ?? '')?.name ?? '' });

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.balance.title')} />
      <Text color="inkSoft">{t('tasks.balance.intro')}</Text>

      <ChipGroup<BalancePeriod>
        options={[
          { value: 'week', label: t('tasks.balance.week') },
          { value: 'month', label: t('tasks.balance.month') },
        ]}
        value={period}
        onChange={setPeriod}
      />

      {balance.totalEffort === 0 ? (
        <Card>
          <Text color="inkSoft">{t('tasks.balance.empty')}</Text>
        </Card>
      ) : (
        <>
          <Card>
            {balance.members.map((member) => {
              const percent = Math.round(member.share * 100);
              return (
                <View key={member.uid} style={styles.member}>
                  <Avatar
                    emoji={memberOf(member.uid)?.avatar}
                    name={memberOf(member.uid)?.name}
                    color={memberOf(member.uid)?.color}
                    size={36}
                  />
                  <View style={styles.memberBody}>
                    <View style={styles.memberLine}>
                      <Text variant="bodyStrong" style={styles.grow}>
                        {memberOf(member.uid)?.name ?? t('common.formerMember')}
                      </Text>
                      <Text variant="bodyStrong">{percent} %</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${percent}%`, backgroundColor: colorOf(member.uid) },
                        ]}
                      />
                    </View>
                    <Text variant="caption" color="inkSoft">
                      {t('tasks.balance.count', { count: member.count })}
                    </Text>
                  </View>
                </View>
              );
            })}
            {summary ? <Text color="inkSoft">{summary}</Text> : null}
          </Card>

          <Card>
            <Text variant="heading">{t('tasks.balance.byZone')}</Text>
            {balance.zones.map((zoneBalance) => {
              const zone = zones.find((candidate) => candidate.id === zoneBalance.zoneId);
              return (
                <View key={zoneBalance.zoneId ?? 'none'} style={styles.zone}>
                  <Text variant="caption" color="inkSoft">
                    {zone ? `${zone.icon} ${zone.name}` : t('tasks.noZone')}
                  </Text>
                  <View style={styles.track}>
                    {household.memberIds.map((uid) => (
                      <View
                        key={uid}
                        style={{
                          flex: zoneBalance.byMember[uid] ?? 0,
                          backgroundColor: colorOf(uid),
                        }}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  memberBody: {
    flex: 1,
    gap: spacing.xs,
  },
  memberLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grow: {
    flex: 1,
  },
  track: {
    height: 12,
    flexDirection: 'row',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  zone: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
