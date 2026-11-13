import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { occurrencesBetween, upcomingOccurrences } from '@/domain/agenda/occurrences';
import { ALL_OWNERS, EVERYONE, filterByOwner, type Occurrence } from '@/domain/agenda/types';
import { addDays, daysFrom, toDateKey, type DateKey } from '@/domain/dates';
import { EventRow } from '@/features/agenda/EventRow';
import { useEventText } from '@/features/agenda/eventText';
import { useAgenda } from '@/state/agenda';
import { useSession } from '@/state/session';
import {
  Card,
  Chip,
  ChipGroup,
  Screen,
  Text,
  colors,
  minTouchSize,
  shadows,
  spacing,
} from '@/ui';

/** Días que se listan de una vez, empezando por hoy. */
const DAYS_SHOWN = 7;
/** Cuántos eventos se enseñan en "Más adelante". */
const LATER_LIMIT = 12;

export default function AgendaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const allEvents = useAgenda((state) => state.events);
  const members = useSession((state) => state.members);
  const { day, sharedLabel } = useEventText();

  const today = toDateKey(new Date());
  /** Primer día de la lista. Empieza en hoy: lo pasado no se enseña si no se va a buscar. */
  const [start, setStart] = useState<DateKey>(today);
  // De quién se ven los eventos: de todos, solo los compartidos o solo los de una persona.
  const [owner, setOwner] = useState<string>(ALL_OWNERS);

  const memberIds = members.map((member) => member.uid);
  // Si la persona elegida deja el hogar, el filtro vuelve a enseñarlo todo.
  const activeOwner =
    owner === ALL_OWNERS || owner === EVERYONE || memberIds.includes(owner) ? owner : ALL_OWNERS;
  const events = filterByOwner(allEvents, activeOwner, memberIds);

  const days = daysFrom(start, DAYS_SHOWN);
  const last = days.at(-1) ?? start;
  const shown = occurrencesBetween(events, start, last);
  // Un evento de varios días sale en cada uno de los suyos.
  const onDay = (date: DateKey) =>
    shown.filter((occurrence) => occurrence.date <= date && occurrence.endDate >= date);
  // Lo que empieza después del último día de la lista.
  const later = upcomingOccurrences(events, today)
    .filter((occurrence) => occurrence.date > last)
    .slice(0, LATER_LIMIT);

  const open = ({ event }: Occurrence) =>
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  const addOn = (date: DateKey) => router.push({ pathname: '/event/new', params: { date } });

  const dayLabel = (date: DateKey) =>
    date === today
      ? `${t('agenda.today')} · ${day(date)}`
      : date === addDays(today, 1)
        ? `${t('agenda.tomorrow')} · ${day(date)}`
        : day(date);

  return (
    <Screen
      floating={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('agenda.add')}
          onPress={() => addOn(start < today ? today : start)}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      }>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('agenda.title')}
        </Text>
        {start === today ? null : (
          <Chip role="button" label={t('agenda.goToToday')} onPress={() => setStart(today)} />
        )}
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

      <View style={styles.range}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('agenda.previousDays')}
          onPress={() => setStart(addDays(start, -DAYS_SHOWN))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <Text variant="title">‹</Text>
        </Pressable>
        <Text variant="heading" center style={styles.title}>
          {day(start)} – {day(last)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('agenda.nextDays')}
          onPress={() => setStart(addDays(start, DAYS_SHOWN))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <Text variant="title">›</Text>
        </Pressable>
      </View>

      <Card>
        {days.map((date) => {
          const occurrences = onDay(date);
          return (
            <View key={date} style={styles.day}>
              <View style={styles.dayHeader}>
                <Text
                  variant={date === today ? 'heading' : 'bodyStrong'}
                  color={occurrences.length > 0 || date === today ? 'ink' : 'inkMuted'}
                  style={styles.title}>
                  {dayLabel(date)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('agenda.addOn', { date: day(date) })}
                  hitSlop={spacing.xs}
                  onPress={() => addOn(date)}
                  style={({ pressed }) => [styles.addOn, pressed && styles.pressed]}>
                  <Text color="inkSoft" style={styles.addOnIcon}>
                    ＋
                  </Text>
                </Pressable>
              </View>
              {occurrences.map((occurrence) => (
                <EventRow
                  key={occurrence.event.id}
                  occurrence={occurrence}
                  today={today}
                  onPress={open}
                />
              ))}
            </View>
          );
        })}
        {shown.length === 0 ? (
          <Text variant="caption" color="inkSoft">
            {allEvents.length === 0
              ? t('agenda.empty.description')
              : t(activeOwner === ALL_OWNERS ? 'agenda.nothingTheseDays' : 'agenda.filter.nothingTheseDays')}
          </Text>
        ) : null}
      </Card>

      {later.length > 0 ? (
        <Card tone="sage">
          <Text variant="heading">{t('agenda.later')}</Text>
          {later.map((occurrence) => (
            <EventRow
              key={occurrence.event.id}
              occurrence={occurrence}
              today={today}
              onPress={open}
            />
          ))}
        </Card>
      ) : null}
      <View style={styles.fabSpace} />
    </Screen>
  );
}

const FAB_SIZE = 60;
const ADD_SIZE = 36;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  range: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  day: {
    gap: spacing.xxs,
  },
  dayHeader: {
    minHeight: ADD_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addOn: {
    width: ADD_SIZE,
    height: ADD_SIZE,
    borderRadius: ADD_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOnIcon: {
    fontSize: 20,
    lineHeight: 24,
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
