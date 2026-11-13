import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Member } from '@/domain/household';
import { dueStatus, isDue } from '@/domain/tasks/recurrence';
import { currentAssignee } from '@/domain/tasks/rotation';
import type { Task, Zone } from '@/domain/tasks/types';
import { Avatar, Text, colors, minTouchSize, radii, spacing, type ColorName } from '@/ui';

type TaskRowProps = {
  task: Task;
  today: string;
  members: readonly Member[];
  memberIds: readonly string[];
  currentUid: string | undefined;
  /** Zona que se muestra junto a la fecha; se omite cuando la lista ya va agrupada por zonas. */
  zone?: Zone;
  onComplete: (task: Task) => void;
  onPress?: (task: Task) => void;
  /**
   * Avisar a quien le toca. Con esto, las tareas de otra persona que tocan hoy o van con
   * retraso llevan una campana para recordárselo con un aviso en su móvil.
   */
  onNudge?: (task: Task, toUid: string) => void;
};

/** Texto y color de "cuándo toca" una tarea. */
export function useDueLabel() {
  const { t } = useTranslation();
  return (nextDueOn: string, today: string): { label: string; color: ColorName } => {
    const status = dueStatus(nextDueOn, today);
    if (status.kind === 'overdue') {
      return { label: t('tasks.due.overdue', { count: status.days }), color: 'danger' };
    }
    if (status.kind === 'today') return { label: t('tasks.due.today'), color: 'peachDeep' };
    if (status.days === 1) return { label: t('tasks.due.tomorrow'), color: 'inkSoft' };
    return { label: t('tasks.due.upcoming', { count: status.days }), color: 'inkSoft' };
  };
}

export function TaskRow({
  task,
  today,
  members,
  memberIds,
  currentUid,
  zone,
  onComplete,
  onPress,
  onNudge,
}: TaskRowProps) {
  const { t } = useTranslation();
  const [nudged, setNudged] = useState(false);
  const dueLabel = useDueLabel();
  const due = dueLabel(task.nextDueOn, today);

  const assigneeId = currentAssignee(task, memberIds);
  const assignee = members.find((member) => member.uid === assigneeId);
  const isOthers = assigneeId !== null && assigneeId !== currentUid;
  const canNudge = onNudge !== undefined && isOthers && isDue(task.nextDueOn, today);

  const details = [zone ? `${zone.icon} ${zone.name}` : null, '●'.repeat(task.effort)].filter(
    Boolean,
  );

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false }}
        accessibilityLabel={
          isOthers
            ? `${t('tasks.actions.iDidIt')}: ${task.title}`
            : t('tasks.actions.complete', { title: task.title })
        }
        hitSlop={spacing.xs}
        onPress={() => onComplete(task)}
        style={({ pressed }) => [styles.check, pressed && styles.checkPressed]}
      />
      <Pressable
        accessibilityRole="button"
        disabled={!onPress}
        onPress={() => onPress?.(task)}
        style={({ pressed }) => [styles.body, pressed && styles.bodyPressed]}>
        <Text style={styles.icon}>{task.icon}</Text>
        <View style={styles.texts}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {task.title}
          </Text>
          <Text variant="caption" color="inkSoft">
            <Text variant="caption" color={due.color}>
              {due.label}
            </Text>
            {details.length > 0 ? ` · ${details.join(' · ')}` : ''}
          </Text>
        </View>
        {assignee ? (
          <Avatar emoji={assignee.avatar} name={assignee.name} color={assignee.color} size={32} />
        ) : (
          <Text variant="label" color="inkMuted">
            {t('tasks.assignee.free')}
          </Text>
        )}
      </Pressable>
      {canNudge && assigneeId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            nudged
              ? t('tasks.actions.nudgeSent')
              : t('tasks.actions.nudgeTo', { name: assignee?.name ?? '', title: task.title })
          }
          disabled={nudged}
          hitSlop={spacing.xs}
          onPress={() => {
            onNudge(task, assigneeId);
            setNudged(true);
          }}
          style={({ pressed }) => [styles.nudge, pressed && styles.bodyPressed]}>
          <Text style={styles.nudgeIcon}>{nudged ? '✓' : '🔔'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.sageDeep,
    backgroundColor: colors.surface,
  },
  // Respuesta al toque: el círculo se llena y se encoge un poco.
  checkPressed: {
    backgroundColor: colors.sage,
    transform: [{ scale: 0.85 }],
  },
  body: {
    flex: 1,
    minHeight: minTouchSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
  },
  bodyPressed: {
    backgroundColor: colors.surfaceSunken,
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
  nudge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  nudgeIcon: {
    fontSize: 18,
    lineHeight: 24,
  },
});
