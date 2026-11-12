import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Member } from '@/domain/household';
import { TASK_ICONS } from '@/domain/tasks/template';
import type { Effort, TaskDraft, TaskMode, Zone } from '@/domain/tasks/types';
import { Button, ChipGroup, DateField, OptionPicker, TextField, spacing } from '@/ui';

const TITLE_MAX = 60;
const NO_ZONE = '';

type Frequency = 'repeat' | 'once' | 'onDemand';

type TaskFormProps = {
  initial: TaskDraft;
  zones: readonly Zone[];
  members: readonly Member[];
  submitLabel: string;
  onSubmit: (draft: TaskDraft) => void;
};

/** Formulario de alta y edición de una tarea. */
export function TaskForm({ initial, zones, members, submitLabel, onSubmit }: TaskFormProps) {
  const { t } = useTranslation();
  const firstMember = members[0]?.uid ?? null;

  const [title, setTitle] = useState(initial.title);
  const [icon, setIcon] = useState(initial.icon);
  const [zoneId, setZoneId] = useState(initial.zoneId ?? NO_ZONE);
  const [effort, setEffort] = useState<Effort>(initial.effort);
  const [frequency, setFrequency] = useState<Frequency>(
    initial.onDemand ? 'onDemand' : initial.intervalDays !== null ? 'repeat' : 'once',
  );
  const repeats = frequency === 'repeat';
  const onDemand = frequency === 'onDemand';
  const [interval, setIntervalText] = useState(String(initial.intervalDays ?? 7));
  const [dueOn, setDueOn] = useState(initial.nextDueOn);
  const [mode, setMode] = useState<TaskMode>(initial.mode);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId ?? firstMember);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const submit = () => {
    const cleanTitle = title.replace(/\s+/g, ' ').trim().slice(0, TITLE_MAX);
    const days = Number(interval);
    const validInterval = Number.isInteger(days) && days >= 1 && days <= 365;

    setTitleError(cleanTitle ? null : t('tasks.form.titleRequired'));
    setIntervalError(!repeats || validInterval ? null : t('tasks.form.intervalInvalid'));
    if (!cleanTitle || (repeats && !validInterval)) return;

    onSubmit({
      title: cleanTitle,
      icon,
      zoneId: zoneId === NO_ZONE ? null : zoneId,
      effort,
      // Lo que surge no tiene turno ni responsable.
      mode: onDemand ? 'free' : mode,
      assigneeId: onDemand || mode === 'free' ? null : assigneeId,
      intervalDays: repeats ? days : null,
      onDemand,
      nextDueOn: dueOn,
    });
  };

  const memberOptions = members.map((member) => ({
    value: member.uid,
    label: member.name,
    icon: member.avatar,
  }));

  return (
    <View style={styles.form}>
      <TextField
        label={t('tasks.form.titleLabel')}
        placeholder={t('tasks.form.titlePlaceholder')}
        value={title}
        onChangeText={setTitle}
        maxLength={TITLE_MAX}
        autoCapitalize="sentences"
        error={titleError}
      />
      <OptionPicker
        kind="emoji"
        label={t('tasks.form.iconLabel')}
        options={TASK_ICONS}
        value={icon}
        onChange={setIcon}
      />
      <ChipGroup
        label={t('tasks.form.zoneLabel')}
        options={[
          { value: NO_ZONE, label: t('tasks.noZone') },
          ...zones.map((zone) => ({ value: zone.id, label: zone.name, icon: zone.icon })),
        ]}
        value={zoneId}
        onChange={setZoneId}
      />
      <ChipGroup<Effort>
        label={t('tasks.effort.label')}
        options={[
          { value: 1, label: t('tasks.effort.1') },
          { value: 2, label: t('tasks.effort.2') },
          { value: 3, label: t('tasks.effort.3') },
        ]}
        value={effort}
        onChange={setEffort}
      />
      <ChipGroup<Frequency>
        label={t('tasks.form.frequencyLabel')}
        options={[
          { value: 'repeat', label: t('tasks.form.repeat') },
          { value: 'once', label: t('tasks.form.once') },
          { value: 'onDemand', label: t('tasks.form.onDemand') },
        ]}
        value={frequency}
        onChange={setFrequency}
        hint={onDemand ? t('tasks.form.onDemandHint') : undefined}
      />
      {repeats ? (
        <TextField
          label={t('tasks.form.everyLabel')}
          value={interval}
          onChangeText={(value) => setIntervalText(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
          error={intervalError}
          hint={t('tasks.form.everyHint')}
        />
      ) : null}
      {onDemand ? null : (
        <DateField label={t('tasks.form.dueLabel')} value={dueOn} onChange={setDueOn} />
      )}
      {onDemand ? null : (
      <ChipGroup<TaskMode>
        label={t('tasks.form.modeLabel')}
        options={[
          { value: 'rotation', label: t('tasks.mode.rotation') },
          { value: 'fixed', label: t('tasks.mode.fixed') },
          { value: 'free', label: t('tasks.mode.free') },
        ]}
        value={mode}
        onChange={setMode}
        hint={t(`tasks.modeHint.${mode}`)}
      />
      )}
      {!onDemand && mode !== 'free' && assigneeId ? (
        <ChipGroup
          label={mode === 'fixed' ? t('tasks.form.assigneeLabel') : t('tasks.form.firstTurnLabel')}
          options={memberOptions}
          value={assigneeId}
          onChange={setAssigneeId}
        />
      ) : null}

      <Button label={submitLabel} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});
