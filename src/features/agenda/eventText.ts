import { useTranslation } from 'react-i18next';

import { daysUntil } from '@/domain/agenda/occurrences';
import type { AgendaEvent, Occurrence } from '@/domain/agenda/types';
import { dateKeyToLocalDate, type DateKey } from '@/domain/dates';
import type { Member } from '@/domain/household';
import { useSession } from '@/state/session';

/** Textos de un evento que dependen del idioma o del hogar: fecha, hora, cuánto falta y de quién es. */
export function useEventText() {
  const { t, i18n } = useTranslation();
  const members = useSession((state) => state.members);

  const day = (date: DateKey) => {
    const text = new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(dateKeyToLocalDate(date));
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  /** "Sáb, 14 nov · 21:00" o, si dura varios días, "28 nov – 3 dic". */
  const when = ({ event, date, endDate }: Occurrence) => {
    const range = endDate !== date ? `${day(date)} – ${day(endDate)}` : day(date);
    return event.time ? `${range} · ${event.time}` : range;
  };

  /** "Hoy", "Mañana", "Faltan 3 días" o "En curso" si ya ha empezado. */
  const countdown = (occurrence: Occurrence, today: DateKey) => {
    if (occurrence.date < today) return t('agenda.countdown.ongoing');
    const days = daysUntil(occurrence, today);
    if (days === 0) return t('agenda.countdown.today');
    if (days === 1) return t('agenda.countdown.tomorrow');
    return t('agenda.countdown.days', { count: days });
  };

  /** La persona a la que pertenece el evento, o `null` si es de todo el hogar. */
  const owner = (event: Pick<AgendaEvent, 'participants'>): Member | null =>
    event.participants.length === 1
      ? (members.find((member) => member.uid === event.participants[0]) ?? null)
      : null;

  /** "Los dos" (o "Todos" si en el hogar hay más de dos personas). */
  const sharedLabel = members.length > 2 ? t('agenda.whose.everyone') : t('agenda.whose.both');

  /** De quién es: el nombre de la persona, o "Los dos". */
  const whose = (event: Pick<AgendaEvent, 'participants'>): string =>
    owner(event)?.name ?? sharedLabel;

  return { day, when, countdown, owner, whose, sharedLabel };
}
