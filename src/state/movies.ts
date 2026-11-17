import { create } from 'zustand';

import { watchMovies } from '@/data/movies';
import type { Movie } from '@/domain/movies';

type MoviesState = {
  movies: Movie[];
};

/** Lista de películas del hogar. */
export const useMovies = create<MoviesState>()(() => ({ movies: [] }));

/** Empieza a escuchar las películas del hogar. Devuelve cómo parar. */
export function startMoviesSync(householdId: string): () => void {
  // Si se pierde el acceso al hogar, la sesión ya se encarga de sacar al usuario.
  const stop = watchMovies(householdId, (movies) => useMovies.setState({ movies }), () => undefined);
  return () => {
    stop();
    useMovies.setState({ movies: [] });
  };
}
