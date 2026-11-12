import { addDays, toDateKey, type DateKey } from '@/domain/dates';

import { occurrencesBetween } from './occurrences';
import { involves, type AgendaEvent } from './types';

/** Los eventos de todo el día se recuerdan contando desde esta hora. */
export const ALL_DAY_REMINDER_HOUR = 9;

/** Hasta cuántos días vista se dejan programados los recordatorios. */
export const REMINDER_HORIZON_DAYS = 60;

export type PlannedReminder = {
  event: AgendaEvent;
  /** Día de la ocurrencia que se recuerda (en los anuales, la de este año o el siguiente). */
  date: DateKey;
  minutesBefore: number;
  at: Date;
};

/** Momento en que empieza una ocurrencia, en la hora local del móvil. */
function startOf(date: DateKey, time: string | null): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time ? time.split(':').map(Number) : [ALL_DAY_REMINDER_HOUR, 0];
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0);
}

/**
 * Recordatorios locales que este móvil tiene que programar: los de los eventos que le
 * conciernen a `uid`, que aún no han pasado y caen dentro del horizonte.
 *
 * Como el planificador de tareas, es una función pura que se recalcula cada vez que
 * cambia la agenda o se abre la app.
 */
export function planEventReminders(params: {
  events: readonly AgendaEvent[];
  uid: string;
  now: Date;
  horizonDays?: number;
}): PlannedReminder[] {
  const { events, uid, now } = params;
  const horizonDays = params.horizonDays ?? REMINDER_HORIZON_DAYS;
  const today = toDateKey(now);
  const limit = now.getTime() + horizonDays * 24 * 60 * 60 * 1000;
  const mine = events.filter((event) => involves(event, uid) && event.reminders.length > 0);

  const planned: PlannedReminder[] = [];
  // Se mira una semana más allá porque un recordatorio "una semana antes" puede caer dentro.
  for (const { event, date } of occurrencesBetween(mine, today, addDays(today, horizonDays + 7))) {
    const start = startOf(date, event.time).getTime();
    for (const minutesBefore of new Set(event.reminders)) {
      const at = start - minutesBefore * 60 * 1000;
      if (at > now.getTime() && at <= limit) {
        planned.push({ event, date, minutesBefore, at: new Date(at) });
      }
    }
  }
  return planned.sort((a, b) => a.at.getTime() - b.at.getTime());
}
