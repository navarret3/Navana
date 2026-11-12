import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import {
  ALL_DAY_REMINDERS,
  EVENT_ICONS,
  EVENT_TYPES,
  TIMED_REMINDERS,
  isValidTime,
  type EventDraft,
  type EventType,
} from '@/domain/agenda/types';
import type { Member } from '@/domain/household';
import { Button, Chip, ChipGroup, DateField, ListRow, Text, TextField, colors, spacing } from '@/ui';

const TITLE_MAX = 80;
const LOCATION_MAX = 120;
const NOTES_MAX = 1000;

/** Valor del selector "de quién es" cuando el evento es de todo el hogar. */
const EVERYONE = 'everyone';

type EventFormProps = {
  initial: EventDraft;
  members: readonly Member[];
  submitLabel: string;
  onSubmit: (draft: EventDraft) => void;
};

/** Escribe la hora mientras se teclea: "1830" pasa a "18:30". */
function formatTime(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

/** Formulario de alta y edición de un evento de la agenda. */
export function EventForm({ initial, members, submitLabel, onSubmit }: EventFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial.title);
  const [type, setType] = useState<EventType>(initial.type);
  const [date, setDate] = useState(initial.date);
  const [allDay, setAllDay] = useState(initial.time === null);
  const [time, setTime] = useState(initial.time ?? '');
  const [severalDays, setSeveralDays] = useState(initial.endDate !== null);
  const [endDate, setEndDate] = useState(initial.endDate ?? initial.date);
  // De quién es: de todo el hogar o de una persona concreta.
  const [owner, setOwner] = useState<string>(
    initial.participants.length === 1 ? (initial.participants[0] ?? EVERYONE) : EVERYONE,
  );
  const [location, setLocation] = useState(initial.location);
  const [notes, setNotes] = useState(initial.notes);
  const [reminders, setReminders] = useState<readonly number[]>(initial.reminders);
  const [errors, setErrors] = useState<{ title?: string; time?: string; endDate?: string }>({});

  // Un cumpleaños es siempre de un día entero y se repite cada año.
  const isBirthday = type === 'birthday';
  const wholeDay = allDay || isBirthday;
  const reminderOptions = wholeDay ? ALL_DAY_REMINDERS : TIMED_REMINDERS;

  const toggle = <T,>(list: readonly T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const submit = () => {
    const cleanTitle = title.replace(/\s+/g, ' ').trim().slice(0, TITLE_MAX);
    const multiDay = severalDays && !isBirthday;
    const found = {
      title: cleanTitle ? undefined : t('agenda.form.titleRequired'),
      time: wholeDay || isValidTime(time) ? undefined : t('agenda.form.timeInvalid'),
      endDate: multiDay && endDate < date ? t('agenda.form.endBeforeStart') : undefined,
    };
    setErrors(found);
    if (found.title || found.time || found.endDate) return;

    onSubmit({
      title: cleanTitle,
      type,
      date,
      endDate: multiDay && endDate > date ? endDate : null,
      time: wholeDay ? null : time,
      location: location.trim().slice(0, LOCATION_MAX),
      notes: notes.trim().slice(0, NOTES_MAX),
      // Sin participantes significa "de todo el hogar".
      participants:
        owner !== EVERYONE && members.some((member) => member.uid === owner) ? [owner] : [],
      // Solo se guardan los avisos que tienen sentido para este tipo de evento.
      reminders: reminders.filter((minutes) => (reminderOptions as readonly number[]).includes(minutes)),
      yearly: isBirthday,
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
        hint={t(`agenda.typeHints.${type}`)}
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
      <DateField label={t('agenda.form.dateLabel')} value={date} onChange={setDate} />

      {isBirthday ? null : (
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
      )}

      {members.length > 1 ? (
        <ChipGroup<string>
          label={t('agenda.form.participantsLabel')}
          options={[
            {
              value: EVERYONE,
              label: members.length === 2 ? t('agenda.whose.both') : t('agenda.whose.everyone'),
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
          hint={t('agenda.form.participantsHint')}
        />
      ) : (
        <Text variant="caption" color="inkSoft">
          {t('agenda.form.participantsAlone')}
        </Text>
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
      </View>

      <TextField
        label={t('agenda.form.locationLabel')}
        value={location}
        onChangeText={setLocation}
        maxLength={LOCATION_MAX}
        autoCapitalize="sentences"
      />
      <TextField
        label={t('agenda.form.notesLabel')}
        value={notes}
        onChangeText={setNotes}
        maxLength={NOTES_MAX}
        multiline
      />

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
