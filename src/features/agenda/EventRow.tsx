import { Pressable, StyleSheet, View } from 'react-native';

import { EVENT_ICONS, type EventType, type Occurrence } from '@/domain/agenda/types';
import type { DateKey } from '@/domain/dates';
import { Avatar, Text, colors, minTouchSize, radii, spacing } from '@/ui';

import { useEventText } from './eventText';

/** Color con el que se distingue cada tipo de evento en el calendario y en las listas. */
export const EVENT_COLORS: Record<EventType, string> = {
  trip: colors.sky,
  concert: colors.honey,
  appointment: colors.sageDeep,
  event: colors.peach,
};

type EventRowProps = {
  occurrence: Occurrence;
  today: DateKey;
  onPress: (occurrence: Occurrence) => void;
};

export function EventRow({ occurrence, today, onPress }: EventRowProps) {
  const { when, countdown, owner, whose } = useEventText();
  const { event } = occurrence;
  const person = owner(event);
  const whoseLabel = whose(event);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(occurrence)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.stripe, { backgroundColor: EVENT_COLORS[event.type] }]} />
      <Text style={styles.icon}>{EVENT_ICONS[event.type]}</Text>
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {event.title}
        </Text>
        <Text variant="caption" color="inkSoft" numberOfLines={2}>
          {when(occurrence)}
          {event.location ? ` · ${event.location}` : ''}
        </Text>
        <Text variant="caption" color="inkMuted">
          {whoseLabel}
        </Text>
      </View>
      <View style={styles.side}>
        {person ? (
          <Avatar emoji={person.avatar} name={person.name} color={person.color} size={28} />
        ) : null}
        <Text variant="label" color="peachDeep">
          {countdown(occurrence, today)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchSize + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
    borderRadius: radii.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
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
  side: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
