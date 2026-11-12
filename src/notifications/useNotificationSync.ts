import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { planEventReminders } from '@/domain/agenda/reminders';
import { EVENT_ICONS } from '@/domain/agenda/types';
import { addPushToken } from '@/data/households';
import { useAgenda } from '@/state/agenda';
import { useCurrentMember, useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';

import {
  getPushToken,
  initNotifications,
  onNotificationOpened,
  requestPermission,
  scheduleLocalNotifications,
} from './device';
import { planLocalNotifications } from './localPlanner';

/** Espera a que las tareas dejen de cambiar antes de reprogramar los avisos. */
const RESCHEDULE_DELAY_MS = 1500;

const warn = (what: string) => (error: unknown) => console.warn(what, error);

/**
 * Pide permiso si hace falta y apunta el token de push de este móvil en la ficha del
 * miembro. Devuelve el token, o `null` si no hay permiso o no se ha podido obtener.
 */
export async function registerThisDevice(params: {
  householdId: string;
  uid: string;
  knownTokens: readonly string[];
}): Promise<string | null> {
  await initNotifications();
  await requestPermission();
  const token = await getPushToken();
  if (token && !params.knownTokens.includes(token)) {
    await addPushToken(params.householdId, params.uid, token);
  }
  return token;
}

/**
 * Mantiene los avisos de este móvil al día mientras hay un hogar abierto:
 * registra su token de push en la ficha del miembro y reprograma los avisos
 * locales (resumen diario, atrasadas y recordatorios de la agenda) cada vez que
 * cambian las tareas o los eventos.
 */
export function useNotificationSync(): void {
  const { t } = useTranslation();
  const router = useRouter();
  const householdId = useSession((state) => state.household?.id);
  const memberIds = useSession((state) => state.household?.memberIds);
  const me = useCurrentMember();
  const tasks = useTasks((state) => state.tasks);
  const events = useAgenda((state) => state.events);

  const uid = me?.uid;
  const prefs = me?.notify;
  const knownTokens = me?.pushTokens;

  // Permiso y token de push: una vez por sesión en el hogar.
  useEffect(() => {
    if (!householdId || !uid || !knownTokens) return;
    registerThisDevice({ householdId, uid, knownTokens }).catch(
      warn('No se han podido preparar los avisos'),
    );
    // `knownTokens` cambia al guardar el token; no hace falta repetir por eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, uid, knownTokens === undefined]);

  // Al tocar un aviso se abre aquello de lo que avisa.
  useEffect(
    () =>
      onNotificationOpened((data) => {
        if (typeof data.eventId === 'string') {
          router.push({ pathname: '/event/[id]', params: { id: data.eventId } });
        } else if (typeof data.taskId === 'string') {
          router.push({ pathname: '/task/[id]', params: { id: data.taskId } });
        } else if (data.screen === 'tasks') {
          router.push('/tasks');
        }
      }),
    [router],
  );

  // Avisos locales: se recalculan cuando cambian las tareas o las preferencias.
  useEffect(() => {
    if (!uid || !memberIds || !prefs) return;
    const timer = setTimeout(() => {
      const now = new Date();
      const taskNotifications = planLocalNotifications({ tasks, uid, memberIds, now, prefs }).map(
        (item) => ({
          at: item.at,
          title: t(`notifications.${item.kind}.title`),
          body: t(`notifications.${item.kind}.body`, {
            count: item.count,
            first: item.firstTitle,
          }),
          data: { screen: 'tasks' },
        }),
      );
      // Los recordatorios de la agenda van siempre: se eligen evento a evento.
      const eventReminders = planEventReminders({ events, uid, now }).map((reminder) => ({
        at: reminder.at,
        data: { eventId: reminder.event.id },
        title: `${EVENT_ICONS[reminder.event.type]} ${reminder.event.title}`,
        body: [
          t(
            `notifications.event.${reminder.event.time ? 'timed' : 'allDay'}.${reminder.minutesBefore}`,
            { defaultValue: t('notifications.event.fallback') },
          ),
          reminder.event.time,
          reminder.event.location,
        ]
          .filter(Boolean)
          .join(' · '),
      }));
      // Se programan todos de una vez: cada pasada sustituye a la anterior.
      scheduleLocalNotifications([...taskNotifications, ...eventReminders]).catch(
        warn('No se han podido programar los avisos'),
      );
    }, RESCHEDULE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [tasks, events, uid, memberIds, prefs, t]);
}
