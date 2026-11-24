import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Member } from '@/domain/household';
import { INTERVAL_PRESETS, iconForTitle, suggestChores, type Chore } from '@/domain/tasks/chores';
import { TASK_ICONS, TEMPLATE_ZONES } from '@/domain/tasks/template';
import type { Effort, TaskDraft, TaskMode, Zone } from '@/domain/tasks/types';
import {
  BottomSheet,
  Button,
  DateField,
  OptionPicker,
  SelectField,
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
/** Valor de "Otro…" entre las frecuencias. */
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
   * Los detalles opcionales se despliegan también al editar. Las tareas puntuales se apuntan aparte.
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
  const [showMore, setShowMore] = useState(false);
  const [choosingIcon, setChoosingIcon] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const suggestions =
    isNew && title.trim() && title !== picked ? suggestChores(title, existingTitles, 4, true) : [];

  const changeTitle = (value: string) => {
    setTitle(value);
    if (value.trim()) setTitleError(null);
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
        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((chore) => (
              <Pressable
                key={chore.title}
                accessibilityRole="button"
                accessibilityLabel={`${chore.title}, ${choreCaption(chore)}`}
                onPress={() => pick(chore)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}>
                <Text style={styles.suggestionIcon}>{chore.icon}</Text>
                <View style={styles.grow}>
                  <Text>{chore.title}</Text>
                  <Text variant="caption" color="inkSoft">
                    {choreCaption(chore)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {!isNew ? (
        <SelectField<Frequency>
          label={t('tasks.form.typeLabel')}
          options={[
            { value: 'repeat', label: t('tasks.form.repeat') },
            { value: 'once', label: t('tasks.form.once') },
            {
              value: 'onDemand',
              label: t('tasks.form.onDemand'),
              description: t('tasks.form.onDemandHint'),
            },
          ]}
          value={frequency}
          onChange={setFrequency}
        />
      ) : null}

      {!onDemand ? (
        <View style={styles.section}>
          <Text variant="heading" accessibilityRole="header">
            {t('tasks.form.scheduleSection')}
          </Text>
          {repeats ? (
            <SelectField<number>
              label={t('tasks.form.frequencyLabel')}
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
              onChangeText={(value) => {
                const digits = value.replace(/[^0-9]/g, '');
                setIntervalText(digits);
                if (Number(digits) >= 1 && Number(digits) <= 365) setIntervalError(null);
              }}
              keyboardType="number-pad"
              maxLength={3}
              error={intervalError}
              hint={t('tasks.form.everyHint')}
            />
          ) : null}
          <DateField
            label={t(isNew ? 'tasks.form.firstDueLabel' : 'tasks.form.dueLabel')}
            value={dueOn}
            onChange={setDueOn}
          />
        </View>
      ) : null}

      {!onDemand ? (
        <View style={styles.section}>
          <Text variant="heading" accessibilityRole="header">
            {t('tasks.form.assignmentSection')}
          </Text>
          <SelectField<TaskMode>
            label={t('tasks.form.modeLabel')}
            options={(['rotation', 'fixed', 'free'] as const).map((value) => ({
              value,
              label: t(`tasks.mode.${value}`),
              description: t(`tasks.modeHint.${value}`),
            }))}
            value={mode}
            onChange={setMode}
          />
          {mode !== 'free' && assigneeId ? (
            <SelectField
              label={t(mode === 'fixed' ? 'tasks.form.assigneeLabel' : 'tasks.form.firstTurnLabel')}
              options={memberOptions}
              value={assigneeId}
              onChange={setAssigneeId}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.details}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showMore }}
          accessibilityLabel={t('tasks.form.moreOptions')}
          onPress={() => setShowMore(!showMore)}
          style={({ pressed }) => [styles.detailsToggle, pressed && styles.pressed]}>
          <View style={styles.grow}>
            <Text variant="bodyStrong">{t('tasks.form.moreOptions')}</Text>
            <Text variant="caption" color="inkSoft">
              {t('tasks.form.moreOptionsHint')}
            </Text>
          </View>
          <Text color="inkSoft">{showMore ? '⌃' : '⌄'}</Text>
        </Pressable>
        {showMore ? (
          <View style={styles.detailFields}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tasks.form.iconLabel')}
              onPress={() => setChoosingIcon(true)}
              style={styles.iconField}>
              <Text style={styles.suggestionIcon}>{icon}</Text>
              <Text style={styles.grow}>{t('tasks.form.iconLabel')}</Text>
              <Text color="inkSoft">›</Text>
            </Pressable>
            <SelectField
              label={t('tasks.form.zoneLabel')}
              value={zoneId}
              onChange={setZoneId}
              options={[
                { value: NO_ZONE, label: t('tasks.noZone') },
                ...zones.map((zone) => ({ value: zone.id, label: zone.name, icon: zone.icon })),
              ]}
            />
            <SelectField<Effort>
              label={t('tasks.effort.label')}
              value={effort}
              onChange={setEffort}
              options={([1, 2, 3] as const).map((value) => ({
                value,
                label: t(`tasks.effort.${value}`),
              }))}
            />
          </View>
        ) : null}
      </View>
      <BottomSheet
        visible={choosingIcon}
        title={t('tasks.form.iconLabel')}
        onClose={() => setChoosingIcon(false)}>
        <OptionPicker
          kind="emoji"
          label={t('tasks.form.iconLabel')}
          options={
            (TASK_ICONS as readonly string[]).includes(icon) ? TASK_ICONS : [icon, ...TASK_ICONS]
          }
          value={icon}
          onChange={(value) => {
            setIcon(value);
            setIconChosen(true);
            setChoosingIcon(false);
          }}
        />
      </BottomSheet>
      <Button label={submitLabel} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl },
  group: { gap: spacing.xs },
  section: { gap: spacing.md },
  grow: { flex: 1 },
  details: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchSize,
    paddingVertical: spacing.md,
  },
  detailFields: { gap: spacing.md, paddingBottom: spacing.lg },
  iconField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
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
    paddingVertical: spacing.sm,
  },
  suggestionIcon: { fontSize: 18, lineHeight: 26, width: 26, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
