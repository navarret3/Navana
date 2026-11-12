import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { applyTemplate } from '@/data/tasks';
import { toDateKey } from '@/domain/dates';
import {
  TEMPLATE_ON_DEMAND,
  TEMPLATE_TASKS,
  TEMPLATE_ZONES,
  zonesForTemplate,
} from '@/domain/tasks/template';
import { activeTasks } from '@/domain/tasks/today';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import {
  Button,
  Card,
  Screen,
  ScreenHeader,
  Text,
  colors,
  minTouchSize,
  spacing,
  useGoBack,
} from '@/ui';

type Row = {
  /** Único entre los dos grupos. */
  id: string;
  title: string;
  detail: string;
  icon: string;
  zone: (typeof TEMPLATE_ZONES)[number]['key'];
  effort: 1 | 2 | 3;
  intervalDays: number | null;
  onDemand: boolean;
};

export default function TaskTemplateScreen() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const uid = useSession((state) => state.user?.uid);
  const zones = useTasks((state) => state.zones);
  const existingTitles = new Set(
    activeTasks(useTasks((state) => state.tasks)).map((task) => task.title.toLowerCase()),
  );

  const scheduled: Row[] = TEMPLATE_TASKS.map((task) => ({
    id: `scheduled:${task.key}`,
    title: t(`tasks.template.tasks.${task.key}`),
    detail: `${t('tasks.template.every', { count: task.intervalDays })} · ${t(`tasks.template.zones.${task.zone}`)}`,
    icon: task.icon,
    zone: task.zone,
    effort: task.effort,
    intervalDays: task.intervalDays,
    onDemand: false,
  }));
  const onDemand: Row[] = TEMPLATE_ON_DEMAND.map((task) => ({
    id: `onDemand:${task.key}`,
    title: t(`tasks.template.onDemand.${task.key}`),
    detail: t(`tasks.template.zones.${task.zone}`),
    icon: task.icon,
    zone: task.zone,
    effort: task.effort,
    intervalDays: null,
    onDemand: true,
  }));
  // Lo que ya existe en el hogar no se vuelve a ofrecer.
  const isNew = (row: Row) => !existingTitles.has(row.title.toLowerCase());
  const groups = [
    { title: t('tasks.template.scheduledGroup'), note: null, rows: scheduled.filter(isNew) },
    {
      title: t('tasks.template.onDemandGroup'),
      note: t('tasks.template.onDemandNote'),
      rows: onDemand.filter(isNew),
    },
  ].filter((group) => group.rows.length > 0);
  const available = groups.flatMap((group) => group.rows);

  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(available.map((row) => row.id)),
  );

  if (!household || !uid) return null;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const chosen = available.filter((row) => selected.has(row.id));

  const add = () => {
    const zoneKeys = zonesForTemplate(chosen);
    applyTemplate(household.id, {
      zones: TEMPLATE_ZONES.filter((zone) => zoneKeys.includes(zone.key)).map((zone) => ({
        key: zone.key,
        name: t(`tasks.template.zones.${zone.key}`),
        icon: zone.icon,
      })),
      tasks: chosen.map((row) => ({
        title: row.title,
        icon: row.icon,
        zoneKey: row.zone,
        effort: row.effort,
        intervalDays: row.intervalDays,
        onDemand: row.onDemand,
      })),
      existingZones: zones,
      firstAssigneeId: uid,
      today: toDateKey(new Date()),
    }).catch(saveFailed('No se ha podido añadir la plantilla'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tasks.template.title')} />
      <Text color="inkSoft">{t('tasks.template.subtitle')}</Text>

      {groups.map((group) => (
        <Card key={group.title}>
          <Text variant="heading">{group.title}</Text>
          {group.note ? (
            <Text variant="caption" color="inkSoft">
              {group.note}
            </Text>
          ) : null}
          {group.rows.map((row) => {
            const checked = selected.has(row.id);
            return (
              <Pressable
                key={row.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={row.title}
                onPress={() => toggle(row.id)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={[styles.box, checked && styles.boxChecked]}>
                  {checked ? <Text style={styles.tick}>✓</Text> : null}
                </View>
                <Text style={styles.icon}>{row.icon}</Text>
                <View style={styles.texts}>
                  <Text variant="bodyStrong">{row.title}</Text>
                  <Text variant="caption" color="inkSoft">
                    {row.detail}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      ))}

      <Button
        label={t('tasks.template.submit', { count: chosen.length })}
        disabled={chosen.length === 0}
        onPress={add}
      />
      <Button variant="ghost" label={t('tasks.template.skip')} onPress={goBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.sageDeep,
  },
  tick: {
    color: colors.surface,
    fontSize: 16,
    lineHeight: 20,
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
});
