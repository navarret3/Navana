import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { deleteEvent, updateEvent } from '@/data/events';
import type { EventDraft } from '@/domain/agenda/types';
import { EventForm } from '@/features/agenda/EventForm';
import { useAgenda } from '@/state/agenda';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { Button, Screen, ScreenHeader, useGoBack } from '@/ui';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const event = useAgenda((state) => state.events.find((candidate) => candidate.id === id));

  if (!household || !event) return null;

  const save = (draft: EventDraft) => {
    updateEvent(household.id, event.id, draft).catch(saveFailed('No se ha podido guardar el evento'));
    goBack();
  };

  const remove = () => {
    deleteEvent(household.id, event.id).catch(saveFailed('No se ha podido eliminar el evento'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('agenda.form.editTitle')} />
      <EventForm
        key={event.id}
        initial={event}
        members={members}
        submitLabel={t('common.save')}
        onSubmit={save}
      />
      <Button variant="ghost" label={t('agenda.form.delete')} onPress={remove} />
    </Screen>
  );
}
