/** Datos de los módulos opcionales: notas compartidas y menú semanal. */
import { collection, db, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from '@/data/fb';
import type { DayMenu, Meal, MealSlot } from '@/domain/menu';
import type { Note, NoteDraft } from '@/domain/notes';

type Raw = Record<string, unknown>;
type OnError = (error: unknown) => void;

const text = (value: unknown) => (typeof value === 'string' ? value : '');

// ---------- Notas ----------

const notesCol = (hid: string) => collection(db, 'households', hid, 'notes');
const noteRef = (hid: string, id: string) => doc(db, 'households', hid, 'notes', id);

function toNote(id: string, data: Raw): Note {
  return {
    id,
    title: text(data.title),
    body: text(data.body),
    pinned: data.pinned === true,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
    updatedBy: text(data.updatedBy),
  };
}

export function watchNotes(hid: string, onChange: (notes: Note[]) => void, onError: OnError) {
  return onSnapshot(
    notesCol(hid),
    (snapshot) => onChange(snapshot.docs.map((entry) => toNote(entry.id, entry.data()))),
    onError,
  );
}

export async function createNote(hid: string, draft: NoteDraft, uid: string): Promise<void> {
  await setDoc(doc(notesCol(hid)), { ...draft, updatedAt: Date.now(), updatedBy: uid });
}

export async function updateNote(
  hid: string,
  id: string,
  draft: NoteDraft,
  uid: string,
): Promise<void> {
  await updateDoc(noteRef(hid, id), { ...draft, updatedAt: Date.now(), updatedBy: uid });
}

export async function deleteNote(hid: string, id: string): Promise<void> {
  await deleteDoc(noteRef(hid, id));
}

// ---------- Menú semanal ----------

/** Un documento por día, con la fecha como id. */
const menuDayRef = (hid: string, date: string) => doc(db, 'households', hid, 'menu', date);

function toMeal(value: unknown): Meal | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Raw;
  const title = text(data.title);
  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients.filter((item): item is string => typeof item === 'string')
    : [];
  return title || ingredients.length > 0 ? { title, ingredients } : null;
}

export function watchMenu(hid: string, onChange: (menu: DayMenu[]) => void, onError: OnError) {
  return onSnapshot(
    collection(db, 'households', hid, 'menu'),
    (snapshot) =>
      onChange(
        snapshot.docs.map((entry) => {
          const data = entry.data();
          return { date: entry.id, lunch: toMeal(data.lunch), dinner: toMeal(data.dinner) };
        }),
      ),
    onError,
  );
}

/** Guarda (o vacía, con `null`) una comida de un día sin tocar la otra. */
export async function setMeal(
  hid: string,
  date: string,
  slot: MealSlot,
  meal: Meal | null,
): Promise<void> {
  // `merge` crea el día si no existía y deja intacta la otra comida.
  await setDoc(menuDayRef(hid, date), { [slot]: meal }, { merge: true });
}
