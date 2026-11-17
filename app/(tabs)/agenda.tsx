import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { daysOf, occurrencesBetween } from '@/domain/agenda/occurrences';
import { ALL_OWNERS, EVERYONE, filterByOwner, type Occurrence } from '@/domain/agenda/types';
import {
  addDays,
  dateKeyToLocalDate,
  monthMatrix,
  toDateKey,
  yearMonthOf,
  type DateKey,
  type YearMonth,
} from '@/domain/dates';
import { EVENT_COLORS, EventRow } from '@/features/agenda/EventRow';
import { useEventText } from '@/features/agenda/eventText';
import { useAgenda } from '@/state/agenda';
import { useSession } from '@/state/session';
import { Card, Chip, ChipGroup, MonthGrid, Screen, Text, spacing } from '@/ui';

const pad = (value: number) => String(value).padStart(2, '0');

/** Primer y último día de un mes. */
function monthBounds({ year, month }: YearMonth): { first: DateKey; last: DateKey } {
  const first = `${year}-${pad(month)}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  return { first, last: addDays(next, -1) };
}

/**
 * Agenda: el mes entero con un punto por evento, lo del día elegido y, debajo, todo lo que
 * queda del mes que se está viendo, para verlo de un vistazo.
 */
export default function AgendaScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const allEvents = useAgenda((state) => state.events);
  const members = useSession((state) => state.members);
  const { day, sharedLabel } = useEventText();

  const today = toDateKey(new Date());
  const [month, setMonth] = useState<YearMonth>(() => yearMonthOf(today));
  const [selected, setSelected] = useState<DateKey>(today);
  // De quién se ven los eventos: de todos, solo los compartidos o solo los de una persona.
  const [owner, setOwner] = useState<string>(ALL_OWNERS);

  const memberIds = members.map((member) => member.uid);
  // Si la persona elegida deja el hogar, el filtro vuelve a enseñarlo todo.
  const activeOwner =
    owner === ALL_OWNERS || owner === EVERYONE || memberIds.includes(owner) ? owner : ALL_OWNERS;
  const events = filterByOwner(allEvents, activeOwner, memberIds);

  // Puntos del calendario: todo lo que cae en las semanas que se ven.
  const weeks = monthMatrix(month);
  const firstVisible = weeks[0]?.[0] ?? today;
  const lastVisible = weeks.at(-1)?.[6] ?? today;
  const marks: Record<DateKey, string[]> = {};
  for (const occurrence of occurrencesBetween(events, firstVisible, lastVisible)) {
    for (const date of daysOf(occurrence)) {
      (marks[date] ??= []).push(EVENT_COLORS[occurrence.event.type]);
    }
  }

  const onSelectedDay = occurrencesBetween(events, selected, selected);

  // Lo que queda del mes que se ve (de un mes ya pasado, todo), sin repetir lo del día elegido.
  const { first, last } = monthBounds(month);
  const from = today > first && today <= last ? today : first;
  const shownAbove = new Set(onSelectedDay.map((occurrence) => occurrence.event.id));
  const restOfMonth = occurrencesBetween(events, from, last).filter(
    (occurrence) => !shownAbove.has(occurrence.event.id),
  );
  const isCurrentMonth = from === today;
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(
    dateKeyToLocalDate(first),
  );

  const open = ({ event }: Occurrence) =>
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  const addOn = (date: DateKey) => router.push({ pathname: '/event/new', params: { date } });

  const goToToday = () => {
    setMonth(yearMonthOf(today));
    setSelected(today);
  };

  const selectedLabel =
    selected === today
      ? t('agenda.today')
      : selected === addDays(today, 1)
        ? t('agenda.tomorrow')
        : day(selected);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('agenda.title')}
        </Text>
        {selected !== today || yearMonthOf(today).month !== month.month ? (
          <Chip role="button" label={t('agenda.goToToday')} onPress={goToToday} />
        ) : null}
      </View>

      {members.length > 1 ? (
        <ChipGroup<string>
          label={t('agenda.filter.label')}
          options={[
            { value: ALL_OWNERS, label: t('agenda.filter.all') },
            { value: EVERYONE, label: sharedLabel, icon: '👥' },
            ...members.map((member) => ({
              value: member.uid,
              label: member.name,
              icon: member.avatar,
            })),
          ]}
          value={activeOwner}
          onChange={setOwner}
        />
      ) : null}

      <Card>
        <MonthGrid
          month={month}
          onChangeMonth={setMonth}
          today={today}
          selected={selected}
          onSelect={setSelected}
          marks={marks}
        />
      </Card>

      <Card>
        <View style={styles.dayHeader}>
          <Text variant="heading" style={styles.title}>
            {selectedLabel}
          </Text>
          <Chip role="button" icon="＋" label={t('agenda.addShort')} onPress={() => addOn(selected)} />
        </View>
        {onSelectedDay.length === 0 ? (
          <Text color="inkSoft">
            {t(activeOwner === ALL_OWNERS ? 'agenda.nothingThisDay' : 'agenda.filter.nothingThisDay')}
          </Text>
        ) : (
          onSelectedDay.map((occurrence) => (
            <EventRow key={occurrence.event.id} occurrence={occurrence} today={today} onPress={open} />
          ))
        )}
      </Card>

      <Card tone="sage">
        <Text variant="heading">
          {isCurrentMonth
            ? t('agenda.restOfMonth', { month: monthName })
            : t('agenda.inMonth', { month: monthName })}
        </Text>
        {restOfMonth.length === 0 ? (
          <Text color="inkSoft">
            {allEvents.length === 0 ? t('agenda.empty.description') : t('agenda.nothingMoreInMonth')}
          </Text>
        ) : (
          restOfMonth.map((occurrence) => (
            <EventRow
              key={`${occurrence.event.id}-${occurrence.date}`}
              occurrence={occurrence}
              today={today}
              onPress={open}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
