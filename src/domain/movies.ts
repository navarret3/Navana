import { normalizeName } from '@/domain/shopping/normalize';

/** Lista de películas del hogar: las que se quieren ver y las ya vistas. */

export type Movie = {
  id: string;
  title: string;
  year: number | null;
  /** Ruta del póster en TMDB ("/abc.jpg"); la dirección completa la monta `posterUrl`. */
  posterPath: string | null;
  overview: string;
  /** Identificador en TMDB, si se añadió buscándola. */
  tmdbId: number | null;
  addedBy: string;
  /** Cuándo se añadió, en milisegundos. */
  addedAt: number;
  watched: boolean;
  watchedAt: number | null;
  watchedBy: string | null;
};

/** Lo que hace falta para añadir una película: lo que da la búsqueda, o solo el título. */
export type MovieDraft = Pick<Movie, 'title' | 'year' | 'posterPath' | 'overview' | 'tmdbId'>;

export const MOVIE_TITLE_MAX = 120;
export const MOVIE_OVERVIEW_MAX = 1000;
const POSTER_PATH_MAX = 200;

const POSTER_BASE = 'https://image.tmdb.org/t/p/';

/** Tamaños de póster que sirve TMDB, por ancho en píxeles. */
export type PosterSize = 'w92' | 'w185' | 'w342' | 'w500';

export function posterUrl(path: string | null, size: PosterSize): string | null {
  return path ? `${POSTER_BASE}${size}${path}` : null;
}

function cleanTitle(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, MOVIE_TITLE_MAX);
}

/** Película a partir de solo un título, cuando no se busca o no aparece en la búsqueda. */
export function manualMovie(title: string): MovieDraft {
  return { title: cleanTitle(title), year: null, posterPath: null, overview: '', tmdbId: null };
}

/**
 * Convierte la respuesta de la búsqueda de TMDB (`/search/movie`) en películas para añadir.
 * Descarta lo que no tiene título y recorta lo que no cabe en la base de datos.
 */
export function parseTmdbSearch(json: unknown): MovieDraft[] {
  const results = (json as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) return [];
  const movies: MovieDraft[] = [];
  for (const raw of results as Record<string, unknown>[]) {
    const title = typeof raw.title === 'string' ? cleanTitle(raw.title) : '';
    if (!title) continue;
    const year =
      typeof raw.release_date === 'string' ? Number(raw.release_date.slice(0, 4)) || null : null;
    const poster = typeof raw.poster_path === 'string' ? raw.poster_path : null;
    movies.push({
      title,
      year,
      posterPath: poster && poster.length <= POSTER_PATH_MAX ? poster : null,
      overview:
        typeof raw.overview === 'string' ? raw.overview.trim().slice(0, MOVIE_OVERVIEW_MAX) : '',
      tmdbId: typeof raw.id === 'number' ? raw.id : null,
    });
  }
  return movies;
}

/** La película de la lista que es la misma que `draft`: por TMDB o por título y año. */
export function findSameMovie(
  movies: readonly Movie[],
  draft: Pick<MovieDraft, 'title' | 'year' | 'tmdbId'>,
): Movie | undefined {
  const title = normalizeName(draft.title);
  return movies.find(
    (movie) =>
      (draft.tmdbId !== null && movie.tmdbId === draft.tmdbId) ||
      (normalizeName(movie.title) === title && (movie.year === draft.year || draft.year === null)),
  );
}

/** Por ver: lo último que se ha añadido, primero. */
export function moviesToWatch(movies: readonly Movie[]): Movie[] {
  return movies
    .filter((movie) => !movie.watched)
    .sort((a, b) => b.addedAt - a.addedAt || a.title.localeCompare(b.title));
}

/** Vistas: lo último que se ha visto, primero. */
export function watchedMovies(movies: readonly Movie[]): Movie[] {
  return movies
    .filter((movie) => movie.watched)
    .sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0) || a.title.localeCompare(b.title));
}
