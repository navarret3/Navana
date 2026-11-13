import { useTranslation } from 'react-i18next';

import { createTask } from '@/data/tasks';
import { toDateKey } from '@/domain/dates';
import { TASK_ICONS } from '@/domain/tasks/template';
import type { TaskDraft } from '@/domain/tasks/types';
import { TaskForm } from '@/features/tasks/TaskForm';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Screen, ScreenHeader, useGoBack } from '@/ui';

export default function NewTaskScreen() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const zones = useTasks((state) => state.zones);
  const tasks = useTasks((state) => state.tasks);

  if (!household || !uid) return null;

  const initial: TaskDraft = {
    title: '',
    icon: TASK_ICONS[0],
    zoneId: null,
    effort: 2,
    mode: 'rotation',
    assigneeId: uid,
    intervalDays: 7,
    onDemand: false,
    nextDueOn: toDateKey(new Date()),
  };

  const create = (draft: TaskDraft) => {
    createTask(household.id, draft).catch(saveFailed('No se ha podido crear la tarea'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.form.newTitle')} />
      <TaskForm
        initial={initial}
        zones={zones}
        members={members}
        submitLabel={t('tasks.form.create')}
        isNew
        existingTitles={tasks.filter((task) => !task.archived).map((task) => task.title)}
        onSubmit={create}
      />
    </Screen>
  );
}
