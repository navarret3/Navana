import { addDays, diffDays, type DateKey } from '@/domain/dates';

import type { AgendaEvent, Occurrence } from './types';

const yearOf = (key: DateKey) => Number(key.slice(0, 4));

/** La fecha de un evento anual en un año concreto. El 29 de febrero pasa al 28 si no es bisiesto. */
function dateInYear(date: DateKey, year: number): DateKey {
  const monthDay = date.slice(5);
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return `${String(year).padStart(4, '0')}-${monthDay === '02-29' && !leap ? '02-28' : monthDay}`;
}

function occurrenceOf(event: AgendaEvent, year?: number): Occurrence {
  if (event.yearly && year !== undefined) {
    const date = dateInYear(event.date, year);
    return { event, date, endDate: date };
  }
  return { event, date: event.date, endDate: event.endDate ?? event.date };
}

/** Orden natural de la agenda: por día, luego lo de todo el día, luego por hora y por título. */
function byDateAndTime(a: Occurrence, b: Occurrence): number {
  return (
    a.date.localeCompare(b.date) ||
    (a.event.time ?? '').localeCompare(b.event.time ?? '') ||
    a.event.title.localeCompare(b.event.title)
  );
}

/** Todo lo que ocurre (aunque sea en parte) entre dos fechas, ambas incluidas. */
export function occurrencesBetween(
  events: readonly AgendaEvent[],
  from: DateKey,
  to: DateKey,
): Occurrence[] {
  const found: Occurrence[] = [];
  for (const event of events) {
    const candidates = event.yearly
      ? Array.from({ length: yearOf(to) - yearOf(from) + 1 }, (_, index) =>
          occurrenceOf(event, yearOf(from) + index),
        )
      : [occurrenceOf(event)];
    for (const occurrence of candidates) {
      if (occurrence.date <= to && occurrence.endDate >= from) found.push(occurrence);
    }
  }
  return found.sort(byDateAndTime);
}

/** La próxima vez que ocurre cada evento que aún no ha terminado, lo más cercano primero. */
export function upcomingOccurrences(
  events: readonly AgendaEvent[],
  today: DateKey,
  limit = Infinity,
): Occurrence[] {
  const upcoming: Occurrence[] = [];
  for (const event of events) {
    if (event.yearly) {
      const thisYear = occurrenceOf(event, yearOf(today));
      upcoming.push(thisYear.date >= today ? thisYear : occurrenceOf(event, yearOf(today) + 1));
    } else {
      const occurrence = occurrenceOf(event);
      if (occurrence.endDate >= today) upcoming.push(occurrence);
    }
  }
  return upcoming.sort(byDateAndTime).slice(0, limit);
}

/** Días que faltan para que empiece. Cero si es hoy o ya está en curso. */
export function daysUntil(occurrence: Pick<Occurrence, 'date'>, today: DateKey): number {
  return Math.max(0, diffDays(today, occurrence.date));
}

/** Días del calendario que ocupa una ocurrencia, para marcarlos en la vista de mes. */
export function daysOf(occurrence: Pick<Occurrence, 'date' | 'endDate'>): DateKey[] {
  const length = diffDays(occurrence.date, occurrence.endDate) + 1;
  return Array.from({ length }, (_, index) => addDays(occurrence.date, index));
}
