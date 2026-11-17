import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { addMovie } from '@/data/movies';
import {
  MOVIE_TITLE_MAX,
  findSameMovie,
  manualMovie,
  type MovieDraft,
} from '@/domain/movies';
import { Poster } from '@/features/movies/Poster';
import { hasMovieSearch, searchMovies } from '@/movies/tmdb';
import { useMovies } from '@/state/movies';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import {
  Card,
  Screen,
  ScreenHeader,
  Text,
  TextField,
  colors,
  minTouchSize,
  radii,
  spacing,
  useGoBack,
} from '@/ui';

/** Espera tras la última tecla antes de buscar, para no lanzar una búsqueda por letra. */
const SEARCH_DELAY_MS = 400;
const MIN_QUERY = 2;

type Search =
  | { state: 'idle' }
  | { state: 'searching' }
  | { state: 'done'; results: MovieDraft[] }
  | { state: 'failed' };

/** Añadir una película: se busca en TMDB y se toca la buena, o se añade solo el título. */
export default function AddMovieScreen() {
  const { t, i18n } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const uid = useSession((state) => state.user?.uid);
  const movies = useMovies((state) => state.movies);
  const [text, setText] = useState('');
  /** Última búsqueda, con el texto que la lanzó: si el texto ya es otro, no vale. */
  const [lastSearch, setLastSearch] = useState<Search & { query: string }>({
    state: 'idle',
    query: '',
  });
  const canSearch = hasMovieSearch();
  const query = text.trim();
  const active = canSearch && query.length >= MIN_QUERY;
  const search: Search = active && lastSearch.query === query ? lastSearch : { state: 'idle' };

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLastSearch({ state: 'searching', query });
      searchMovies(query, i18n.language, controller.signal)
        .then((results) => setLastSearch({ state: 'done', results, query }))
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            console.warn('No se ha podido buscar la película', error);
            setLastSearch({ state: 'failed', query });
          }
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, active, i18n.language]);

  if (!household || !uid) return null;

  const add = (draft: MovieDraft) => {
    addMovie(household.id, draft, uid).catch(saveFailed('No se ha podido añadir la película'));
    goBack();
  };

  const manual = manualMovie(query);
  const manualExists = !!findSameMovie(movies, manual);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('movies.search.title')} />
      <TextField
        label={t('movies.search.label')}
        placeholder={t('movies.search.placeholder')}
        value={text}
        onChangeText={setText}
        maxLength={MOVIE_TITLE_MAX}
        autoCapitalize="sentences"
        autoFocus
        returnKeyType="done"
      />
      {canSearch ? null : (
        <Text variant="caption" color="inkSoft">
          {t('movies.search.notConfigured')}
        </Text>
      )}

      {search.state === 'searching' ? <ActivityIndicator color={colors.peachDeep} /> : null}
      {search.state === 'failed' ? (
        <Text variant="caption" color="danger">
          {t('movies.search.error')}
        </Text>
      ) : null}
      {search.state === 'done' && search.results.length === 0 ? (
        <Text color="inkSoft">{t('movies.search.noResults')}</Text>
      ) : null}

      {search.state === 'done' && search.results.length > 0 ? (
        <Card>
          {search.results.map((result) => {
            const existing = findSameMovie(movies, result);
            return (
              <Pressable
                key={result.tmdbId ?? result.title}
                accessibilityRole="button"
                accessibilityState={{ disabled: !!existing }}
                disabled={!!existing}
                onPress={() => add(result)}
                style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
                <Poster path={result.posterPath} size="w92" width={52} title={result.title} />
                <View style={styles.texts}>
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {result.title}
                    {result.year ? (
                      <Text color="inkSoft">{` (${result.year})`}</Text>
                    ) : null}
                  </Text>
                  {existing ? (
                    <Text variant="caption" color="sageDeep">
                      {t('movies.search.alreadyAdded')}
                    </Text>
                  ) : result.overview ? (
                    <Text variant="caption" color="inkSoft" numberOfLines={2}>
                      {result.overview}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {manual.title ? (
        <Pressable
          accessibilityRole="button"
          disabled={manualExists}
          onPress={() => add(manual)}
          style={({ pressed }) => [styles.manual, pressed && styles.pressed]}>
          <Text style={styles.manualIcon}>＋</Text>
          <Text style={styles.texts}>
            {manualExists
              ? t('movies.search.alreadyAdded')
              : t('movies.search.addManual', { title: manual.title })}
          </Text>
        </Pressable>
      ) : null}

      {canSearch ? (
        <Text variant="caption" color="inkMuted" center>
          {t('movies.search.attribution')}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  result: {
    minHeight: minTouchSize + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  texts: {
    flex: 1,
  },
  manual: {
    minHeight: minTouchSize + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  manualIcon: {
    fontSize: 20,
    lineHeight: 28,
    width: 32,
    textAlign: 'center',
  },
});
