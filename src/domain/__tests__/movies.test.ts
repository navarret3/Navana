import {
  MOVIE_OVERVIEW_MAX,
  findSameMovie,
  manualMovie,
  moviesToWatch,
  parseTmdbSearch,
  posterUrl,
  watchedMovies,
  type Movie,
} from '@/domain/movies';

function movie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 'm1',
    title: 'Origen',
    year: 2010,
    posterPath: '/origen.jpg',
    overview: '',
    tmdbId: 27205,
    addedBy: 'ana',
    addedAt: 1000,
    watched: false,
    watchedAt: null,
    watchedBy: null,
    ...overrides,
  };
}

describe('películas', () => {
  it('lee la búsqueda de TMDB y descarta lo que no sirve', () => {
    const parsed = parseTmdbSearch({
      results: [
        {
          id: 27205,
          title: '  Origen  ',
          release_date: '2010-07-15',
          poster_path: '/origen.jpg',
          overview: 'Un ladrón que roba secretos.',
        },
        { id: 1, title: 'Sin fecha ni póster', release_date: '', poster_path: null },
        { id: 2, title: '' },
        { id: 3, title: 'Larga', overview: 'x'.repeat(MOVIE_OVERVIEW_MAX + 50) },
      ],
    });
    expect(parsed[0]).toEqual({
      title: 'Origen',
      year: 2010,
      posterPath: '/origen.jpg',
      overview: 'Un ladrón que roba secretos.',
      tmdbId: 27205,
    });
    expect(parsed[1]).toMatchObject({ title: 'Sin fecha ni póster', year: null, posterPath: null });
    expect(parsed.map((entry) => entry.title)).toEqual(['Origen', 'Sin fecha ni póster', 'Larga']);
    expect(parsed[2]?.overview).toHaveLength(MOVIE_OVERVIEW_MAX);
    expect(parseTmdbSearch(null)).toEqual([]);
    expect(parseTmdbSearch({ status_message: 'Invalid API key' })).toEqual([]);
  });

  it('monta la dirección del póster con el tamaño pedido', () => {
    expect(posterUrl('/origen.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/origen.jpg');
    expect(posterUrl(null, 'w342')).toBeNull();
  });

  it('una película escrita a mano solo lleva el título', () => {
    expect(manualMovie('  la   sociedad de la nieve ')).toEqual({
      title: 'la sociedad de la nieve',
      year: null,
      posterPath: null,
      overview: '',
      tmdbId: null,
    });
  });

  it('reconoce la misma película por TMDB o por título y año', () => {
    const list = [movie(), movie({ id: 'm2', title: 'Dune', year: 2021, tmdbId: null })];
    expect(findSameMovie(list, { title: 'Inception', year: 2010, tmdbId: 27205 })?.id).toBe('m1');
    expect(findSameMovie(list, { title: 'dune', year: 2021, tmdbId: null })?.id).toBe('m2');
    expect(findSameMovie(list, { title: 'Dune', year: null, tmdbId: null })?.id).toBe('m2');
    expect(findSameMovie(list, { title: 'Dune', year: 1984, tmdbId: 841 })).toBeUndefined();
  });

  it('separa las pendientes de las vistas, cada lista en su orden', () => {
    const list = [
      movie({ id: 'a', title: 'Antigua', addedAt: 1 }),
      movie({ id: 'b', title: 'Nueva', addedAt: 5 }),
      movie({ id: 'c', title: 'Vista hace tiempo', watched: true, watchedAt: 10 }),
      movie({ id: 'd', title: 'Vista ayer', watched: true, watchedAt: 20 }),
    ];
    expect(moviesToWatch(list).map((entry) => entry.id)).toEqual(['b', 'a']);
    expect(watchedMovies(list).map((entry) => entry.id)).toEqual(['d', 'c']);
  });
});
