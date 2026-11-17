/**
 * Búsqueda de películas en TMDB (The Movie Database). Necesita una clave de TMDB, que llega
 * en `extra.tmdbToken` desde la variable de entorno `TMDB_API_TOKEN` (ver `app.config.ts`).
 * Sin clave la app sigue funcionando: las películas se añaden solo con el título.
 */
import Constants from 'expo-constants';

import { parseTmdbSearch, type MovieDraft } from '@/domain/movies';

const SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';

function token(): string | null {
  const value: unknown = Constants.expoConfig?.extra?.tmdbToken;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** ¿Está configurada la búsqueda? */
export function hasMovieSearch(): boolean {
  return token() !== null;
}

/** Código de idioma que entiende TMDB a partir del de la app. */
function tmdbLanguage(language: string): string {
  return language.startsWith('en') ? 'en-US' : 'es-ES';
}

/** Busca películas por título, con los títulos y resúmenes en el idioma de la app. */
export async function searchMovies(
  query: string,
  language: string,
  signal?: AbortSignal,
): Promise<MovieDraft[]> {
  const key = token();
  if (!key) return [];
  const params = new URLSearchParams({
    query,
    language: tmdbLanguage(language),
    include_adult: 'false',
    page: '1',
  });
  // TMDB da dos tipos de clave: el "token de lectura" (largo, va en la cabecera) y la
  // "clave de API" corta, que va en la dirección. Vale cualquiera de las dos.
  const isReadToken = key.includes('.');
  if (!isReadToken) params.set('api_key', key);
  const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(isReadToken ? { Authorization: `Bearer ${key}` } : {}),
    },
    signal,
  });
  if (!response.ok) throw new Error(`TMDB respondió ${response.status}`);
  return parseTmdbSearch(await response.json());
}
