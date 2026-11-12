/** Notas compartidas del hogar: la clave del wifi, el veterinario, lo que hay que recordar. */

export type Note = {
  id: string;
  title: string;
  body: string;
  /** Las fijadas van arriba y salen en "Hoy". */
  pinned: boolean;
  /** Última edición, en milisegundos. */
  updatedAt: number;
  updatedBy: string;
};

export type NoteDraft = Pick<Note, 'title' | 'body' | 'pinned'>;

export const NOTE_TITLE_MAX = 80;
export const NOTE_BODY_MAX = 5000;

/** Fijadas primero; dentro de cada grupo, lo editado más recientemente arriba. */
export function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
  );
}

/** Una nota sin título se nombra por su primera línea. */
export function noteHeading(note: Pick<Note, 'title' | 'body'>): string {
  return note.title.trim() || (note.body.trim().split('\n')[0] ?? '').slice(0, NOTE_TITLE_MAX);
}

export function isEmptyNote(draft: Pick<Note, 'title' | 'body'>): boolean {
  return !draft.title.trim() && !draft.body.trim();
}
