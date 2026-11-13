import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { toDateKey } from '@/domain/dates';
import { byDueDate, scheduledTasks } from '@/domain/tasks/today';
import type { Task, Zone } from '@/domain/tasks/types';
import { TaskRow } from '@/features/tasks/TaskRow';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Button, Card, Chip, EmptyState, Screen, Text, spacing } from '@/ui';

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

/**
 * Pestaña Tareas. Hay dos clases y cada una tiene su botón:
 * - puntual: algo que se acaba de hacer; se apunta sin elegir nada más;
 * - recurrente: se repite cada cierto tiempo y le toca a alguien; son las que se listan aquí.
 */
export default function TasksScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const zones = useTasks((state) => state.zones);
  const tasks = scheduledTasks(useTasks((state) => state.tasks));
  const { complete, nudge } = useTaskActions();

  const today = toDateKey(new Date());
  const memberIds = household?.memberIds ?? [];
  const sections = sectionsByZone(tasks, zones);

  return (
    <Screen>
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

      <View style={styles.actions}>
        <Button label={t('tasks.log.button')} onPress={() => router.push('/task/log')} />
        <Text variant="caption" color="inkSoft" center>
          {t('tasks.log.buttonHint')}
        </Text>
        <Button
          variant="secondary"
          label={t('tasks.addRecurring')}
          onPress={() => router.push('/task/new')}
        />
        <Text variant="caption" color="inkSoft" center>
          {t('tasks.addRecurringHint')}
        </Text>
      </View>

      {sections.length === 0 ? (
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
          <Text variant="label" color="inkSoft">
            {t('tasks.recurringHeading')}
          </Text>
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
                  onNudge={nudge}
                  onPress={(pressed) =>
                    router.push({ pathname: '/task/[id]', params: { id: pressed.id } })
                  }
                />
              ))}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  actions: {
    gap: spacing.xs,
  },
});
