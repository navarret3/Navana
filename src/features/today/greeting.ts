export type DayPart = 'morning' | 'afternoon' | 'evening';

/** Tramo del día para el saludo, con horario de aquí: "buenos días" dura hasta la comida. */
export function getDayPart(date: Date): DayPart {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 21) return 'afternoon';
  return 'evening';
}

/** Fecha larga sin año, con mayúscula inicial: "Jueves, 12 de noviembre". */
export function formatLongDate(date: Date, language: string): string {
  const text = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
