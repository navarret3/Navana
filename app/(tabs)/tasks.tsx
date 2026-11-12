import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { toDateKey } from '@/domain/dates';
import { byDueDate, onDemandTasks, scheduledTasks } from '@/domain/tasks/today';
import type { Task, Zone } from '@/domain/tasks/types';
import { QuickLog } from '@/features/tasks/QuickLog';
import { TaskRow } from '@/features/tasks/TaskRow';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Button, Card, Chip, EmptyState, Screen, Text, colors, shadows, spacing } from '@/ui';

type Section = { zone: Zone | null; tasks: Task[] };

/** Agrupa las tareas por zona, en el orden de las zonas, y deja al final las que no tienen. */
function sectionsByZone(tasks: readonly Task[], zones: readonly Zone[]): Section[] {
  const known = new Set(zones.map((zone) => zone.id));
  const sections: Section[] = zones.map((zone) => ({
    zone,
    tasks: tasks.filter((task) => task.zoneId === zone.id).sort(byDueDate),
  }));
  sections.push({
    zone: null,
    tasks: tasks.filter((task) => !task.zoneId || !known.has(task.zoneId)).sort(byDueDate),
  });
  return sections.filter((section) => section.tasks.length > 0);
}

export default function TasksScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const zones = useTasks((state) => state.zones);
  const allTasks = useTasks((state) => state.tasks);
  const tasks = scheduledTasks(allTasks);
  const hasOnDemand = onDemandTasks(allTasks).length > 0;
  const { complete } = useTaskActions();

  const today = toDateKey(new Date());
  const memberIds = household?.memberIds ?? [];
  const sections = sectionsByZone(tasks, zones);

  const header = (
    <View style={styles.header}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {t('tasks.title')}
      </Text>
      <Chip
        role="button"
        label={t('tasks.actions.balance')}
        icon="⚖️"
        onPress={() => router.push('/task/balance')}
      />
      <Chip
        role="button"
        label={t('tasks.actions.history')}
        icon="🕘"
        onPress={() => router.push('/task/history')}
      />
    </View>
  );

  if (tasks.length === 0 && !hasOnDemand) {
    return (
      <Screen scroll={false}>
        {header}
        <EmptyState
          icon="🐈"
          title={t('tasks.empty.title')}
          description={t('tasks.empty.description')}
          action={
            <View style={styles.emptyActions}>
              <Button
                label={t('tasks.empty.useTemplate')}
                onPress={() => router.push('/task/template')}
              />
              <Button
                variant="secondary"
                label={t('tasks.empty.createOwn')}
                onPress={() => router.push('/task/new')}
              />
            </View>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      floating={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tasks.add')}
          onPress={() => router.push('/task/new')}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      }>
      {header}
      <Card tone="peach">
        <QuickLog />
      </Card>
      {sections.map((section) => (
        <Card key={section.zone?.id ?? 'none'}>
          <Text variant="heading">
            {section.zone ? `${section.zone.icon} ${section.zone.name}` : t('tasks.noZone')}
          </Text>
          {section.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              members={members}
              memberIds={memberIds}
              currentUid={uid}
              onComplete={complete}
              onPress={(pressed) =>
                router.push({ pathname: '/task/[id]', params: { id: pressed.id } })
              }
            />
          ))}
        </Card>
      ))}
      <View style={styles.fabSpace} />
    </Screen>
  );
}

const FAB_SIZE = 60;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  emptyActions: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.peach,
    ...shadows.raised,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabIcon: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.onPeach,
  },
  // Para que el botón flotante no tape la última tarea.
  fabSpace: {
    height: FAB_SIZE,
  },
});
