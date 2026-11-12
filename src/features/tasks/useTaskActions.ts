import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { archiveTask, completeTask, postponeTask, undoCompletion } from '@/data/tasks';
import { toDateKey } from '@/domain/dates';
import type { Completion, Task } from '@/domain/tasks/types';
import { notifyOthers } from '@/notifications/notify';
import { saveFailed } from '@/state/notices';
import { useCurrentMember, useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';

/**
 * Acciones sobre tareas con el hogar y el usuario actuales ya puestos.
 *
 * Ninguna espera a que el servidor confirme: Firestore aplica el cambio en local al
 * momento y lo sincroniza cuando hay red, así que la app responde igual sin cobertura.
 */
export function useTaskActions() {
  const { t } = useTranslation();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const me = useCurrentMember();
  const setJustCompleted = useTasks((state) => state.setJustCompleted);

  const complete = (task: Task) => {
    if (!household || !uid) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
    const { completion, saved } = completeTask(household.id, task, {
      completedBy: uid,
      today: toDateKey(new Date()),
      memberIds: household.memberIds,
    });
    setJustCompleted(completion);
    saved.catch(saveFailed('No se ha podido completar la tarea'));
    notifyOthers({
      members,
      fromUid: uid,
      pref: 'partnerCompleted',
      message: {
        title: t('notifications.completed.title', { name: me?.name ?? '' }),
        body: t('notifications.completed.body', { icon: task.icon, title: task.title }),
        data: { taskId: task.id },
      },
    });
  };

  /** Recuerda una tarea a quien le toca, con un aviso en su móvil. */
  const nudge = (task: Task, toUid: string) => {
    if (!uid) return;
    notifyOthers({
      members,
      fromUid: uid,
      onlyUid: toUid,
      pref: 'nudges',
      message: {
        title: t('notifications.nudge.title', { name: me?.name ?? '' }),
        body: t('notifications.nudge.body', { icon: task.icon, title: task.title }),
        data: { taskId: task.id },
      },
    });
  };

  const undo = (completion: Completion) => {
    if (!household) return;
    setJustCompleted(null);
    undoCompletion(household.id, completion).catch(saveFailed('No se ha podido deshacer'));
  };

  const postpone = (task: Task, days: number) => {
    if (!household) return;
    postponeTask(household.id, task.id, toDateKey(new Date()), days).catch(
      saveFailed('No se ha podido posponer la tarea'),
    );
  };

  const archive = (task: Task) => {
    if (!household) return;
    archiveTask(household.id, task.id).catch(saveFailed('No se ha podido eliminar la tarea'));
  };

  return { complete, undo, postpone, archive, nudge };
}
