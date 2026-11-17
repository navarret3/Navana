import { collection, db, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from '@/data/fb';
import type { Movie, MovieDraft } from '@/domain/movies';

type Raw = Record<string, unknown>;

const moviesCol = (hid: string) => collection(db, 'households', hid, 'movies');
const movieRef = (hid: string, id: string) => doc(db, 'households', hid, 'movies', id);

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const numberOrNull = (value: unknown) => (typeof value === 'number' ? value : null);
const textOrNull = (value: unknown) => (typeof value === 'string' && value ? value : null);

function toMovie(id: string, data: Raw): Movie {
  return {
    id,
    title: text(data.title),
    year: numberOrNull(data.year),
    posterPath: textOrNull(data.posterPath),
    overview: text(data.overview),
    tmdbId: numberOrNull(data.tmdbId),
    addedBy: text(data.addedBy),
    addedAt: numberOrNull(data.addedAt) ?? 0,
    watched: data.watched === true,
    watchedAt: numberOrNull(data.watchedAt),
    watchedBy: textOrNull(data.watchedBy),
  };
}

export function watchMovies(
  hid: string,
  onChange: (movies: Movie[]) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(
    moviesCol(hid),
    (snapshot) => onChange(snapshot.docs.map((entry) => toMovie(entry.id, entry.data()))),
    onError,
  );
}

export async function addMovie(hid: string, draft: MovieDraft, uid: string): Promise<void> {
  await setDoc(doc(moviesCol(hid)), {
    ...draft,
    addedBy: uid,
    addedAt: Date.now(),
    watched: false,
    watchedAt: null,
    watchedBy: null,
  });
}

export async function setMovieWatched(
  hid: string,
  id: string,
  watched: boolean,
  uid: string,
): Promise<void> {
  await updateDoc(movieRef(hid, id), {
    watched,
    watchedAt: watched ? Date.now() : null,
    watchedBy: watched ? uid : null,
  });
}

export async function removeMovie(hid: string, id: string): Promise<void> {
  await deleteDoc(movieRef(hid, id));
}
