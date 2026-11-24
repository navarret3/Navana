import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, View } from 'react-native';

import { addDays, dateKeyToLocalDate, toDateKey } from '@/domain/dates';
import { canUndo } from '@/domain/tasks/completion';
import { completionDays, filterCompletions, historyTasks } from '@/domain/tasks/statistics';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  Text,
  colors,
  spacing,
} from '@/ui';

import { CompletionHistoryStatus } from './CompletionHistoryStatus';
import { StatisticsPicker } from './StatisticsPicker';
import { useCompletionHistory } from './useCompletionHistory';
import { useTaskActions } from './useTaskActions';

const ALL = '*';

export default function TaskHistoryScreen() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const hid = useSession((state) => state.household?.id ?? '');
  return <HistoryContent key={`${hid}:${taskId ?? ''}`} hid={hid} initialTaskId={taskId} />;
}

function HistoryContent({ hid, initialTaskId }: { hid: string; initialTaskId?: string }) {
  const { t, i18n } = useTranslation();
  const members = useSession((state) => state.members);
  const tasks = useTasks((state) => state.tasks);
  const { undo } = useTaskActions();
  const [taskId, setTaskId] = useState(initialTaskId ?? ALL);
  const [memberId, setMemberId] = useState(ALL);
  const history = useCompletionHistory(hid, null);
  const taskOptions = useMemo(() => historyTasks(tasks, history.entries), [tasks, history.entries]);
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.uid, member])),
    [members],
  );
  const formerIds = useMemo(
    () =>
      [...new Set(history.entries.map((entry) => entry.completedBy))]
        .filter((id) => !memberMap.has(id))
        .sort(),
    [history.entries, memberMap],
  );
  const nameOf = (id: string) =>
    memberMap.get(id)?.name ??
    t('tasks.statistics.formerPerson', { number: formerIds.indexOf(id) + 1 });
  const days = useMemo(
    () =>
      completionDays(
        filterCompletions(history.entries, {
          range: null,
          taskId: taskId === ALL ? undefined : taskId,
          memberId: memberId === ALL ? undefined : memberId,
        }),
      ),
    [history.entries, taskId, memberId],
  );
  const filtered = taskId !== ALL || memberId !== ALL;
  const ready = !history.loading && !history.error;
  const today = toDateKey(new Date());
  const dayLabel = (day: string) => {
    const date = new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateKeyToLocalDate(day));
    if (day === today) return `${t('tasks.history.today')} · ${date}`;
    if (day === addDays(today, -1)) return `${t('tasks.history.yesterday')} · ${date}`;
    return date;
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.history.title')} />
      <SectionList
        sections={ready ? days : []}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text color="inkSoft">{t('tasks.history.intro')}</Text>
            <View style={styles.filters}>
              <View style={styles.filter}>
                <StatisticsPicker
                  label={t('tasks.statistics.person')}
                  value={memberId}
                  onChange={setMemberId}
                  options={[
                    { value: ALL, label: t('tasks.statistics.everyone') },
                    ...members.map((member) => ({
                      value: member.uid,
                      label: member.name,
                    })),
                    ...formerIds.map((id) => ({
                      value: id,
                      label: nameOf(id),
                    })),
                  ]}
                />
              </View>
              <View style={styles.filter}>
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
              </View>
            </View>
            {filtered ? (
              <Button
                variant="ghost"
                label={t('tasks.history.clearFilters')}
                onPress={() => {
                  setMemberId(ALL);
                  setTaskId(ALL);
                }}
              />
            ) : null}
            <CompletionHistoryStatus history={history} />
          </View>
        }
        ListEmptyComponent={
          ready ? (
            <EmptyState
              icon="🕘"
              title={t(
                filtered ? 'tasks.history.filteredEmpty.title' : 'tasks.history.empty.title',
              )}
              description={t(
                filtered
                  ? 'tasks.history.filteredEmpty.description'
                  : 'tasks.history.empty.description',
              )}
            />
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeading}>
            <Text variant="heading" accessibilityRole="header">
              {dayLabel(section.day)}
            </Text>
            <Text variant="caption" color="inkSoft">
              {t('tasks.history.dailyCount', { count: section.data.length })}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const member = memberMap.get(item.completedBy);
          return (
            <Card style={styles.entry}>
              <Text variant="bodyStrong">
                {item.icon} {item.title}
              </Text>
              <View style={styles.row}>
                <Avatar
                  emoji={member?.avatar}
                  name={nameOf(item.completedBy)}
                  color={member?.color}
                  size={28}
                />
                <Text variant="caption" color="inkSoft" style={styles.grow}>
                  {nameOf(item.completedBy)}
                </Text>
                {canUndo(item, taskMap.get(item.taskId)) ? (
                  <Button
                    variant="ghost"
                    label={t('tasks.actions.undo')}
                    onPress={() => undo(item)}
                  />
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.lg },
  header: { gap: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { flexGrow: 1, flexBasis: 140 },
  dayHeading: {
    gap: spacing.xxs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  entry: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
});
