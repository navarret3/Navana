import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { LOG_TITLE_MAX, cleanLogTitle, findTaskByTitle, tasksToLog } from '@/domain/tasks/log';
import { TEMPLATE_ON_DEMAND, TEMPLATE_TASKS } from '@/domain/tasks/template';
import { activeTasks } from '@/domain/tasks/today';
import type { Task } from '@/domain/tasks/types';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { useTasks } from '@/state/tasks';
import {
  Button,
  Card,
  Screen,
  ScreenHeader,
  Text,
  TextField,
  colors,
  minTouchSize,
  radii,
  spacing,
  useGoBack,
} from '@/ui';

/**
 * "Realizar tarea": apuntar algo que se acaba de hacer. Se toca en la lista, o se escribe
 * si no está. Queda a nombre de quien lo apunta, en el historial y en el balance.
 */
export default function LogTaskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const allTasks = useTasks((state) => state.tasks);
  const zones = useTasks((state) => state.zones);
  const { complete, logNew } = useTaskActions();
  const [text, setText] = useState('');

  const tasks = tasksToLog(allTasks, text);
  const typed = cleanLogTitle(text);
  // Lo escrito se ofrece como tarea nueva solo si no hay ya una que se llame así.
  const isNew = typed.length > 0 && !findTaskByTitle(allTasks, typed);

  // "Añadir cosas típicas" se ofrece mientras quede algo de la plantilla que no esté en casa.
  const existing = new Set(activeTasks(allTasks).map((task) => task.title.toLowerCase()));
  const templateLeft = [
    ...TEMPLATE_TASKS.map((task) => t(`tasks.template.tasks.${task.key}`)),
    ...TEMPLATE_ON_DEMAND.map((task) => t(`tasks.template.onDemand.${task.key}`)),
  ].some((title) => !existing.has(title.toLowerCase()));

  const zoneName = (task: Task) => zones.find((zone) => zone.id === task.zoneId)?.name;

  const done = (task: Task) => {
    complete(task);
    goBack();
  };

  const addAndDone = () => {
    logNew(typed);
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.log.title')} />
      <TextField
        label={t('tasks.log.searchLabel')}
        placeholder={t('tasks.log.searchPlaceholder')}
        value={text}
        onChangeText={setText}
        maxLength={LOG_TITLE_MAX}
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={() => {
          // Con el teclado, "hecho" apunta lo escrito: la tarea que se llama así o una nueva.
          const match = findTaskByTitle(allTasks, typed);
          if (match) done(match);
          else if (isNew) addAndDone();
        }}
      />

      {tasks.length > 0 ? (
        <Card>
          <Text variant="caption" color="inkSoft">
            {t('tasks.log.hint')}
          </Text>
          {tasks.map((task) => (
            <Pressable
              key={task.id}
              accessibilityRole="button"
              accessibilityLabel={t('tasks.log.markDone', { title: task.title })}
              onPress={() => done(task)}
              onLongPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.icon}>{task.icon}</Text>
              <View style={styles.texts}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {task.title}
                </Text>
                {zoneName(task) ? (
                  <Text variant="caption" color="inkSoft">
                    {zoneName(task)}
                  </Text>
                ) : null}
              </View>
              <View style={styles.check}>
                <Text style={styles.tick}>✓</Text>
              </View>
            </Pressable>
          ))}
          <Text variant="caption" color="inkMuted">
            {t('tasks.log.editHint')}
          </Text>
        </Card>
      ) : isNew ? null : (
        <Text color="inkSoft">{t('tasks.log.empty')}</Text>
      )}

      {/* Lo escrito como tarea nueva va debajo de las que coinciden: lo normal es que sea una de ellas. */}
      {isNew ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tasks.log.addNew', { title: typed })}
          onPress={addAndDone}
          style={({ pressed }) => [styles.addNew, pressed && styles.pressed]}>
          <Text style={styles.icon}>＋</Text>
          <View style={styles.texts}>
            <Text variant="bodyStrong">{t('tasks.log.addNew', { title: typed })}</Text>
            <Text variant="caption" color="inkSoft">
              {t('tasks.log.addNewHint')}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {templateLeft ? (
        <Button
          variant="ghost"
          label={t('tasks.log.addTypical')}
          onPress={() => router.push('/task/template')}
        />
      ) : null}
    </Screen>
  );
}

const CHECK_SIZE = 30;

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
  },
  addNew: {
    minHeight: minTouchSize + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.peach,
    backgroundColor: colors.peachSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 22,
    lineHeight: 28,
    width: 28,
    textAlign: 'center',
  },
  texts: {
    flex: 1,
  },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    color: colors.sageDeep,
    fontSize: 15,
    lineHeight: 19,
  },
});
