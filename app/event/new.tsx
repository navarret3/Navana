import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { createEvent } from '@/data/events';
import type { EventDraft } from '@/domain/agenda/types';
import { toDateKey } from '@/domain/dates';
import { EventForm } from '@/features/agenda/EventForm';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { Screen, ScreenHeader, useGoBack } from '@/ui';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function NewEventScreen() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  // La agenda pasa el día que estaba seleccionado en el calendario.
  const { date } = useLocalSearchParams<{ date?: string }>();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const uid = useSession((state) => state.user?.uid);

  if (!household || !uid) return null;

  const initial: EventDraft = {
    title: '',
    type: 'event',
    date: date && DATE_PATTERN.test(date) ? date : toDateKey(new Date()),
    endDate: null,
    time: null,
    location: '',
    notes: '',
    participants: [],
    reminders: [1440],
    yearly: false,
  };

  const create = (draft: EventDraft) => {
    createEvent(household.id, draft, uid).catch(saveFailed('No se ha podido crear el evento'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('agenda.form.newTitle')} />
      <EventForm
        initial={initial}
        members={members}
        submitLabel={t('agenda.form.create')}
        isNew
        onSubmit={create}
      />
    </Screen>
  );
}
