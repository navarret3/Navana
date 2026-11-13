import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Member } from '@/domain/household';
import {
  INTERVAL_PRESETS,
  iconForTitle,
  suggestChores,
  type Chore,
} from '@/domain/tasks/chores';
import { TASK_ICONS, TEMPLATE_ZONES } from '@/domain/tasks/template';
import type { Effort, TaskDraft, TaskMode, Zone } from '@/domain/tasks/types';
import {
  Button,
  Chip,
  ChipGroup,
  DateField,
  MoreRow,
  OptionPicker,
  Text,
  TextField,
  colors,
  minTouchSize,
  radii,
  shadows,
  spacing,
} from '@/ui';

const TITLE_MAX = 60;
const NO_ZONE = '';
/** Valor de la pastilla "Otro…" entre las frecuencias. */
const CUSTOM = 0;

type Frequency = 'repeat' | 'once' | 'onDemand';

type TaskFormProps = {
  initial: TaskDraft;
  zones: readonly Zone[];
  members: readonly Member[];
  submitLabel: string;
  onSubmit: (draft: TaskDraft) => void;
  /**
   * Alta de una tarea recurrente: propone tareas habituales mientras se escribe, elige el
   * icono solo, no pregunta si se repite (siempre) y deja plegado lo que casi nunca se toca.
   * Al editar se ve todo. Las tareas puntuales no pasan por aquí: se apuntan en "Tarea puntual".
   */
  isNew?: boolean;
  /** Títulos de las tareas que ya hay en el hogar, para no proponerlas otra vez. */
  existingTitles?: readonly string[];
};

const isPreset = (days: number | null) =>
  days !== null && (INTERVAL_PRESETS as readonly number[]).includes(days);

/** Formulario de alta y edición de una tarea. */
export function TaskForm({
  initial,
  zones,
  members,
  submitLabel,
  onSubmit,
  isNew = false,
  existingTitles = [],
}: TaskFormProps) {
  const { t } = useTranslation();
  const firstMember = members[0]?.uid ?? null;

  const [title, setTitle] = useState(initial.title);
  const [icon, setIcon] = useState(initial.icon);
  // Mientras no se elija un icono a mano, sigue al título ("Sacar la basura" → 🗑️).
  const [iconChosen, setIconChosen] = useState(!isNew);
  /** Título de la tarea habitual que se acaba de elegir: ya no hace falta proponer nada. */
  const [picked, setPicked] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState(initial.zoneId ?? NO_ZONE);
  const [effort, setEffort] = useState<Effort>(initial.effort);
  const [frequency, setFrequency] = useState<Frequency>(
    initial.onDemand ? 'onDemand' : initial.intervalDays !== null ? 'repeat' : 'once',
  );
  const repeats = frequency === 'repeat';
  const onDemand = frequency === 'onDemand';
  const [interval, setIntervalText] = useState(String(initial.intervalDays ?? 7));
  const [customInterval, setCustomInterval] = useState(
    initial.intervalDays !== null && !isPreset(initial.intervalDays),
  );
  const [dueOn, setDueOn] = useState(initial.nextDueOn);
  const [mode, setMode] = useState<TaskMode>(initial.mode);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId ?? firstMember);
  const [showMore, setShowMore] = useState(!isNew);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const suggestions =
    isNew && title !== picked ? suggestChores(title, existingTitles, 5, true) : [];

  const changeTitle = (value: string) => {
    setTitle(value);
    if (iconChosen) return;
    const auto = iconForTitle(value);
    if (auto) setIcon(auto);
  };

  const pick = (chore: Chore) => {
    setTitle(chore.title);
    setPicked(chore.title);
    setTitleError(null);
    setIcon(chore.icon);
    setEffort(chore.effort);
    // Las zonas del hogar no guardan de qué plantilla salieron: se reconocen por el icono.
    const zoneIcon = TEMPLATE_ZONES.find((zone) => zone.key === chore.zone)?.icon;
    setZoneId(zones.find((zone) => zone.icon === zoneIcon)?.id ?? NO_ZONE);
    if (chore.intervalDays === null) {
      setFrequency('onDemand');
    } else {
      setFrequency('repeat');
      setIntervalText(String(chore.intervalDays));
      setCustomInterval(!isPreset(chore.intervalDays));
    }
  };

  const submit = () => {
    const cleanTitle = title.replace(/\s+/g, ' ').trim().slice(0, TITLE_MAX);
    const days = Number(interval);
    const validInterval = Number.isInteger(days) && days >= 1 && days <= 365;

    setTitleError(cleanTitle ? null : t('tasks.form.titleRequired'));
    setIntervalError(!repeats || validInterval ? null : t('tasks.form.intervalInvalid'));
    if (repeats && !validInterval) setCustomInterval(true);
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

  const choreCaption = (chore: Chore) =>
    chore.intervalDays === null
      ? t('tasks.form.onDemand')
      : t('tasks.template.every', { count: chore.intervalDays });

  return (
    <View style={styles.form}>
      <View style={styles.group}>
        <TextField
          label={t('tasks.form.titleLabel')}
          placeholder={t('tasks.form.titlePlaceholder')}
          value={title}
          onChangeText={changeTitle}
          maxLength={TITLE_MAX}
          autoCapitalize="sentences"
          error={titleError}
        />
        {suggestions.length === 0 ? null : title.trim() ? (
          <View style={styles.suggestions}>
            {suggestions.map((chore) => (
              <Pressable
                key={chore.title}
                accessibilityRole="button"
                accessibilityLabel={`${chore.title}, ${choreCaption(chore)}`}
                onPress={() => pick(chore)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}>
                <Text style={styles.suggestionIcon}>{chore.icon}</Text>
                <Text style={styles.suggestionTitle}>{chore.title}</Text>
                <Text variant="caption" color="inkSoft">
                  {choreCaption(chore)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.group}>
            <Text variant="caption" color="inkSoft">
              {t('tasks.form.ideas')}
            </Text>
            <View style={styles.chips}>
              {suggestions.map((chore) => (
                <Chip
                  key={chore.title}
                  role="button"
                  icon={chore.icon}
                  label={chore.title}
                  onPress={() => pick(chore)}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      {isNew ? null : (
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
      )}
      {repeats ? (
        <ChipGroup<number>
          label={t('tasks.form.everyLabel')}
          options={[
            ...INTERVAL_PRESETS.map((days) => ({
              value: days,
              label: t(`tasks.form.presets.${days}`),
            })),
            { value: CUSTOM, label: t('tasks.form.presets.custom') },
          ]}
          value={customInterval || !isPreset(Number(interval)) ? CUSTOM : Number(interval)}
          onChange={(days) => {
            setCustomInterval(days === CUSTOM);
            if (days !== CUSTOM) {
              setIntervalText(String(days));
              setIntervalError(null);
            }
          }}
          hint={customInterval ? undefined : t('tasks.form.everyHint')}
        />
      ) : null}
      {repeats && customInterval ? (
        <TextField
          label={t('tasks.form.customLabel')}
          value={interval}
          onChangeText={(value) => setIntervalText(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
          error={intervalError}
          hint={t('tasks.form.everyHint')}
        />
      ) : null}

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

      {showMore ? (
        <>
          <OptionPicker
            kind="emoji"
            label={t('tasks.form.iconLabel')}
            // El icono puede venir de una tarea habitual y no estar entre los de elegir.
            options={(TASK_ICONS as readonly string[]).includes(icon) ? TASK_ICONS : [icon, ...TASK_ICONS]}
            value={icon}
            onChange={(value) => {
              setIcon(value);
              setIconChosen(true);
            }}
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
          {onDemand ? null : (
            <DateField label={t('tasks.form.dueLabel')} value={dueOn} onChange={setDueOn} />
          )}
        </>
      ) : (
        <MoreRow
          label={t('tasks.form.moreOptions')}
          hint={t('tasks.form.moreOptionsHint')}
          icon={icon}
          onPress={() => setShowMore(true)}
        />
      )}

      <Button label={submitLabel} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestions: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  suggestion: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  suggestionIcon: {
    fontSize: 18,
    lineHeight: 24,
    width: 26,
    textAlign: 'center',
  },
  suggestionTitle: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
