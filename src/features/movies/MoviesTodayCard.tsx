import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { moviesToWatch } from '@/domain/movies';
import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { useMovies } from '@/state/movies';
import { Text } from '@/ui';

/** Cuántas películas se nombran en "Hoy". */
const PREVIEW = 3;

/** Tarjeta de "Hoy": cuántas películas hay por ver y las últimas que se han añadido. */
export function MoviesTodayCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const toWatch = moviesToWatch(useMovies((state) => state.movies));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('movies.todayCard.open')}
      onPress={() => router.push('/movies')}>
      <TodaySummaryCard icon="🎬" title={t('movies.todayCard.title')}>
        {toWatch.length === 0 ? (
          <Text color="inkSoft">{t('movies.todayCard.empty')}</Text>
        ) : (
          <>
            <Text color="inkSoft">{t('movies.todayCard.count', { count: toWatch.length })}</Text>
            <Text numberOfLines={2}>
              {toWatch
                .slice(0, PREVIEW)
                .map((movie) => movie.title)
                .join(' · ')}
            </Text>
          </>
        )}
      </TodaySummaryCard>
    </Pressable>
  );
}
