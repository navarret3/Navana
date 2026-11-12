import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  addMonths,
  dateKeyToLocalDate,
  monthMatrix,
  yearMonthOf,
  type DateKey,
  type YearMonth,
} from '@/domain/dates';

import { Text } from './Text';
import { colors, spacing } from './theme';

type MonthGridProps = {
  month: YearMonth;
  onChangeMonth: (month: YearMonth) => void;
  today: DateKey;
  selected?: DateKey | null;
  onSelect: (date: DateKey) => void;
  /** Colores de los puntos que se pintan bajo cada día con algo apuntado. */
  marks?: Readonly<Record<DateKey, readonly string[]>>;
};

const MAX_DOTS = 3;
const DAY_SIZE = 40;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Vista de un mes, de lunes a domingo, para la agenda y para elegir fechas. */
export function MonthGrid({ month, onChangeMonth, today, selected, onSelect, marks }: MonthGridProps) {
  const { t, i18n } = useTranslation();
  const weeks = monthMatrix(month);
  const firstDay = dateKeyToLocalDate(`${month.year}-${String(month.month).padStart(2, '0')}-01`);
  const title = capitalize(
    new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(firstDay),
  );
  const weekdayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' });
  const dayLabelFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendar.previousMonth')}
          hitSlop={spacing.sm}
          onPress={() => onChangeMonth(addMonths(month, -1))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <Text variant="title">‹</Text>
        </Pressable>
        <Text variant="heading" accessibilityRole="header" style={styles.title} center>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextMonth')}
          hitSlop={spacing.sm}
          onPress={() => onChangeMonth(addMonths(month, 1))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <Text variant="title">›</Text>
        </Pressable>
      </View>

      <View style={styles.week}>
        {(weeks[0] ?? []).map((day) => (
          <View key={day} style={styles.cell}>
            <Text variant="label" color="inkMuted">
              {weekdayFormat.format(dateKeyToLocalDate(day)).toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0]} style={styles.week}>
          {week.map((day) => {
            const inMonth = yearMonthOf(day).month === month.month;
            const isSelected = day === selected;
            const dots = marks?.[day]?.slice(0, MAX_DOTS) ?? [];
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={dayLabelFormat.format(dateKeyToLocalDate(day))}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(day)}
                style={styles.cell}>
                <View
                  style={[
                    styles.day,
                    day === today && styles.today,
                    isSelected && styles.selected,
                  ]}>
                  <Text
                    variant={isSelected || day === today ? 'bodyStrong' : 'body'}
                    color={isSelected ? 'onPeach' : inMonth ? 'ink' : 'inkMuted'}>
                    {Number(day.slice(8))}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {dots.map((color, index) => (
                    <View key={index} style={[styles.dot, { backgroundColor: color }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  arrow: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  week: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  today: {
    borderColor: colors.peach,
  },
  selected: {
    backgroundColor: colors.peach,
    borderColor: colors.peach,
  },
  dots: {
    height: 6,
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
