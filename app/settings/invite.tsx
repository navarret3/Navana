import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Share, StyleSheet, View } from 'react-native';

import { createInvite, type Invite } from '@/data/invites';
import { buildInviteLink, isInviteExpired } from '@/domain/invites';
import { useSession } from '@/state/session';
import { Button, Card, Screen, ScreenHeader, Text, colors, spacing } from '@/ui';

// Última invitación creada por hogar, para no generar un código nuevo cada vez
// que se abre la pantalla. Solo vive mientras la app está abierta.
const lastInvites = new Map<string, Invite>();

function reusableInvite(householdId: string | undefined): Invite | null {
  const previous = householdId ? lastInvites.get(householdId) : undefined;
  return previous && !isInviteExpired(previous.expiresAt, new Date()) ? previous : null;
}

async function newInvite(params: Parameters<typeof createInvite>[0]): Promise<Invite> {
  const created = await createInvite(params);
  lastInvites.set(params.householdId, created);
  return created;
}

export default function InviteScreen() {
  const { t, i18n } = useTranslation();
  const user = useSession((state) => state.user);
  const household = useSession((state) => state.household);
  const householdId = household?.id;
  const householdName = household?.name;
  const uid = user?.uid;

  const [invite, setInvite] = useState<Invite | null>(() => reusableInvite(householdId));
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Al abrir la pantalla sin una invitación reciente, se crea una.
  useEffect(() => {
    if (!householdId || !householdName || !uid || reusableInvite(householdId)) return;
    let cancelled = false;
    newInvite({ householdId, householdName, uid }).then(
      (created) => {
        if (!cancelled) setInvite(created);
      },
      (cause) => {
        console.warn('No se ha podido crear la invitación', cause);
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [householdId, householdName, uid]);

  const create = async () => {
    if (!householdId || !householdName || !uid) return;
    setInvite(null);
    setFailed(false);
    setCopied(false);
    try {
      setInvite(await newInvite({ householdId, householdName, uid }));
    } catch (cause) {
      console.warn('No se ha podido crear la invitación', cause);
      setFailed(true);
    }
  };

  if (!household) return null;

  const copy = async () => {
    if (!invite) return;
    await Clipboard.setStringAsync(invite.code);
    setCopied(true);
  };

  const share = async () => {
    if (!invite) return;
    await Share.share({
      message: t('settings.invite.shareMessage', {
        household: household.name,
        code: invite.code,
        link: buildInviteLink(invite.code),
      }),
    });
  };

  const expiryText = invite
    ? t('settings.invite.expires', {
        date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(
          invite.expiresAt,
        ),
      })
    : null;

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.invite.title')} />
      <Text color="inkSoft">{t('settings.invite.explain')}</Text>

      <Card tone="peach" style={styles.codeCard}>
        {invite ? (
          <>
            <Text selectable style={styles.code} accessibilityLabel={invite.code.split('').join(' ')}>
              {invite.code}
            </Text>
            <Text variant="caption" color="inkSoft">
              {expiryText}
            </Text>
          </>
        ) : failed ? (
          <Text color="danger" center>
            {t('common.genericError')}
          </Text>
        ) : (
          <>
            <ActivityIndicator color={colors.peachDeep} />
            <Text variant="caption" color="inkSoft">
              {t('settings.invite.creating')}
            </Text>
          </>
        )}
      </Card>

      <View style={styles.actions}>
        {/* En el navegador no hay hoja de compartir; basta con copiar. */}
        {Platform.OS !== 'web' ? (
          <Button label={t('settings.invite.share')} disabled={!invite} onPress={share} />
        ) : null}
        <Button
          variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
          label={copied ? t('settings.invite.copied') : t('settings.invite.copy')}
          disabled={!invite}
          onPress={copy}
        />
        <Button
          variant="ghost"
          label={t('settings.invite.newCode')}
          disabled={!invite && !failed}
          onPress={create}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    paddingVertical: spacing.xl,
  },
  code: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 40,
    lineHeight: 52,
    letterSpacing: 8,
    color: colors.ink,
  },
  actions: {
    gap: spacing.sm,
  },
});
