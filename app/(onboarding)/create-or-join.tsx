import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { createHousehold } from '@/data/households';
import { JoinError, joinHousehold } from '@/data/invites';
import { signOutEverywhere } from '@/data/signIn';
import {
  DEFAULT_HOUSEHOLD_ICON,
  DEFAULT_MEMBER_AVATAR,
  HOUSEHOLD_ICONS,
  HOUSEHOLD_NAME_MAX,
  MEMBER_AVATARS,
  MEMBER_COLORS,
  cleanName,
  firstName,
  pickMemberColor,
} from '@/domain/household';
import { INVITE_CODE_LENGTH, normalizeInviteCode } from '@/domain/invites';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import { Button, OptionPicker, Screen, Text, TextField, colors, radii, spacing } from '@/ui';

type Mode = 'create' | 'join';

export default function CreateOrJoinScreen() {
  const { t } = useTranslation();
  const user = useSession((state) => state.user);
  const pendingInviteCode = useSession((state) => state.pendingInviteCode);
  const setPendingInviteCode = useSession((state) => state.setPendingInviteCode);

  // Quien llega desde un enlace de invitación ya trae el código puesto.
  const [mode, setMode] = useState<Mode>(pendingInviteCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(DEFAULT_HOUSEHOLD_ICON);
  const [code, setCode] = useState(pendingInviteCode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberName = firstName(user?.displayName) || t('onboarding.defaultMemberName');

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submitCreate = async () => {
    const householdName = cleanName(name, HOUSEHOLD_NAME_MAX);
    if (!user) return;
    if (!householdName) {
      setError(t('onboarding.create.nameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createHousehold({
        uid: user.uid,
        name: householdName,
        icon,
        profile: { name: memberName, color: MEMBER_COLORS[0], avatar: DEFAULT_MEMBER_AVATAR },
      });
      // Un hogar recién creado empieza eligiendo sus tareas típicas.
      useTasks.getState().setOfferTemplate(true);
      // Al guardarse, la sesión pasa a tener hogar y el router entra en la app.
    } catch (cause) {
      console.warn('No se ha podido crear el hogar', cause);
      setError(t('common.genericError'));
      setBusy(false);
    }
  };

  const submitJoin = async () => {
    const inviteCode = normalizeInviteCode(code);
    if (!user) return;
    if (!inviteCode) {
      setError(t('onboarding.join.invalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await joinHousehold({
        code: inviteCode,
        uid: user.uid,
        // Quien crea el hogar usa el primer color y avatar; quien se une, los siguientes.
        // Cada uno puede cambiarlos luego en su perfil.
        profile: {
          name: memberName,
          color: pickMemberColor([MEMBER_COLORS[0]]),
          avatar: MEMBER_AVATARS[1],
        },
      });
      setPendingInviteCode(null);
    } catch (cause) {
      if (cause instanceof JoinError) {
        setError(t(`onboarding.join.${cause.reason}`));
      } else {
        console.warn('No se ha podido unir al hogar', cause);
        setError(t('common.genericError'));
      }
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.intro}>
        <Text style={styles.wave}>🐾</Text>
        <Text variant="display">
          {firstName(user?.displayName)
            ? t('onboarding.title', { name: firstName(user?.displayName) })
            : t('onboarding.titleNoName')}
        </Text>
        <Text color="inkSoft">{t('onboarding.subtitle')}</Text>
      </View>

      <View accessibilityRole="tablist" style={styles.modes}>
        {(['create', 'join'] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === option }}
            disabled={busy}
            onPress={() => switchMode(option)}
            style={[styles.mode, mode === option && styles.modeSelected]}>
            <Text variant="bodyStrong" color={mode === option ? 'ink' : 'inkSoft'}>
              {t(`onboarding.${option}.tab`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'create' ? (
        <View style={styles.form}>
          <TextField
            label={t('onboarding.create.nameLabel')}
            placeholder={t('onboarding.create.namePlaceholder')}
            value={name}
            onChangeText={setName}
            maxLength={HOUSEHOLD_NAME_MAX}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={submitCreate}
            error={error}
          />
          <OptionPicker
            kind="emoji"
            label={t('onboarding.create.iconLabel')}
            options={HOUSEHOLD_ICONS}
            value={icon}
            onChange={setIcon}
          />
          <Button label={t('onboarding.create.submit')} loading={busy} onPress={submitCreate} />
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            code
            label={t('onboarding.join.codeLabel')}
            placeholder={t('onboarding.join.codePlaceholder')}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            // Deja margen para pegar el enlace entero o el código con guiones.
            maxLength={INVITE_CODE_LENGTH + 24}
            returnKeyType="done"
            onSubmitEditing={submitJoin}
            error={error}
            hint={t('onboarding.join.hint')}
          />
          <Button label={t('onboarding.join.submit')} loading={busy} onPress={submitJoin} />
        </View>
      )}

      <Button
        variant="ghost"
        label={t('auth.signOut')}
        disabled={busy}
        onPress={() => signOutEverywhere()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  wave: {
    fontSize: 40,
    lineHeight: 52,
  },
  modes: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    padding: spacing.xs,
  },
  mode: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  modeSelected: {
    backgroundColor: colors.surface,
  },
  form: {
    gap: spacing.lg,
  },
});
