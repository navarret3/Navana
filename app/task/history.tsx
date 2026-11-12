import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { addDays, dateKeyToLocalDate, toDateKey, type DateKey } from '@/domain/dates';
import { canUndo } from '@/domain/tasks/completion';
import type { Completion } from '@/domain/tasks/types';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Avatar, Button, Card, EmptyState, Screen, ScreenHeader, Text, spacing } from '@/ui';

/** Agrupa por día manteniendo el orden (de más reciente a más antiguo). */
function groupByDay(completions: readonly Completion[]): [DateKey, Completion[]][] {
  const days = new Map<DateKey, Completion[]>();
  for (const completion of completions) {
    const list = days.get(completion.completedOn) ?? [];
    list.push(completion);
    days.set(completion.completedOn, list);
  }
  return [...days.entries()].sort(([a], [b]) => b.localeCompare(a));
}

export default function TaskHistoryScreen() {
  const { t, i18n } = useTranslation();
  const members = useSession((state) => state.members);
  const completions = useTasks((state) => state.completions);
  const tasks = useTasks((state) => state.tasks);
  const { undo } = useTaskActions();

  const today = toDateKey(new Date());
  const dayLabel = (day: DateKey) => {
    if (day === today) return t('tasks.history.today');
    if (day === addDays(today, -1)) return t('tasks.history.yesterday');
    const text = new Intl.DateTimeFormat(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(dateKeyToLocalDate(day));
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  if (completions.length === 0) {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        <ScreenHeader title={t('tasks.history.title')} />
        <EmptyState
          icon="🕘"
          title={t('tasks.history.empty.title')}
          description={t('tasks.history.empty.description')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.history.title')} />
      {groupByDay(completions).map(([day, entries]) => (
        <Card key={day}>
          <Text variant="heading">{dayLabel(day)}</Text>
          {entries.map((completion) => {
            const member = members.find((candidate) => candidate.uid === completion.completedBy);
            const task = tasks.find((candidate) => candidate.id === completion.taskId);
            return (
              <View key={completion.id} style={styles.row}>
                <Avatar emoji={member?.avatar} name={member?.name} color={member?.color} size={36} />
                <View style={styles.texts}>
                  <Text variant="bodyStrong">
                    {completion.icon} {completion.title}
                  </Text>
                  <Text variant="caption" color="inkSoft">
                    {member?.name ?? t('common.formerMember')} · {'●'.repeat(completion.effort)}
                  </Text>
                </View>
                {canUndo(completion, task) ? (
                  <Button
                    variant="ghost"
                    label={t('tasks.actions.undo')}
                    onPress={() => undo(completion)}
                  />
                ) : null}
              </View>
            );
          })}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
  },
  texts: {
    flex: 1,
  },
});
