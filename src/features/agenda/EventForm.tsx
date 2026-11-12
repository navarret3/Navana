import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import {
  ALL_DAY_REMINDERS,
  EVENT_ICONS,
  EVERYONE,
  EVENT_TYPES,
  TIMED_REMINDERS,
  isValidTime,
  ownerOf,
  type EventDraft,
  type EventType,
} from '@/domain/agenda/types';
import type { Member } from '@/domain/household';
import {
  Button,
  Chip,
  ChipGroup,
  DateField,
  ListRow,
  MoreRow,
  Text,
  TextField,
  colors,
  spacing,
} from '@/ui';

const TITLE_MAX = 80;

type EventFormProps = {
  initial: EventDraft;
  members: readonly Member[];
  submitLabel: string;
  onSubmit: (draft: EventDraft) => void;
  /**
   * Alta de un evento: basta con qué es, el título, de quién es y el día. La hora y los
   * recordatorios quedan plegados. Al editar se ve todo.
   */
  isNew?: boolean;
};

/** Escribe la hora mientras se teclea: "1830" pasa a "18:30". */
function formatTime(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

/**
 * Formulario de alta y edición de un evento de la agenda. El lugar y las notas ya no se
 * piden; los eventos que los tenían los conservan.
 */
export function EventForm({ initial, members, submitLabel, onSubmit, isNew = false }: EventFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial.title);
  const [type, setType] = useState<EventType>(initial.type);
  const [date, setDate] = useState(initial.date);
  const [allDay, setAllDay] = useState(initial.time === null);
  const [time, setTime] = useState(initial.time ?? '');
  const [severalDays, setSeveralDays] = useState(initial.endDate !== null);
  const [endDate, setEndDate] = useState(initial.endDate ?? initial.date);
  // De quién es: de todo el hogar o de una persona concreta.
  const [owner, setOwner] = useState<string>(() =>
    ownerOf(
      initial,
      members.map((member) => member.uid),
    ),
  );
  const [reminders, setReminders] = useState<readonly number[]>(initial.reminders);
  const [showMore, setShowMore] = useState(!isNew);
  const [errors, setErrors] = useState<{ title?: string; time?: string; endDate?: string }>({});

  // Ya no se crean eventos anuales, pero los cumpleaños guardados antes se siguen repitiendo
  // cada año. Son siempre de un día entero.
  const yearly = initial.yearly;
  const wholeDay = allDay || yearly;
  const reminderOptions = wholeDay ? ALL_DAY_REMINDERS : TIMED_REMINDERS;
  // En un viaje lo normal es que dure varios días: eso se pregunta sin desplegar nada.
  const daysUpFront = type === 'trip' || severalDays;

  const toggle = <T,>(list: readonly T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const submit = () => {
    const cleanTitle = title.replace(/\s+/g, ' ').trim().slice(0, TITLE_MAX);
    const multiDay = severalDays && !yearly;
    const found = {
      title: cleanTitle ? undefined : t('agenda.form.titleRequired'),
      time: wholeDay || isValidTime(time) ? undefined : t('agenda.form.timeInvalid'),
      endDate: multiDay && endDate < date ? t('agenda.form.endBeforeStart') : undefined,
    };
    setErrors(found);
    // El error de la hora está en la parte plegada: hay que enseñarla.
    if (found.time) setShowMore(true);
    if (found.title || found.time || found.endDate) return;

    onSubmit({
      title: cleanTitle,
      type,
      date,
      endDate: multiDay && endDate > date ? endDate : null,
      time: wholeDay ? null : time,
      // Ya no se editan: se conserva lo que el evento tuviera.
      location: initial.location,
      notes: initial.notes,
      // Sin participantes significa "de todo el hogar".
      participants:
        owner !== EVERYONE && members.some((member) => member.uid === owner) ? [owner] : [],
      // Solo se guardan los avisos que tienen sentido para este tipo de evento.
      reminders: reminders.filter((minutes) => (reminderOptions as readonly number[]).includes(minutes)),
      yearly,
    });
  };

  const reminderChip = (minutes: number, label: string) => (
    <Chip
      key={minutes}
      role="button"
      label={label}
      selected={reminders.includes(minutes)}
      onPress={() => setReminders(toggle(reminders, minutes))}
    />
  );

  const severalDaysFields = yearly ? null : (
    <>
      <ListRow
        title={t('agenda.form.severalDays')}
        trailing={
          <Switch
            accessibilityLabel={t('agenda.form.severalDays')}
            value={severalDays}
            onValueChange={setSeveralDays}
            trackColor={{ false: colors.border, true: colors.sage }}
            thumbColor={colors.white}
          />
        }
      />
      {severalDays ? (
        <DateField
          label={t('agenda.form.endDateLabel')}
          value={endDate < date ? date : endDate}
          onChange={setEndDate}
          error={errors.endDate}
        />
      ) : null}
    </>
  );

  return (
    <View style={styles.form}>
      <ChipGroup<EventType>
        label={t('agenda.form.typeLabel')}
        options={EVENT_TYPES.map((value) => ({
          value,
          label: t(`agenda.types.${value}`),
          icon: EVENT_ICONS[value],
        }))}
        value={type}
        onChange={setType}
      />
      <TextField
        label={t('agenda.form.titleLabel')}
        placeholder={t(`agenda.form.titlePlaceholder.${type}`)}
        value={title}
        onChangeText={setTitle}
        maxLength={TITLE_MAX}
        autoCapitalize="sentences"
        error={errors.title}
      />
      <ChipGroup<string>
        label={t('agenda.form.participantsLabel')}
        options={[
          {
            value: EVERYONE,
            label: members.length > 2 ? t('agenda.whose.everyone') : t('agenda.whose.both'),
            icon: '👥',
          },
          ...members.map((member) => ({
            value: member.uid,
            label: member.name,
            icon: member.avatar,
          })),
        ]}
        value={owner}
        onChange={setOwner}
        hint={members.length > 1 ? undefined : t('agenda.form.participantsAlone')}
      />
      <DateField label={t('agenda.form.dateLabel')} value={date} onChange={setDate} />
      {daysUpFront ? severalDaysFields : null}

      {yearly ? (
        <Text variant="caption" color="inkSoft">
          {t('agenda.form.yearlyNote')}
        </Text>
      ) : null}

      {showMore ? (
        <>
          {yearly ? null : (
            <>
              <ListRow
                title={t('agenda.form.allDay')}
                trailing={
                  <Switch
                    accessibilityLabel={t('agenda.form.allDay')}
                    value={allDay}
                    onValueChange={setAllDay}
                    trackColor={{ false: colors.border, true: colors.sage }}
                    thumbColor={colors.white}
                  />
                }
              />
              {allDay ? null : (
                <TextField
                  label={t('agenda.form.timeLabel')}
                  placeholder="18:30"
                  value={time}
                  onChangeText={(value) => setTime(formatTime(value))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors.time}
                />
              )}
              {daysUpFront ? null : severalDaysFields}
            </>
          )}

          <View style={styles.group}>
            <Text variant="label" color="inkSoft">
              {t('agenda.form.remindersLabel')}
            </Text>
            <View style={styles.chips}>
              {wholeDay
                ? ALL_DAY_REMINDERS.map((minutes) =>
                    reminderChip(minutes, t(`agenda.reminders.allDay.${minutes}`)),
                  )
                : TIMED_REMINDERS.map((minutes) =>
                    reminderChip(minutes, t(`agenda.reminders.timed.${minutes}`)),
                  )}
            </View>
            {members.length > 1 ? (
              <Text variant="caption" color="inkSoft">
                {t('agenda.form.participantsHint')}
              </Text>
            ) : null}
          </View>
        </>
      ) : (
        <MoreRow
          label={t('agenda.form.moreOptions')}
          hint={t('agenda.form.moreOptionsHint')}
          icon="⏰"
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
});
