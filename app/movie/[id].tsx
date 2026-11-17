import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { removeMovie, setMovieWatched } from '@/data/movies';
import { Poster } from '@/features/movies/Poster';
import { useMovies } from '@/state/movies';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { Button, EmptyState, Screen, ScreenHeader, Text, spacing, useGoBack } from '@/ui';

const POSTER_WIDTH = 130;

/** Ficha de una película: póster, resumen, quién la añadió y si ya la habéis visto. */
export default function MovieScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);
  const movie = useMovies((state) => state.movies.find((candidate) => candidate.id === id));

  if (!household || !uid) return null;

  if (!movie) {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        <ScreenHeader title={t('movies.detailTitle')} />
        <EmptyState icon="🎬" title={t('movies.notFound')} />
      </Screen>
    );
  }

  const nameOf = (memberId: string | null) =>
    members.find((member) => member.uid === memberId)?.name ?? t('common.formerMember');
  const dateOf = (millis: number) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(millis),
    );

  const toggleWatched = () => {
    setMovieWatched(household.id, movie.id, !movie.watched, uid).catch(
      saveFailed('No se ha podido guardar la película'),
    );
  };

  const remove = () => {
    removeMovie(household.id, movie.id).catch(saveFailed('No se ha podido quitar la película'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('movies.detailTitle')} />
      <View style={styles.top}>
        <Poster path={movie.posterPath} size="w342" width={POSTER_WIDTH} title={movie.title} />
        <View style={styles.texts}>
          <Text variant="title">{movie.title}</Text>
          {movie.year ? <Text color="inkSoft">{movie.year}</Text> : null}
          <Text variant="caption" color="inkSoft">
            {movie.addedAt
              ? t('movies.addedByOn', { name: nameOf(movie.addedBy), date: dateOf(movie.addedAt) })
              : t('movies.addedBy', { name: nameOf(movie.addedBy) })}
          </Text>
          {movie.watched && movie.watchedAt ? (
            <Text variant="caption" color="sageDeep">
              ✅ {t('movies.watchedByOn', { name: nameOf(movie.watchedBy), date: dateOf(movie.watchedAt) })}
            </Text>
          ) : null}
        </View>
      </View>

      {movie.overview ? <Text>{movie.overview}</Text> : null}

      <Button
        variant={movie.watched ? 'secondary' : 'primary'}
        label={movie.watched ? t('movies.markUnwatched') : t('movies.markWatched')}
        onPress={toggleWatched}
      />
      <Button variant="ghost" label={t('movies.remove')} onPress={remove} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
});
