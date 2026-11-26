import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { toDateKey } from '@/domain/dates';
import { canUndo } from '@/domain/tasks/completion';
import { groupByWhen, scheduledTasks, tasksFor } from '@/domain/tasks/today';
import type { Task } from '@/domain/tasks/types';
import { TaskAddButton } from '@/features/tasks/TaskAddButton';
import { TaskRow } from '@/features/tasks/TaskRow';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  ChipGroup,
  Text,
  colors,
  minTouchSize,
  radii,
  spacing,
} from '@/ui';

/** Valor del filtro que enseña las tareas de todo el hogar. */
const EVERYONE = 'all';

/**
 * Tareas por fecha, filtrables por persona, y lo hecho hoy. El botón flotante abre
 * las dos formas de añadir sin ocupar espacio en la lista.
 */
export default function TasksScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const zones = useTasks((state) => state.zones);
  const allTasks = useTasks((state) => state.tasks);
  const completions = useTasks((state) => state.completions);
  const { complete, nudge, undo } = useTaskActions();
  const [who, setWho] = useState<string>(EVERYONE);
  const [showLater, setShowLater] = useState(false);

  const today = toDateKey(new Date());
  const memberIds = household?.memberIds ?? [];
  const activeWho = who === EVERYONE || memberIds.includes(who) ? who : EVERYONE;
  const recurring = scheduledTasks(allTasks);
  const groups = groupByWhen(
    tasksFor(recurring, activeWho === EVERYONE ? null : activeWho, memberIds),
    today,
  );
  const doneToday = completions.filter((completion) =>
    completion.completedOn === today && (activeWho === EVERYONE || completion.completedBy === activeWho),
  );

  const row = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      today={today}
      members={members}
      memberIds={memberIds}
      currentUid={uid}
      zone={zones.find((zone) => zone.id === task.zoneId)}
      onComplete={complete}
      onNudge={nudge}
      onPress={(pressed) => router.push({ pathname: '/task/[id]', params: { id: pressed.id } })}
    />
  );

  return (
    <Screen floating={
      <TaskAddButton>
        {members.length > 1 && recurring.length > 0 ? (
          <ChipGroup<string>
            label={t('tasks.filter.label')}
            options={[
              { value: EVERYONE, label: t('tasks.filter.all') },
              ...members.map((member) => ({
                value: member.uid,
                label: member.uid === uid ? t('tasks.filter.mine') : member.name,
                icon: member.avatar,
              })),
            ]}
            value={activeWho}
            onChange={setWho}
          />
        ) : null}
      </TaskAddButton>
    }>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('tasks.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/task/statistics')}
          style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}>
          <Text variant="label">{t('tasks.statistics.title')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/task/history')}
          style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}>
          <Text variant="label">{t('tasks.actions.history')}</Text>
        </Pressable>
      </View>

      {activeWho !== EVERYONE ? (
        <Chip
          role="button"
          label={t('tasks.filter.clear', { name: members.find((member) => member.uid === activeWho)?.name })}
          onPress={() => setWho(EVERYONE)}
        />
      ) : null}

      {recurring.length === 0 ? (
        <EmptyState
          icon="🐈"
          title={t('tasks.empty.title')}
          description={t('tasks.empty.description')}
          action={
            <Button
              variant="ghost"
              label={t('tasks.empty.useTemplate')}
              onPress={() => router.push('/task/template')}
            />
          }
        />
      ) : (
        <>
          <Card tone="peach">
            <Text variant="heading">{t('tasks.sections.today')}</Text>
            {groups.today.length === 0 ? (
              <Text color="inkSoft">{t('tasks.sections.nothingToday')}</Text>
            ) : (
              groups.today.map(row)
            )}
          </Card>

          {groups.soon.length > 0 ? (
            <Card>
              <Text variant="heading">{t('tasks.sections.soon')}</Text>
              {groups.soon.map(row)}
            </Card>
          ) : null}

          {groups.later.length > 0 ? (
            <Card>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showLater }}
                onPress={() => setShowLater(!showLater)}
                style={styles.toggle}>
                <Text variant="heading" style={styles.title}>
                  {t('tasks.sections.later')}
                </Text>
                <Text variant="label" color="inkSoft">
                  {showLater
                    ? t('tasks.sections.hide')
                    : t('tasks.sections.show', { count: groups.later.length })}
                </Text>
              </Pressable>
              {showLater ? groups.later.map(row) : null}
            </Card>
          ) : null}
        </>
      )}

      {doneToday.length > 0 ? (
        <Card tone="sage">
          <Text variant="heading">✅ {t('tasks.sections.doneToday')}</Text>
          {doneToday.map((completion) => {
            const member = members.find((candidate) => candidate.uid === completion.completedBy);
            const task = allTasks.find((candidate) => candidate.id === completion.taskId);
            return (
              <View key={completion.id} style={styles.doneRow}>
                <Avatar
                  emoji={member?.avatar}
                  name={member?.name}
                  color={member?.color}
                  size={32}
                />
                <Text style={styles.title} numberOfLines={2}>
                  {completion.icon} {completion.title}
                </Text>
                {canUndo(completion, task) ? (
                  <Chip
                    role="button"
                    label={t('tasks.actions.undo')}
                    onPress={() => undo(completion)}
                  />
                ) : null}
              </View>
            );
          })}
        </Card>
      ) : null}
      <View style={styles.fabSpace} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  navLink: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  fabSpace: { height: 76 },
  toggle: {
    minHeight: minTouchSize - 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  doneRow: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
