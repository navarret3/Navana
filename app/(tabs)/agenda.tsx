import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { daysOf, occurrencesBetween, upcomingOccurrences } from '@/domain/agenda/occurrences';
import { ALL_OWNERS, EVERYONE, filterByOwner, type Occurrence } from '@/domain/agenda/types';
import { addDays, monthMatrix, toDateKey, yearMonthOf, type DateKey } from '@/domain/dates';
import { EVENT_COLORS, EventRow } from '@/features/agenda/EventRow';
import { useEventText } from '@/features/agenda/eventText';
import { useAgenda } from '@/state/agenda';
import { useSession } from '@/state/session';
import { Card, Chip, ChipGroup, MonthGrid, Screen, Text, colors, shadows, spacing } from '@/ui';

/** Cuántos eventos se enseñan en "Próximos". */
const UPCOMING_LIMIT = 12;

export default function AgendaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const allEvents = useAgenda((state) => state.events);
  const members = useSession((state) => state.members);
  const { day, sharedLabel } = useEventText();

  const today = toDateKey(new Date());
  const [month, setMonth] = useState(() => yearMonthOf(today));
  const [selected, setSelected] = useState<DateKey>(today);
  // De quién se ven los eventos: de todos, solo los compartidos o solo los de una persona.
  const [owner, setOwner] = useState<string>(ALL_OWNERS);

  const memberIds = members.map((member) => member.uid);
  // Si la persona elegida deja el hogar, el filtro vuelve a enseñarlo todo.
  const activeOwner =
    owner === ALL_OWNERS || owner === EVERYONE || memberIds.includes(owner) ? owner : ALL_OWNERS;
  const events = filterByOwner(allEvents, activeOwner, memberIds);

  // Lo que cae en las semanas que se ven, para pintar los puntos del calendario.
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
  // Lo que ya se ve en la tarjeta del día elegido no se repite debajo en "Próximos".
  const shownAbove = new Set(onSelectedDay.map((occurrence) => occurrence.event.id));
  const upcoming = upcomingOccurrences(events, today)
    .filter((occurrence) => !shownAbove.has(occurrence.event.id))
    .slice(0, UPCOMING_LIMIT);

  const open = ({ event }: Occurrence) =>
    router.push({ pathname: '/event/[id]', params: { id: event.id } });

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
    <Screen
      floating={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('agenda.add')}
          onPress={() => router.push({ pathname: '/event/new', params: { date: selected } })}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      }>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('agenda.title')}
        </Text>
        {selected !== today || yearMonthOf(today).month !== month.month ? (
          <Chip role="button" label={t('agenda.goToToday')} onPress={goToToday} />
        ) : null}
      </View>

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
        <Text variant="heading">{selectedLabel}</Text>
        {onSelectedDay.length === 0 ? (
          <Text color="inkSoft">
            {t(activeOwner === ALL_OWNERS ? 'agenda.nothingThisDay' : 'agenda.filter.nothingThisDay')}
          </Text>
        ) : (
          onSelectedDay.map((occurrence) => (
            <EventRow
              key={occurrence.event.id}
              occurrence={occurrence}
              today={today}
              onPress={open}
            />
          ))
        )}
      </Card>

      {/* Con la agenda vacía se explica para qué sirve; si no queda nada más que enseñar, se omite. */}
      {allEvents.length === 0 || upcoming.length > 0 ? (
        <Card tone="sage">
          <Text variant="heading">{t('agenda.upcoming')}</Text>
          {upcoming.length === 0 ? (
            <Text color="inkSoft">{t('agenda.empty.description')}</Text>
          ) : (
            upcoming.map((occurrence) => (
              <EventRow
                key={occurrence.event.id}
                occurrence={occurrence}
                today={today}
                onPress={open}
              />
            ))
          )}
        </Card>
      ) : null}
      <View style={styles.fabSpace} />
    </Screen>
  );
}

const FAB_SIZE = 60;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.peach,
    ...shadows.raised,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabIcon: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.onPeach,
  },
  // Para que el botón flotante no tape el último evento.
  fabSpace: {
    height: FAB_SIZE,
  },
});
