import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { noteHeading, sortNotes } from '@/domain/notes';
import { useExtras } from '@/state/extras';
import { useSession } from '@/state/session';
import { Card, EmptyState, Screen, Text, colors, shadows, spacing } from '@/ui';

export default function NotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const notes = sortNotes(useExtras((state) => state.notes));
  const members = useSession((state) => state.members);

  const fab = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('notes.add')}
      onPress={() => router.push({ pathname: '/note/[id]', params: { id: 'new' } })}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
      <Text style={styles.fabIcon}>＋</Text>
    </Pressable>
  );

  if (notes.length === 0) {
    return (
      <Screen scroll={false} floating={fab}>
        <Text variant="title" accessibilityRole="header">
          {t('notes.title')}
        </Text>
        <EmptyState icon="📝" title={t('notes.empty.title')} description={t('notes.empty.description')} />
      </Screen>
    );
  }

  return (
    <Screen floating={fab}>
      <Text variant="title" accessibilityRole="header">
        {t('notes.title')}
      </Text>
      {notes.map((note) => {
        const author = members.find((member) => member.uid === note.updatedBy);
        return (
          <Pressable
            key={note.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}>
            <Card tone={note.pinned ? 'peach' : 'surface'}>
              <Text variant="heading" numberOfLines={2}>
                {note.pinned ? '📌 ' : ''}
                {noteHeading(note)}
              </Text>
              {note.title.trim() && note.body.trim() ? (
                <Text color="inkSoft" numberOfLines={4}>
                  {note.body.trim()}
                </Text>
              ) : null}
              {author ? (
                <Text variant="caption" color="inkMuted">
                  {author.avatar} {author.name}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        );
      })}
      <View style={styles.fabSpace} />
    </Screen>
  );
}

const FAB_SIZE = 60;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.peach,
    ...shadows.raised,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabIcon: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.onPeach,
  },
  fabSpace: {
    height: FAB_SIZE,
  },
});
