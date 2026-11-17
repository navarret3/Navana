import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { moviesToWatch, watchedMovies, type Movie } from '@/domain/movies';
import { Poster } from '@/features/movies/Poster';
import { useMovies } from '@/state/movies';
import { useSession } from '@/state/session';
import {
  Avatar,
  Button,
  ChipGroup,
  EmptyState,
  Screen,
  Text,
  maxContentWidth,
  spacing,
} from '@/ui';

type Filter = 'toWatch' | 'watched';

const COLUMNS = 3;
const GAP = spacing.md;

/** Películas del hogar: las que hay por ver y las ya vistas, en cuadrícula de pósters. */
export default function MoviesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const movies = useMovies((state) => state.movies);
  const members = useSession((state) => state.members);
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('toWatch');

  const toWatch = moviesToWatch(movies);
  const watched = watchedMovies(movies);
  const shown = filter === 'toWatch' ? toWatch : watched;

  // Ancho de cada póster para que quepan tres por fila con su separación.
  const contentWidth = Math.min(width, maxContentWidth) - spacing.lg * 2;
  const posterWidth = Math.floor((contentWidth - GAP * (COLUMNS - 1)) / COLUMNS);

  const card = (movie: Movie) => {
    const by = members.find((member) => member.uid === movie.addedBy);
    return (
      <Pressable
        key={movie.id}
        accessibilityRole="button"
        accessibilityLabel={movie.year ? `${movie.title} (${movie.year})` : movie.title}
        onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })}
        style={({ pressed }) => [{ width: posterWidth }, styles.card, pressed && styles.pressed]}>
        <Poster path={movie.posterPath} size="w185" width={posterWidth} title={movie.title} />
        <Text variant="caption" numberOfLines={2}>
          {movie.title}
        </Text>
        <View style={styles.meta}>
          {by ? <Avatar emoji={by.avatar} name={by.name} color={by.color} size={20} /> : null}
          {movie.year ? (
            <Text variant="caption" color="inkMuted">
              {movie.year}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('movies.title')}
      </Text>
      <Button label={t('movies.add')} onPress={() => router.push('/movie/add')} />

      {movies.length === 0 ? (
        <EmptyState
          icon="🍿"
          title={t('movies.empty.title')}
          description={t('movies.empty.description')}
        />
      ) : (
        <>
          <ChipGroup<Filter>
            options={[
              { value: 'toWatch', label: t('movies.filter.toWatch', { count: toWatch.length }) },
              { value: 'watched', label: t('movies.filter.watched', { count: watched.length }) },
            ]}
            value={filter}
            onChange={setFilter}
          />
          {shown.length === 0 ? (
            <Text color="inkSoft">{t(`movies.emptyFilter.${filter}`)}</Text>
          ) : (
            <View style={styles.grid}>{shown.map(card)}</View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  card: {
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.75,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
