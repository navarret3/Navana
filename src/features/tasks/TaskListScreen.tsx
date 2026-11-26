import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { findTaskByTitle, LOG_TITLE_MAX, tasksToLog } from '@/domain/tasks/log';
import type { Task } from '@/domain/tasks/types';
import { useTasks } from '@/state/tasks';
import {
  Button,
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

import { useTaskActions } from './useTaskActions';

/** La misma lista del hogar para gestionar sus tareas o registrar una realización. */
export function TaskListScreen({ manage = false }: { manage?: boolean }) {
  const { t, i18n } = useTranslation();
  const goBack = useGoBack();
  const allTasks = useTasks((state) => state.tasks);
  const zones = useTasks((state) => state.zones);
  const { complete } = useTaskActions();
  const [text, setText] = useState('');
  const tasks = useMemo(() => {
    const matches = tasksToLog(allTasks, text);
    return manage
      ? matches.sort((a, b) => a.title.localeCompare(b.title, i18n.language))
      : matches;
  }, [allTasks, text, manage, i18n.language]);

  const select = (task: Task) => {
    if (manage) router.push({ pathname: '/task/[id]', params: { id: task.id } });
    else if (complete(task)) goBack();
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <ScreenHeader title={t(manage ? 'tasks.catalog.title' : 'tasks.log.title')} />
      <Text color="inkSoft">{t(manage ? 'tasks.catalog.intro' : 'tasks.log.hint')}</Text>
      {manage ? (
        <Button label={t('tasks.catalog.add')} onPress={() => router.push('/task/new')} />
      ) : null}
      <TextField
        label={t('tasks.catalog.search')}
        placeholder={t('tasks.log.searchPlaceholder')}
        value={text}
        onChangeText={setText}
        maxLength={LOG_TITLE_MAX}
        returnKeyType="search"
        onSubmitEditing={() => {
          const match = findTaskByTitle(allTasks, text);
          if (match) select(match);
        }}
      />
      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text color="inkSoft">
            {t(text.trim() ? 'tasks.catalog.noMatches' : 'tasks.log.empty')}
          </Text>
        }
        renderItem={({ item: task }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t(manage ? 'tasks.catalog.edit' : 'tasks.log.markDone', { title: task.title })}, ${t('tasks.effort.value', { value: task.effort })}`}
            onPress={() => select(task)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.icon}>{task.icon}</Text>
            <View style={styles.texts}>
              <Text variant="bodyStrong">{task.title}</Text>
              <Text variant="caption" color="inkSoft">
                {[
                  zones.find((zone) => zone.id === task.zoneId)?.name,
                  t('tasks.effort.value', { value: task.effort }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <Text color={manage ? 'inkSoft' : 'sageDeep'}>{manage ? '›' : '✓'}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            {manage ? (
              <Button
                variant="ghost"
                label={t('tasks.log.addTypical')}
                onPress={() => router.push('/task/template')}
              />
            ) : (
              <Button
                variant="secondary"
                label={t('tasks.catalog.manage')}
                onPress={() => router.push('/task/catalog')}
              />
            )}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  footer: { gap: spacing.sm, paddingTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize + 16,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: { fontSize: 22, lineHeight: 31, width: 32, textAlign: 'center' },
  texts: { flex: 1 },
  pressed: { opacity: 0.7 },
});
