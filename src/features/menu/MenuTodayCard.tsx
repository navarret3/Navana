import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { toDateKey } from '@/domain/dates';
import { MEAL_SLOTS, mealOf } from '@/domain/menu';
import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { useExtras } from '@/state/extras';
import { Text } from '@/ui';

/** Tarjeta de "Hoy": qué se come y se cena hoy. Tocarla abre el menú de la semana. */
export function MenuTodayCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const today = toDateKey(new Date());
  const day = useExtras((state) => state.menu.find((entry) => entry.date === today));
  const planned = MEAL_SLOTS.filter((slot) => mealOf(day, slot)?.title);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('menu.todayCard.open')}
      onPress={() => router.push('/menu')}>
      <TodaySummaryCard icon="🍽️" title={t('menu.todayCard.title')} tone="sage">
        {planned.length === 0 ? (
          <Text color="inkSoft">{t('menu.todayCard.empty')}</Text>
        ) : (
          planned.map((slot) => (
            <Text key={slot} numberOfLines={2}>
              <Text variant="bodyStrong">{t(`menu.slots.${slot}`)}: </Text>
              {mealOf(day, slot)?.title}
            </Text>
          ))
        )}
      </TodaySummaryCard>
    </Pressable>
  );
}
