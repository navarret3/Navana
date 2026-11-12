import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';

import { createNote, deleteNote, updateNote } from '@/data/extras';
import { NOTE_BODY_MAX, NOTE_TITLE_MAX, isEmptyNote, type NoteDraft } from '@/domain/notes';
import { useExtras } from '@/state/extras';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { Button, ListRow, Screen, ScreenHeader, TextField, colors, useGoBack } from '@/ui';

/** Crear (`/note/new`) o editar una nota compartida. */
export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const uid = useSession((state) => state.user?.uid);
  const existing = useExtras((state) => state.notes.find((note) => note.id === id));
  const isNew = id === 'new';

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [error, setError] = useState<string | null>(null);

  if (!household || !uid || (!isNew && !existing)) return null;

  const save = () => {
    const draft: NoteDraft = {
      title: title.trim().slice(0, NOTE_TITLE_MAX),
      body: body.trim().slice(0, NOTE_BODY_MAX),
      pinned,
    };
    if (isEmptyNote(draft)) {
      setError(t('notes.form.empty'));
      return;
    }
    const saved = existing
      ? updateNote(household.id, existing.id, draft, uid)
      : createNote(household.id, draft, uid);
    saved.catch(saveFailed('No se ha podido guardar la nota'));
    goBack();
  };

  const remove = () => {
    if (!existing) return;
    deleteNote(household.id, existing.id).catch(saveFailed('No se ha podido eliminar la nota'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={isNew ? t('notes.form.newTitle') : t('notes.form.editTitle')} />
      <TextField
        label={t('notes.form.titleLabel')}
        value={title}
        onChangeText={setTitle}
        maxLength={NOTE_TITLE_MAX}
        autoCapitalize="sentences"
      />
      <TextField
        label={t('notes.form.bodyLabel')}
        value={body}
        onChangeText={setBody}
        maxLength={NOTE_BODY_MAX}
        multiline
        tall
        error={error}
      />
      <ListRow
        icon="📌"
        title={t('notes.form.pinned')}
        subtitle={t('notes.form.pinnedHint')}
        trailing={
          <Switch
            accessibilityLabel={t('notes.form.pinned')}
            value={pinned}
            onValueChange={setPinned}
            trackColor={{ false: colors.border, true: colors.sage }}
            thumbColor={colors.white}
          />
        }
      />
      <Button label={t('common.save')} onPress={save} />
      {existing ? <Button variant="ghost" label={t('notes.form.delete')} onPress={remove} /> : null}
    </Screen>
  );
}
