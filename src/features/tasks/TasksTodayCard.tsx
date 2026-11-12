import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { toDateKey } from '@/domain/dates';
import { groupForToday } from '@/domain/tasks/today';
import type { Task } from '@/domain/tasks/types';
import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Text, minTouchSize } from '@/ui';

import { QuickLog } from './QuickLog';
import { TaskRow } from './TaskRow';
import { useTaskActions } from './useTaskActions';

/** Tarjeta de "Hoy": lo que me toca, lo libre y, plegado, lo de los demás. */
export function TasksTodayCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const tasks = useTasks((state) => state.tasks);
  const zones = useTasks((state) => state.zones);
  const { complete } = useTaskActions();
  const [showOthers, setShowOthers] = useState(false);

  const today = toDateKey(new Date());
  const memberIds = household?.memberIds ?? [];
  const groups = groupForToday(tasks, { today, uid: uid ?? '', memberIds });
  const nothingDue =
    groups.mine.length === 0 && groups.free.length === 0 && groups.others.length === 0;

  const rows = (list: readonly Task[]) =>
    list.map((task) => (
      <TaskRow
        key={task.id}
        task={task}
        today={today}
        members={members}
        memberIds={memberIds}
        currentUid={uid}
        zone={zones.find((zone) => zone.id === task.zoneId)}
        onComplete={complete}
        onPress={(pressed) => router.push({ pathname: '/task/[id]', params: { id: pressed.id } })}
      />
    ));

  return (
    <TodaySummaryCard icon="🧹" title={t('tasks.todayCard.title')}>
      {nothingDue ? <Text color="inkSoft">{t('tasks.todayCard.empty')}</Text> : null}

      {rows(groups.mine)}

      {groups.free.length > 0 ? (
        <>
          <Text variant="label" color="inkSoft">
            {t('tasks.todayCard.free')}
          </Text>
          {rows(groups.free)}
        </>
      ) : null}

      {groups.others.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showOthers }}
            onPress={() => setShowOthers(!showOthers)}
            style={styles.toggle}>
            <Text variant="label" color="inkSoft">
              {showOthers ? '▾' : '▸'} {t('tasks.todayCard.others', { count: groups.others.length })}
            </Text>
          </Pressable>
          {showOthers ? rows(groups.others) : null}
        </>
      ) : null}

      <QuickLog compact />
    </TodaySummaryCard>
  );
}

const styles = StyleSheet.create({
  toggle: {
    minHeight: minTouchSize - 8,
    justifyContent: 'center',
  },
});
