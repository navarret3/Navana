import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { toDateKey } from '@/domain/dates';
import { groupForToday } from '@/domain/tasks/today';
import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Text } from '@/ui';

import { TaskRow } from './TaskRow';
import { useTaskActions } from './useTaskActions';

/**
 * Tarjeta de "Hoy": solo las tareas recurrentes que me tocan a mí, de hoy o atrasadas.
 * Lo de la otra persona, lo libre y las tareas puntuales están en la pestaña Tareas.
 */
export function TasksTodayCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const tasks = useTasks((state) => state.tasks);
  const zones = useTasks((state) => state.zones);
  const { complete } = useTaskActions();

  const today = toDateKey(new Date());
  const memberIds = household?.memberIds ?? [];
  const { mine } = groupForToday(tasks, { today, uid: uid ?? '', memberIds });

  return (
    <TodaySummaryCard icon="🧹" title={t('tasks.todayCard.title')}>
      {mine.length === 0 ? <Text color="inkSoft">{t('tasks.todayCard.empty')}</Text> : null}
      {mine.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          today={today}
          members={members}
          memberIds={memberIds}
          currentUid={uid}
          zone={zones.find((zone) => zone.id === task.zoneId)}
          onComplete={complete}
          onPress={(pressed) => router.push({ pathname: '/task/[id]', params: { id: pressed.id } })}
        />
      ))}
    </TodaySummaryCard>
  );
}
