import {
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@/data/fb';
import { eventTypeOf, type AgendaEvent, type EventDraft } from '@/domain/agenda/types';

const eventsCol = (hid: string) => collection(db, 'households', hid, 'events');
const eventRef = (hid: string, id: string) => doc(db, 'households', hid, 'events', id);

type Raw = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const textOrNull = (value: unknown) => (typeof value === 'string' && value ? value : null);

function toEvent(id: string, data: Raw): AgendaEvent {
  return {
    id,
    title: text(data.title),
    type: eventTypeOf(data.type),
    date: text(data.date),
    endDate: textOrNull(data.endDate),
    time: textOrNull(data.time),
    location: text(data.location),
    notes: text(data.notes),
    participants: Array.isArray(data.participants) ? (data.participants as string[]) : [],
    reminders: Array.isArray(data.reminders)
      ? data.reminders.filter((minutes): minutes is number => typeof minutes === 'number')
      : [],
    yearly: data.yearly === true,
  };
}

export function watchEvents(
  hid: string,
  onChange: (events: AgendaEvent[]) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(
    eventsCol(hid),
    (snapshot) => onChange(snapshot.docs.map((entry) => toEvent(entry.id, entry.data()))),
    onError,
  );
}

export async function createEvent(hid: string, draft: EventDraft, uid: string): Promise<void> {
  await setDoc(doc(eventsCol(hid)), { ...draft, createdBy: uid, createdAt: serverTimestamp() });
}

export async function updateEvent(hid: string, id: string, draft: EventDraft): Promise<void> {
  await updateDoc(eventRef(hid, id), draft);
}

export async function deleteEvent(hid: string, id: string): Promise<void> {
  await deleteDoc(eventRef(hid, id));
}
