import type { DateKey } from '@/domain/dates';

/**
 * - `trip`: viaje o escapada; suele durar varios días.
 * - `concert`: concierto, festival u otro espectáculo.
 * - `appointment`: cita (veterinario, médico, un trámite).
 * - `event`: cualquier otra cosa (una cena, una fiesta).
 */
export const EVENT_TYPES = ['trip', 'concert', 'appointment', 'event'] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_ICONS: Record<EventType, string> = {
  trip: '✈️',
  concert: '🎵',
  appointment: '📌',
  event: '🎉',
};

/**
 * Tipo con el que se muestra lo guardado. Los eventos anteriores a estos tipos (`plan`,
 * `birthday`) y cualquier valor desconocido pasan a ser `event`.
 */
export function eventTypeOf(value: unknown): EventType {
  return EVENT_TYPES.find((type) => type === value) ?? 'event';
}

export type AgendaEvent = {
  id: string;
  title: string;
  type: EventType;
  /** Día en que empieza. En lo que se repite cada año, la fecha de un año cualquiera. */
  date: DateKey;
  /** Último día, si dura varios (un viaje). */
  endDate: DateKey | null;
  /** Hora de inicio como `HH:mm`. `null` significa todo el día. */
  time: string | null;
  location: string;
  notes: string;
  /** A quién le concierne. Vacío significa todo el hogar. */
  participants: string[];
  /** Recordatorios, en minutos antes del inicio. */
  reminders: number[];
  /** Se repite cada año en la misma fecha. */
  yearly: boolean;
};

export type EventDraft = Omit<AgendaEvent, 'id'>;

/** Una vez concreta en que ocurre un evento: en los anuales, la de un año determinado. */
export type Occurrence = {
  event: AgendaEvent;
  date: DateKey;
  endDate: DateKey;
};

/** Recordatorios que se ofrecen cuando el evento tiene hora: a la hora, 1 hora antes, 1 día antes. */
export const TIMED_REMINDERS = [0, 60, 1440] as const;

/**
 * Recordatorios para eventos de todo el día: ese día, el día antes y una semana antes.
 * Cuentan desde las 9:00 del día del evento.
 */
export const ALL_DAY_REMINDERS = [0, 1440, 10080] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** ¿Le concierne el evento a esta persona? */
export function involves(event: Pick<AgendaEvent, 'participants'>, uid: string): boolean {
  return event.participants.length === 0 || event.participants.includes(uid);
}
