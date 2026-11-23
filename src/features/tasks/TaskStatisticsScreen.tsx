import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { dateKeyToLocalDate, toDateKey } from '@/domain/dates';
import { canUndo } from '@/domain/tasks/completion';
import {
  filterCompletions,
  historyTasks,
  statisticsRange,
  taskStatistics,
  type StatisticsPeriod,
  type TaskActivity,
} from '@/domain/tasks/statistics';
import type { Completion } from '@/domain/tasks/types';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import {
  Avatar,
  Button,
  Card,
  ChipGroup,
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

import { StatisticsOverview, type ShareMetric } from './StatisticsOverview';
import { StatisticsPicker } from './StatisticsPicker';
import { useCompletionHistory } from './useCompletionHistory';
import { useTaskActions } from './useTaskActions';

type StatisticsView = 'overview' | 'history';
type Props = { initialView?: StatisticsView; initialPeriod?: StatisticsPeriod };
type Row = { kind: 'task'; value: TaskActivity } | { kind: 'completion'; value: Completion };
const ALL = '*';
const NO_ZONE = '';

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
  initialView = 'overview',
  initialPeriod = 'month',
}: Props & { hid: string; initialTaskId?: string }) {
  const { t, i18n } = useTranslation();
  const members = useSession((state) => state.members);
  const tasks = useTasks((state) => state.tasks);
  const zones = useTasks((state) => state.zones);
  const { undo } = useTaskActions();
  const today = toDateKey(new Date());
  const [period, setPeriod] = useState<StatisticsPeriod>(initialTaskId ? 'all' : initialPeriod);
  const [custom, setCustom] = useState({ from: `${today.slice(0, 7)}-01`, to: today });
  const [memberId, setMemberId] = useState(ALL);
  const [taskId, setTaskId] = useState(initialTaskId ?? ALL);
  const [zoneId, setZoneId] = useState(ALL);
  const [view, setView] = useState<StatisticsView>(initialView);
  const [metric, setMetric] = useState<ShareMetric>('count');
  const list = useRef<FlatList<Row>>(null);
  const range = useMemo(() => statisticsRange(period, today, custom), [period, today, custom]);
  const invalidRange = !!range && range.from > range.to;
  const history = useCompletionHistory(hid, range);
  const entries = useMemo(
    () =>
      filterCompletions(history.entries, {
        range,
        memberId: memberId === ALL ? undefined : memberId,
        taskId: taskId === ALL ? undefined : taskId,
        zoneId: zoneId === ALL ? undefined : zoneId === NO_ZONE ? null : zoneId,
      }),
    [history.entries, range, memberId, taskId, zoneId],
  );
  const memberIds = useMemo(() => members.map((member) => member.uid), [members]);
  const stats = useMemo(
    () => taskStatistics(entries, memberId === ALL ? memberIds : [memberId], range),
    [entries, memberIds, memberId, range],
  );
  const taskOptions = useMemo(() => historyTasks(tasks, history.entries), [tasks, history.entries]);
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.uid, member])),
    [members],
  );
  const selectedTask = taskOptions.find((task) => task.id === taskId);
  const formerMemberIds = [...new Set(history.entries.map((entry) => entry.completedBy))].filter(
    (uid) => !memberMap.has(uid),
  );
  const formerZoneIds = [...new Set(history.entries.map((entry) => entry.zoneId))].filter(
    (id): id is string => id !== null && !zones.some((zone) => zone.id === id),
  );
  const formatDate = (day: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dateKeyToLocalDate(day));
  const nameOf = (uid: string) => memberMap.get(uid)?.name ?? t('common.formerMember');
  const selectTask = (id: string) => {
    setTaskId(id);
    setView('overview');
    list.current?.scrollToOffset({ offset: 0, animated: false });
  };
  const reset = () => {
    setMemberId(ALL);
    setTaskId(ALL);
    setZoneId(ALL);
    setPeriod('month');
    setCustom({ from: `${today.slice(0, 7)}-01`, to: today });
  };
  const fullTaskHistory = () => {
    setPeriod('all');
    setMemberId(ALL);
    setZoneId(ALL);
    setView('history');
    list.current?.scrollToOffset({ offset: 0, animated: false });
  };
  const ready = !history.loading && !invalidRange && !history.error;
  const rows: Row[] = !ready
    ? []
    : view === 'history' || taskId !== ALL
      ? (view === 'history' ? entries : entries.slice(0, 5)).map((value) => ({
          kind: 'completion',
          value,
        }))
      : stats.tasks.map((value) => ({ kind: 'task', value }));

  const completionRow = (entry: Completion) => {
    const member = memberMap.get(entry.completedBy);
    const zone = zones.find((item) => item.id === entry.zoneId);
    return (
      <Card style={styles.historyCard}>
        <Text variant="label" color="inkSoft">
          {formatDate(entry.completedOn)}
        </Text>
        <View style={styles.row}>
          <Avatar emoji={member?.avatar} name={member?.name} color={member?.color} size={36} />
          <View style={styles.grow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tasks.statistics.openTask', { title: entry.title })}
              onPress={() => selectTask(entry.taskId)}
              style={styles.taskLink}>
              <Text variant="bodyStrong">
                {entry.icon} {entry.title}
              </Text>
            </Pressable>
            <Text variant="caption" color="inkSoft">
              {nameOf(entry.completedBy)}
            </Text>
          </View>
        </View>
        <View style={styles.wrap}>
          <Text variant="caption" color="inkSoft" style={styles.grow}>
            {zone
              ? `${zone.icon} ${zone.name}`
              : t(entry.zoneId === null ? 'tasks.noZone' : 'tasks.statistics.formerZone')}
            {' · '}
            {t('tasks.effort.label')}: {t(`tasks.effort.${entry.effort}`)}
          </Text>
          {canUndo(entry, taskMap.get(entry.taskId)) ? (
            <Button variant="ghost" label={t('tasks.actions.undo')} onPress={() => undo(entry)} />
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.statistics.title')} />
      <FlatList<Row>
        ref={list}
        data={rows}
        keyExtractor={(row) => (row.kind === 'task' ? `task:${row.value.taskId}` : row.value.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text color="inkSoft">{t('tasks.statistics.intro')}</Text>
            <ChipGroup<StatisticsPeriod>
              label={t('tasks.statistics.period')}
              options={(['week', 'month', 'year', 'all', 'custom'] as const).map((value) => ({
                value,
                label: t(`tasks.statistics.periods.${value}`),
              }))}
              value={period}
              onChange={setPeriod}
            />
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
            <View style={styles.group}>
              <StatisticsPicker
                label={t('tasks.statistics.task')}
                value={taskId}
                onChange={setTaskId}
                options={[
                  { value: ALL, label: t('tasks.statistics.allTasks') },
                  ...taskOptions.map((task) => ({
                    value: task.id,
                    label: `${task.icon} ${task.title}`,
                    detail: task.archived ? t('tasks.statistics.archived') : undefined,
                  })),
                ]}
              />
              <View style={styles.wrap}>
                <View style={styles.filter}>
                  <StatisticsPicker
                    label={t('tasks.statistics.person')}
                    value={memberId}
                    onChange={setMemberId}
                    options={[
                      { value: ALL, label: t('tasks.statistics.everyone') },
                      ...members.map((member) => ({ value: member.uid, label: member.name })),
                      ...formerMemberIds.map((uid, index) => ({
                        value: uid,
                        label: t('tasks.statistics.formerPerson', { number: index + 1 }),
                      })),
                    ]}
                  />
                </View>
                <View style={styles.filter}>
                  <StatisticsPicker
                    label={t('tasks.form.zoneLabel')}
                    value={zoneId}
                    onChange={setZoneId}
                    options={[
                      { value: ALL, label: t('tasks.statistics.allZones') },
                      { value: NO_ZONE, label: t('tasks.noZone') },
                      ...zones.map((zone) => ({
                        value: zone.id,
                        label: `${zone.icon} ${zone.name}`,
                      })),
                      ...formerZoneIds.map((id) => ({
                        value: id,
                        label: t('tasks.statistics.formerZone'),
                      })),
                    ]}
                  />
                </View>
              </View>
              {memberId !== ALL || taskId !== ALL || zoneId !== ALL || period !== 'month' ? (
                <Button variant="ghost" label={t('tasks.statistics.reset')} onPress={reset} />
              ) : null}
            </View>
            <Text variant="caption" color="inkSoft">
              {range
                ? `${formatDate(range.from)} – ${formatDate(range.to)}`
                : t('tasks.statistics.periods.all')}
            </Text>
            <ChipGroup<StatisticsView>
              value={view}
              onChange={setView}
              options={[
                { value: 'overview', label: t('tasks.statistics.overview') },
                { value: 'history', label: t('tasks.history.title') },
              ]}
            />
            {history.loading && !invalidRange ? (
              <View style={styles.row}>
                <ActivityIndicator color={colors.peachDeep} />
                <Text>{t('tasks.statistics.loading')}</Text>
              </View>
            ) : null}
            {history.error ? (
              <Card>
                <Text color="danger">{t('tasks.statistics.loadError')}</Text>
                <Button
                  variant="secondary"
                  label={t('tasks.statistics.retry')}
                  onPress={history.retry}
                />
              </Card>
            ) : null}
            {history.fromCache && !history.error ? (
              <Text variant="caption" color="inkSoft">
                {t('tasks.statistics.cached')}
              </Text>
            ) : null}
            {ready ? (
              <>
                <Card tone="peach">
                  {selectedTask ? (
                    <Text variant="heading">
                      {selectedTask.icon} {selectedTask.title}
                    </Text>
                  ) : null}
                  <View style={styles.wrap}>
                    {[
                      [stats.count, t('tasks.statistics.completed')],
                      [stats.distinctTasks, t('tasks.statistics.distinctTasks')],
                      [stats.activeDays, t('tasks.statistics.activeDays')],
                    ].map(([value, label]) => (
                      <View key={label} style={styles.stat}>
                        <Text variant="display">{value}</Text>
                        <Text variant="caption" color="inkSoft">
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {stats.latest ? (
                    <Text variant="caption" color="inkSoft">
                      {t('tasks.statistics.latest', {
                        name: nameOf(stats.latest.completedBy),
                        date: formatDate(stats.latest.completedOn),
                      })}
                    </Text>
                  ) : null}
                </Card>
                {stats.count === 0 ? (
                  <EmptyState
                    icon="🕘"
                    title={t('tasks.statistics.emptyTitle')}
                    description={t('tasks.statistics.emptyDescription')}
                  />
                ) : null}
                {view === 'overview' && stats.count > 0 ? (
                  <StatisticsOverview
                    stats={stats}
                    members={members}
                    zones={zones}
                    metric={metric}
                    onMetric={setMetric}
                    onMember={setMemberId}
                    onZone={(id) => setZoneId(id ?? NO_ZONE)}
                  />
                ) : null}
                {stats.count > 0 ? (
                  <Text variant="heading">
                    {t(
                      view === 'history'
                        ? 'tasks.statistics.historyResults'
                        : taskId === ALL
                          ? 'tasks.statistics.byTask'
                          : 'tasks.statistics.latestTimes',
                      { count: entries.length },
                    )}
                  </Text>
                ) : null}
                {view === 'overview' && taskId === ALL && stats.count > 0 ? (
                  <Text variant="caption" color="inkSoft">
                    {t('tasks.statistics.taskHint')}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'completion' ? (
            completionRow(item.value)
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tasks.statistics.openTask', {
                title: taskMap.get(item.value.taskId)?.title ?? item.value.latest.title,
              })}
              onPress={() => selectTask(item.value.taskId)}
              style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}>
              <View style={styles.row}>
                <Text variant="bodyStrong" style={styles.grow}>
                  {taskMap.get(item.value.taskId)?.icon ?? item.value.latest.icon}{' '}
                  {taskMap.get(item.value.taskId)?.title ?? item.value.latest.title}
                </Text>
                <Text variant="caption">
                  {t('tasks.statistics.timesCount', { count: item.value.count })}
                </Text>
              </View>
              <Text variant="caption" color="inkSoft">
                {t('tasks.statistics.latest', {
                  name: nameOf(item.value.latest.completedBy),
                  date: formatDate(item.value.latest.completedOn),
                })}
              </Text>
            </Pressable>
          )
        }
        ListFooterComponent={
          ready && taskId !== ALL && view === 'overview' ? (
            <Button
              variant="secondary"
              label={t('tasks.statistics.fullHistory')}
              onPress={fullTaskHistory}
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  header: { gap: spacing.lg, paddingBottom: spacing.sm },
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  grow: { flex: 1 },
  filter: { flexGrow: 1, flexBasis: 140 },
  stat: { flex: 1, minWidth: 75 },
  historyCard: { gap: spacing.xs },
  taskLink: { minHeight: minTouchSize, justifyContent: 'center' },
  taskCard: {
    minHeight: minTouchSize,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.75 },
});
