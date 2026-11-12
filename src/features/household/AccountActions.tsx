import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { deleteAccount } from '@/data/account';
import { leaveHousehold } from '@/data/households';
import { signOutEverywhere } from '@/data/signIn';
import { useSession } from '@/state/session';
import { ActionSheet, Button, Card, Text } from '@/ui';

/** Cerrar sesión, salir del hogar y eliminar la cuenta, con confirmación en lo irreversible. */
export function AccountActions() {
  const { t } = useTranslation();
  const household = useSession((state) => state.household);
  const uid = useSession((state) => state.user?.uid);
  const [confirming, setConfirming] = useState<'leave' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!uid) return null;

  // Si sale bien, la sesión cambia y el router saca de esta pantalla por su cuenta.
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setFailed(false);
    try {
      const result = await action();
      if (result === 'cancelled') setBusy(false);
    } catch (error) {
      console.warn('No se ha podido completar la acción de cuenta', error);
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <Card>
      <Text variant="heading">{t('settings.account.title')}</Text>
      <Button
        variant="secondary"
        label={t('auth.signOut')}
        disabled={busy}
        onPress={() => signOutEverywhere()}
      />
      {household ? (
        <Button
          variant="ghost"
          label={t('settings.account.leave')}
          disabled={busy}
          onPress={() => setConfirming('leave')}
        />
      ) : null}
      <Button
        variant="ghost"
        label={t('settings.account.delete')}
        loading={busy}
        onPress={() => setConfirming('delete')}
      />
      {failed ? (
        <Text variant="caption" color="danger" center>
          {t('settings.account.error')}
        </Text>
      ) : null}

      <ActionSheet
        visible={confirming === 'leave'}
        title={t('settings.account.leaveConfirm', { name: household?.name ?? '' })}
        onClose={() => setConfirming(null)}
        options={[
          {
            label: t('settings.account.leave'),
            destructive: true,
            onPress: () => household && run(() => leaveHousehold(household.id, uid)),
          },
          { label: t('common.cancel'), onPress: () => undefined },
        ]}
      />
      <ActionSheet
        visible={confirming === 'delete'}
        title={t('settings.account.deleteConfirm')}
        onClose={() => setConfirming(null)}
        options={[
          {
            label: t('settings.account.delete'),
            destructive: true,
            onPress: () => run(() => deleteAccount({ uid, householdId: household?.id ?? null })),
          },
          { label: t('common.cancel'), onPress: () => undefined },
        ]}
      />
    </Card>
  );
}
