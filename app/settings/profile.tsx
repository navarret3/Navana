import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { updateMemberProfile } from '@/data/households';
import { MEMBER_AVATARS, MEMBER_COLORS, MEMBER_NAME_MAX, cleanName } from '@/domain/household';
import { useCurrentMember, useSession } from '@/state/session';
import {
  Avatar,
  Button,
  OptionPicker,
  Screen,
  ScreenHeader,
  TextField,
  spacing,
  useGoBack,
} from '@/ui';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const me = useCurrentMember();

  const [name, setName] = useState(me?.name ?? '');
  const [avatar, setAvatar] = useState(me?.avatar ?? '');
  const [color, setColor] = useState(me?.color ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!household || !me) return null;

  const save = async () => {
    const cleaned = cleanName(name, MEMBER_NAME_MAX);
    if (!cleaned) {
      setError(t('settings.profile.nameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateMemberProfile(household.id, me.uid, { name: cleaned, avatar, color });
      goBack();
    } catch (cause) {
      console.warn('No se ha podido guardar el perfil', cause);
      setError(t('common.genericError'));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.profile.title')} />

      <View style={styles.preview}>
        <Avatar emoji={avatar} name={name} color={color} size={96} />
      </View>

      <TextField
        label={t('settings.profile.nameLabel')}
        value={name}
        onChangeText={setName}
        maxLength={MEMBER_NAME_MAX}
        autoCapitalize="words"
        error={error}
      />
      <OptionPicker
        kind="emoji"
        label={t('settings.profile.avatarLabel')}
        options={MEMBER_AVATARS}
        value={avatar}
        onChange={setAvatar}
      />
      <OptionPicker
        kind="color"
        label={t('settings.profile.colorLabel')}
        options={MEMBER_COLORS}
        value={color}
        onChange={setColor}
      />

      <Button label={t('common.save')} loading={busy} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
