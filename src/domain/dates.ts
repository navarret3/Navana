/**
 * Fechas de calendario sin hora, como texto `YYYY-MM-DD`.
 * Las tareas vencen "un día", no a una hora: guardar solo el día evita líos de zona horaria
 * y hace que comparar fechas sea comparar textos.
 */
export type DateKey = string;

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

/** El día de calendario de `date` en la zona horaria del dispositivo. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toUtc(key: DateKey): number {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function fromUtc(time: number): DateKey {
  const date = new Date(time);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(key: DateKey, days: number): DateKey {
  return fromUtc(toUtc(key) + days * DAY_MS);
}

/** Días que van de `from` a `to` (negativo si `to` es anterior). */
export function diffDays(from: DateKey, to: DateKey): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Lunes de la semana de `key`. */
export function startOfWeek(key: DateKey): DateKey {
  const weekday = new Date(toUtc(key)).getUTCDay(); // 0 = domingo
  return addDays(key, -((weekday + 6) % 7));
}

export function startOfMonth(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`;
}

/** Fecha a mediodía local de ese día, para darle formato con `Intl`. */
export function dateKeyToLocalDate(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
}

export type YearMonth = { year: number; month: number };

/** Año y mes (1-12) de una fecha. */
export function yearMonthOf(key: DateKey): YearMonth {
  return { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) };
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

/**
 * Semanas (de lunes a domingo) que hacen falta para pintar un mes entero, incluyendo
 * los días del mes anterior y del siguiente que completan la primera y la última.
 */
export function monthMatrix({ year, month }: YearMonth): DateKey[][] {
  const first = `${String(year).padStart(4, '0')}-${pad(month)}-01`;
  const next = addMonths({ year, month }, 1);
  const last = addDays(`${String(next.year).padStart(4, '0')}-${pad(next.month)}-01`, -1);

  const weeks: DateKey[][] = [];
  for (let monday = startOfWeek(first); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(monday, index)));
  }
  return weeks;
}
