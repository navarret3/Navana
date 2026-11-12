import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, dateKeyToLocalDate, toDateKey, type DateKey } from '@/domain/dates';
import { MEAL_SLOTS, ingredientsToBuy, mealOf, weekDays } from '@/domain/menu';
import { pendingKeys } from '@/domain/shopping/suggest';
import { useShoppingActions } from '@/features/shopping/useShoppingActions';
import { useExtras } from '@/state/extras';
import { useShopping } from '@/state/shopping';
import { Button, Card, Chip, Screen, Text, colors, minTouchSize, radii, spacing } from '@/ui';

const SLOT_ICONS = { lunch: '🍲', dinner: '🌙' } as const;

export default function MenuScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const menu = useExtras((state) => state.menu);
  const items = useShopping((state) => state.items);
  const { add } = useShoppingActions();

  const today = toDateKey(new Date());
  /** Un día cualquiera de la semana que se está viendo. */
  const [anchor, setAnchor] = useState<DateKey>(today);
  const [message, setMessage] = useState<string | null>(null);

  const days = weekDays(anchor);
  const isCurrentWeek = days.includes(today);
  const byDate = new Map(menu.map((day) => [day.date, day]));

  const format = (date: DateKey, options: Intl.DateTimeFormatOptions) => {
    const text = new Intl.DateTimeFormat(i18n.language, options).format(dateKeyToLocalDate(date));
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const changeWeek = (delta: number) => {
    setAnchor(addDays(anchor, delta * 7));
    setMessage(null);
  };

  // De la semana en curso solo interesa lo que queda por cocinar.
  const daysAhead = days.filter((date) => date >= today);
  const toBuy = ingredientsToBuy(menu, daysAhead, pendingKeys(items));

  const sendToShopping = () => {
    for (const ingredient of toBuy) add(ingredient);
    setMessage(t('menu.addedToShopping', { count: toBuy.length }));
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('menu.title')}
        </Text>
        {isCurrentWeek ? null : (
          <Chip role="button" label={t('menu.thisWeek')} onPress={() => setAnchor(today)} />
        )}
      </View>

      <View style={styles.week}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('menu.previousWeek')}
          onPress={() => changeWeek(-1)}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <Text variant="title">‹</Text>
        </Pressable>
        <Text variant="heading" center style={styles.title}>
          {t('menu.weekOf', {
            date: format(days[0] ?? anchor, { day: 'numeric', month: 'long' }),
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('menu.nextWeek')}
          onPress={() => changeWeek(1)}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <Text variant="title">›</Text>
        </Pressable>
      </View>

      {days.map((date) => (
        <Card key={date} tone={date === today ? 'peach' : 'surface'}>
          <Text variant="heading">
            {format(date, { weekday: 'long', day: 'numeric' })}
            {date === today ? ` · ${t('menu.today')}` : ''}
          </Text>
          {MEAL_SLOTS.map((slot) => {
            const meal = mealOf(byDate.get(date), slot);
            return (
              <Pressable
                key={slot}
                accessibilityRole="button"
                accessibilityLabel={`${t(`menu.slots.${slot}`)}: ${meal?.title || t('menu.emptySlot')}`}
                onPress={() =>
                  router.push({ pathname: '/meal/[date]', params: { date, slot } })
                }
                style={({ pressed }) => [styles.meal, pressed && styles.pressed]}>
                <Text style={styles.slotIcon}>{SLOT_ICONS[slot]}</Text>
                <View style={styles.mealTexts}>
                  <Text variant="label" color="inkSoft">
                    {t(`menu.slots.${slot}`)}
                  </Text>
                  <Text color={meal ? 'ink' : 'inkMuted'} numberOfLines={2}>
                    {meal?.title || t('menu.emptySlot')}
                  </Text>
                  {meal && meal.ingredients.length > 0 ? (
                    <Text variant="caption" color="inkSoft" numberOfLines={2}>
                      {meal.ingredients.join(', ')}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </Card>
      ))}

      <Card tone="sage">
        <Text variant="heading">🛒 {t('menu.shopping.title')}</Text>
        <Text color="inkSoft">
          {toBuy.length > 0
            ? t('menu.shopping.pending', { count: toBuy.length })
            : t('menu.shopping.nothing')}
        </Text>
        {toBuy.length > 0 ? (
          <Text variant="caption" color="inkSoft">
            {toBuy.join(', ')}
          </Text>
        ) : null}
        <Button
          label={t('menu.shopping.send')}
          disabled={toBuy.length === 0}
          onPress={sendToShopping}
        />
        {message ? (
          <Text variant="caption" color="sageDeep" center accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}
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
  week: {
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
  meal: {
    minHeight: minTouchSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  slotIcon: {
    fontSize: 22,
    lineHeight: 28,
    width: 28,
    textAlign: 'center',
  },
  mealTexts: {
    flex: 1,
  },
});
