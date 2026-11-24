import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { dateKeyToLocalDate, toDateKey } from '@/domain/dates';
import {
  filterCompletions,
  historyTasks,
  statisticsRange,
  taskStatistics,
  type StatisticsPeriod,
  type TaskActivity,
} from '@/domain/tasks/statistics';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import {
  Button,
  Card,
  DateField,
  EmptyState,
  Screen,
  ScreenHeader,
  Text,
  colors,
  minTouchSize,
  radii,
  spacing,
} from '@/ui';

import { CompletionHistoryStatus } from './CompletionHistoryStatus';
import { StatisticsOverview } from './StatisticsOverview';
import { StatisticsPicker } from './StatisticsPicker';
import { useCompletionHistory } from './useCompletionHistory';

const ALL = '*';
type Props = { initialPeriod?: StatisticsPeriod };

export default function TaskStatisticsScreen(props: Props) {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const hid = useSession((state) => state.household?.id ?? '');
  return (
    <StatisticsContent key={`${hid}:${taskId ?? ''}`} {...props} hid={hid} initialTaskId={taskId} />
  );
}

function StatisticsContent({
  hid,
  initialTaskId,
  initialPeriod = 'month',
}: Props & {
  hid: string;
  initialTaskId?: string;
}) {
  const { t, i18n } = useTranslation();
  const members = useSession((state) => state.members);
  const tasks = useTasks((state) => state.tasks);
  const today = toDateKey(new Date());
  const [period, setPeriod] = useState<StatisticsPeriod>(initialTaskId ? 'all' : initialPeriod);
  const [custom, setCustom] = useState({
    from: `${today.slice(0, 7)}-01`,
    to: today,
  });
  const [taskId, setTaskId] = useState(initialTaskId ?? ALL);
  const list = useRef<FlatList<TaskActivity>>(null);
  const range = useMemo(() => statisticsRange(period, today, custom), [period, today, custom]);
  const invalidRange = !!range && range.from > range.to;
  const history = useCompletionHistory(hid, range);
  const entries = useMemo(
    () =>
      filterCompletions(history.entries, {
        range,
        taskId: taskId === ALL ? undefined : taskId,
      }),
    [history.entries, range, taskId],
  );
  const stats = useMemo(
    () =>
      taskStatistics(
        entries,
        members.map((member) => member.uid),
        range,
      ),
    [entries, members, range],
  );
  const taskOptions = useMemo(() => historyTasks(tasks, history.entries), [tasks, history.entries]);
  const taskMap = useMemo(() => new Map(taskOptions.map((task) => [task.id, task])), [taskOptions]);
  const formatDate = (day: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dateKeyToLocalDate(day));
  const ready = !history.loading && !history.error && !invalidRange;
  const selectTask = (id: string) => {
    setTaskId(id);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.statistics.title')} />
      <FlatList
        ref={list}
        data={ready && taskId === ALL ? stats.tasks : []}
        keyExtractor={(item) => item.taskId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text color="inkSoft">{t('tasks.statistics.intro')}</Text>
            <View style={styles.filters}>
              <View style={styles.filter}>
                <StatisticsPicker
                  label={t('tasks.statistics.period')}
                  value={period}
                  onChange={(value) => setPeriod(value as StatisticsPeriod)}
                  options={(['week', 'month', 'year', 'all', 'custom'] as const).map((value) => ({
                    value,
                    label: t(`tasks.statistics.periods.${value}`),
                  }))}
                />
              </View>
              <View style={styles.filter}>
                <StatisticsPicker
                  label={t('tasks.statistics.task')}
                  value={taskId}
                  onChange={selectTask}
                  options={[
                    { value: ALL, label: t('tasks.statistics.allTasks') },
                    ...taskOptions.map((task) => ({
                      value: task.id,
                      label: `${task.icon} ${task.title}`,
                      detail: task.archived ? t('tasks.statistics.archived') : undefined,
                    })),
                  ]}
                />
              </View>
            </View>
            {period === 'custom' ? (
              <View style={styles.group}>
                <DateField
                  label={t('tasks.statistics.from')}
                  value={custom.from}
                  onChange={(from) => setCustom({ ...custom, from })}
                />
                <DateField
                  label={t('tasks.statistics.to')}
                  value={custom.to}
                  onChange={(to) => setCustom({ ...custom, to })}
                  error={invalidRange ? t('tasks.statistics.invalidRange') : undefined}
                />
              </View>
            ) : null}
            {!invalidRange ? <CompletionHistoryStatus history={history} /> : null}
            {ready ? (
              <>
                <Card tone="peach">
                  <Text variant="caption" color="inkSoft">
                    {range
                      ? `${formatDate(range.from)} – ${formatDate(range.to)}`
                      : t('tasks.statistics.periods.all')}
                  </Text>
                  <View style={styles.total}>
                    <Text variant="display">{stats.count}</Text>
                    <Text style={styles.grow}>
                      {t(
                        taskId === ALL
                          ? 'tasks.statistics.totalCompletions'
                          : 'tasks.statistics.completed',
                      )}
                    </Text>
                  </View>
                  <Text variant="caption" color="inkSoft">
                    {t('tasks.statistics.countHint')}
                  </Text>
                </Card>
                {stats.count === 0 ? (
                  <EmptyState
                    icon="🕘"
                    title={t('tasks.statistics.emptyTitle')}
                    description={t('tasks.statistics.emptyDescription')}
                  />
                ) : (
                  <StatisticsOverview stats={stats} members={members} />
                )}
                {taskId === ALL && stats.count > 0 ? (
                  <View style={styles.group}>
                    <Text variant="heading">{t('tasks.statistics.byTask')}</Text>
                    <Text variant="caption" color="inkSoft">
                      {t('tasks.statistics.taskHint')}
                    </Text>
                  </View>
                ) : null}
                {taskId !== ALL ? (
                  <Card>
                    {stats.latest ? (
                      <>
                        <Text variant="heading">{t('tasks.statistics.lastInPeriod')}</Text>
                        <Text>
                          {members.find((member) => member.uid === stats.latest?.completedBy)
                            ?.name ?? t('common.formerMember')}
                          {' · '}
                          {formatDate(stats.latest.completedOn)}
                        </Text>
                      </>
                    ) : null}
                    <Button
                      variant="secondary"
                      label={t('tasks.statistics.fullHistory')}
                      onPress={() =>
                        router.push({
                          pathname: '/task/history',
                          params: { taskId },
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      label={t('tasks.statistics.allTasks')}
                      onPress={() => selectTask(ALL)}
                    />
                  </Card>
                ) : null}
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tasks.statistics.openTask', {
              title: taskMap.get(item.taskId)?.title ?? item.latest.title,
            })}
            onPress={() => selectTask(item.taskId)}
            style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}>
            <Text variant="bodyStrong" style={styles.grow}>
              {taskMap.get(item.taskId)?.icon ?? item.latest.icon}{' '}
              {taskMap.get(item.taskId)?.title ?? item.latest.title}
            </Text>
            <Text variant="caption">{t('tasks.statistics.timesCount', { count: item.count })}</Text>
            <Text color="inkSoft">›</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  header: { gap: spacing.lg, paddingBottom: spacing.sm },
  group: { gap: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { flexGrow: 1, flexBasis: 140 },
  grow: { flex: 1 },
  total: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.75 },
});
