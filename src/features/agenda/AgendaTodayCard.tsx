import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { upcomingOccurrences } from '@/domain/agenda/occurrences';
import { EVENT_ICONS } from '@/domain/agenda/types';
import { toDateKey } from '@/domain/dates';
import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { useAgenda } from '@/state/agenda';
import { Text } from '@/ui';

import { useEventText } from './eventText';

/** Tarjeta de "Hoy": el próximo plan, con su cuenta atrás. Tocarla abre la agenda. */
export function AgendaTodayCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const events = useAgenda((state) => state.events);
  const { when, countdown, whose } = useEventText();

  const today = toDateKey(new Date());
  const [next] = upcomingOccurrences(events, today, 1);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('agenda.todayCard.open')}
      onPress={() => router.push('/agenda')}>
      <TodaySummaryCard icon="📅" title={t('agenda.todayCard.title')} tone="peach">
        {next ? (
          <>
            <Text variant="title">{countdown(next, today)}</Text>
            <Text variant="bodyStrong">
              {EVENT_ICONS[next.event.type]} {next.event.title}
            </Text>
            <Text color="inkSoft">
              {when(next)}
              {next.event.location ? ` · ${next.event.location}` : ''}
              {whose(next.event) ? ` · ${whose(next.event)}` : ''}
            </Text>
          </>
        ) : (
          <Text color="inkSoft">{t('agenda.todayCard.empty')}</Text>
        )}
      </TodaySummaryCard>
    </Pressable>
  );
}
