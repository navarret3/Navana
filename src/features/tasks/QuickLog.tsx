import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { TEMPLATE_ON_DEMAND, TEMPLATE_TASKS } from '@/domain/tasks/template';
import { activeTasks, onDemandTasks } from '@/domain/tasks/today';
import { useTasks } from '@/state/tasks';
import { Chip, Text, spacing } from '@/ui';

import { useTaskActions } from './useTaskActions';

/**
 * Apuntar algo hecho que no estaba planeado (barrer, tender, fregar los platos…).
 * Un toque en la pastilla lo registra a nombre de quien lo toca, con opción de deshacer.
 * Solo está en la pestaña Tareas: en "Hoy" no se enseña, para que allí quede solo lo que toca.
 */
export function QuickLog() {
  const { t } = useTranslation();
  const router = useRouter();
  const allTasks = useTasks((state) => state.tasks);
  const tasks = onDemandTasks(allTasks);
  const { complete } = useTaskActions();

  // "Añadir cosas típicas" se ofrece mientras quede algo de la plantilla que no esté en casa.
  const existing = new Set(activeTasks(allTasks).map((task) => task.title.toLowerCase()));
  const templateLeft = [
    ...TEMPLATE_TASKS.map((task) => t(`tasks.template.tasks.${task.key}`)),
    ...TEMPLATE_ON_DEMAND.map((task) => t(`tasks.template.onDemand.${task.key}`)),
  ].some((title) => !existing.has(title.toLowerCase()));

  return (
    <View style={styles.root}>
      <Text variant="heading">✍️ {t('tasks.quickLog.title')}</Text>
      <Text variant="caption" color="inkSoft">
        {tasks.length > 0 ? t('tasks.quickLog.hint') : t('tasks.quickLog.empty')}
      </Text>
      <View style={styles.chips}>
        {tasks.map((task) => (
          <Chip
            key={task.id}
            role="button"
            icon={task.icon}
            label={task.title}
            onPress={() => complete(task)}
            onLongPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
          />
        ))}
        <Chip
          role="button"
          icon="＋"
          label={t('tasks.quickLog.add')}
          onPress={() => router.push({ pathname: '/task/new', params: { onDemand: '1' } })}
        />
        {templateLeft ? (
          <Chip
            role="button"
            icon="🧺"
            label={t('tasks.quickLog.addTypical')}
            onPress={() => router.push('/task/template')}
          />
        ) : null}
      </View>
      {tasks.length === 0 ? null : (
        <Text variant="caption" color="inkMuted">
          {t('tasks.quickLog.editHint')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
