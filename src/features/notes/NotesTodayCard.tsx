import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { noteHeading, sortNotes } from '@/domain/notes';
import { TodaySummaryCard } from '@/features/today/TodaySummaryCard';
import { useExtras } from '@/state/extras';
import { Text } from '@/ui';

/** Cuántas notas fijadas caben en "Hoy". */
const PREVIEW = 3;

/** Tarjeta de "Hoy": las notas fijadas, que son las que conviene tener a la vista. */
export function NotesTodayCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const pinned = sortNotes(useExtras((state) => state.notes))
    .filter((note) => note.pinned)
    .slice(0, PREVIEW);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('notes.todayCard.open')}
      onPress={() => router.push('/notes')}>
      <TodaySummaryCard icon="📝" title={t('notes.todayCard.title')}>
        {pinned.length === 0 ? (
          <Text color="inkSoft">{t('notes.todayCard.empty')}</Text>
        ) : (
          pinned.map((note) => (
            <Text key={note.id} numberOfLines={2}>
              <Text variant="bodyStrong">{noteHeading(note)}</Text>
              {note.title.trim() && note.body.trim() ? ` — ${note.body.trim()}` : ''}
            </Text>
          ))
        )}
      </TodaySummaryCard>
    </Pressable>
  );
}
