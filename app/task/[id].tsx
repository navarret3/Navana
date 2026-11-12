import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { updateTask } from '@/data/tasks';
import { toDateKey } from '@/domain/dates';
import { currentAssignee } from '@/domain/tasks/rotation';
import type { TaskDraft } from '@/domain/tasks/types';
import { TaskForm } from '@/features/tasks/TaskForm';
import { useDueLabel } from '@/features/tasks/TaskRow';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { ActionSheet, Button, Card, Screen, ScreenHeader, Text, spacing, useGoBack } from '@/ui';

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const zones = useTasks((state) => state.zones);
  const task = useTasks((state) => state.tasks.find((candidate) => candidate.id === id));
  const { complete, postpone, archive, nudge } = useTaskActions();
  const dueLabel = useDueLabel();
  const [postponing, setPostponing] = useState(false);
  const [nudged, setNudged] = useState(false);
  const uid = useSession((state) => state.user?.uid);

  if (!household || !task) return null;

  const due = dueLabel(task.nextDueOn, toDateKey(new Date()));
  const assigneeId = currentAssignee(task, household.memberIds);
  const isOthers = !task.onDemand && assigneeId !== null && assigneeId !== uid;

  const save = (draft: TaskDraft) => {
    updateTask(household.id, task.id, draft).catch(saveFailed('No se ha podido guardar la tarea'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.form.editTitle')} />

      <Card tone="sage">
        <Text variant="heading">
          {task.icon} {task.title}
        </Text>
        <Text variant="caption" color={task.onDemand ? 'inkSoft' : due.color}>
          {task.onDemand ? t('tasks.form.onDemand') : due.label}
        </Text>
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              label={task.onDemand ? t('tasks.actions.iDidIt') : t('tasks.actions.markDone')}
              onPress={() => {
                complete(task);
                goBack();
              }}
            />
          </View>
          {task.onDemand ? null : (
            <View style={styles.action}>
              <Button
                variant="secondary"
                label={t('tasks.actions.postpone')}
                onPress={() => setPostponing(true)}
              />
            </View>
          )}
        </View>
        {isOthers ? (
          <Button
            variant="ghost"
            label={nudged ? t('tasks.actions.nudgeSent') : t('tasks.actions.nudge')}
            disabled={nudged}
            onPress={() => {
              nudge(task, assigneeId);
              setNudged(true);
            }}
          />
        ) : null}
      </Card>

      <TaskForm
        key={task.id}
        initial={task}
        zones={zones}
        members={members}
        submitLabel={t('common.save')}
        onSubmit={save}
      />

      <Button
        variant="ghost"
        label={t('tasks.actions.archive')}
        onPress={() => {
          archive(task);
          goBack();
        }}
      />

      <ActionSheet
        visible={postponing}
        title={t('tasks.postpone.title')}
        onClose={() => setPostponing(false)}
        options={[
          { label: t('tasks.postpone.tomorrow'), days: 1 },
          { label: t('tasks.postpone.threeDays'), days: 3 },
          { label: t('tasks.postpone.week'), days: 7 },
        ].map(({ label, days }) => ({
          label,
          onPress: () => {
            postpone(task, days);
            goBack();
          },
        }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
});
