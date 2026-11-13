import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Switch } from 'react-native';

import { updateNotifyPrefs } from '@/data/households';
import type { NotifyPrefs } from '@/domain/household';
import {
  getPermissionState,
  getPushToken,
  showTestNotification,
  type PermissionState,
} from '@/notifications/device';
import { getExpoPushReceipt, sendExpoPush, type PushResult } from '@/notifications/expoPush';
import { registerThisDevice } from '@/notifications/useNotificationSync';
import { saveFailed } from '@/state/notices';
import { useCurrentMember, useSession } from '@/state/session';
import { Button, Card, ChipGroup, ListRow, Screen, ScreenHeader, Text, colors } from '@/ui';

const SUMMARY_HOURS = [7, 8, 9, 10, 12, 20] as const;

/** Segundos que tarda en saltar el aviso de prueba: da tiempo a salir de la app. */
const TEST_DELAY_SECONDS = 5;
/** Lo que se espera antes de preguntar a Expo si el aviso de prueba se entregó. */
const RECEIPT_WAIT_MS = 4000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

type Toggle = Exclude<keyof NotifyPrefs, 'summaryHour'>;

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const me = useCurrentMember();
  const [testing, setTesting] = useState(false);
  /** Resultado de la última prueba, ya traducido. */
  const [testResult, setTestResult] = useState<{ text: string; ok: boolean } | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [failed, setFailed] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPermissionState().then((state) => {
      if (!cancelled) setPermission(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!household || !me) return null;

  // Pide el permiso y, si se concede, deja apuntado el token de push de este móvil.
  const enable = async () => {
    setEnabling(true);
    setFailed(false);
    try {
      await registerThisDevice({
        householdId: household.id,
        uid: me.uid,
        knownTokens: me.pushTokens,
      });
    } catch (error) {
      console.warn('No se han podido activar los avisos', error);
      setErrorDetail(error instanceof Error ? error.message : String(error));
      setFailed(true);
    }
    setPermission(await getPermissionState());
    setEnabling(false);
  };

  // Prueba 1: un aviso programado en este móvil. No pasa por internet: comprueba el permiso
  // y que Android los muestra.
  const testLocal = async () => {
    try {
      await showTestNotification(
        t('settings.notifications.test.localTitle'),
        t('settings.notifications.test.localBody'),
        TEST_DELAY_SECONDS,
      );
      setTestResult({ text: t('settings.notifications.test.localSent'), ok: true });
    } catch (error) {
      setTestResult({
        text: t('settings.notifications.test.failed', { reason: reasonOf(error) }),
        ok: false,
      });
    }
  };

  const explain = (result: PushResult) =>
    result.error === 'InvalidCredentials'
      ? t('settings.notifications.test.invalidCredentials')
      : result.error === 'DeviceNotRegistered'
        ? t('settings.notifications.test.deviceNotRegistered')
        : t('settings.notifications.test.pushFailed', {
            reason: [result.error, result.message].filter(Boolean).join(': ') || '?',
          });

  // Prueba 2: un aviso a este mismo móvil por el camino completo (Expo → Google → móvil),
  // que es el que siguen los avisos de la pareja. Dice en qué punto se queda.
  const testPush = async () => {
    setTesting(true);
    setTestResult({ text: t('settings.notifications.test.pushSending'), ok: true });
    try {
      const token = await getPushToken();
      if (!token) {
        setTestResult({ text: t('settings.notifications.test.noToken'), ok: false });
        return;
      }
      const [ticket] = await sendExpoPush([token], {
        title: t('settings.notifications.test.pushTitle'),
        body: t('settings.notifications.test.pushBody'),
      });
      if (!ticket || ticket.status === 'error' || !ticket.id) {
        setTestResult({ text: explain(ticket ?? { status: 'error' }), ok: false });
        return;
      }
      await wait(RECEIPT_WAIT_MS);
      const receipt = await getExpoPushReceipt(ticket.id);
      if (!receipt) {
        setTestResult({ text: t('settings.notifications.test.pushPending'), ok: true });
      } else if (receipt.status === 'error') {
        setTestResult({ text: explain(receipt), ok: false });
      } else {
        setTestResult({ text: t('settings.notifications.test.pushOk'), ok: true });
      }
    } catch (error) {
      setTestResult({
        text: t('settings.notifications.test.failed', { reason: reasonOf(error) }),
        ok: false,
      });
    } finally {
      setTesting(false);
    }
  };

  const others = members.filter((member) => member.uid !== me.uid);

  const change = (changes: Partial<NotifyPrefs>) => {
    updateNotifyPrefs(household.id, me.uid, changes).catch(saveFailed('No se han podido guardar los avisos'));
  };

  const toggleRow = (key: Toggle, icon: string) => (
    <ListRow
      key={key}
      icon={icon}
      title={t(`settings.notifications.${key}`)}
      subtitle={t(`settings.notifications.${key}Hint`)}
      trailing={
        <Switch
          accessibilityLabel={t(`settings.notifications.${key}`)}
          value={me.notify[key]}
          onValueChange={(value) => change({ [key]: value })}
          trackColor={{ false: colors.border, true: colors.sage }}
          thumbColor={colors.white}
        />
      }
    />
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.notifications.title')} />

      {permission === 'unsupported' ? (
        <Card tone="peach">
          <Text color="inkSoft">{t('settings.notifications.unsupported')}</Text>
        </Card>
      ) : null}
      {permission === 'granted' ? (
        <Card tone="sage">
          <Text>🔔 {t('settings.notifications.granted')}</Text>
          <Text variant="caption" color="inkSoft">
            {me.pushTokens.length > 0
              ? t('settings.notifications.pushReady')
              : t('settings.notifications.pushMissing')}
          </Text>
        </Card>
      ) : null}
      {permission === 'undetermined' ? (
        <Card tone="peach">
          <Text color="inkSoft">{t('settings.notifications.askable')}</Text>
          <Button label={t('settings.notifications.enable')} loading={enabling} onPress={enable} />
        </Card>
      ) : null}
      {permission === 'denied' ? (
        <Card tone="peach">
          <Text color="inkSoft">{t('settings.notifications.denied')}</Text>
          <Button
            variant="secondary"
            label={t('settings.notifications.openSettings')}
            onPress={() => Linking.openSettings()}
          />
        </Card>
      ) : null}
      {failed ? (
        <Text variant="caption" color="danger">
          {t('settings.notifications.error')}
          {__DEV__ && errorDetail ? `
${errorDetail}` : ''}
        </Text>
      ) : null}

      <Card>
        {toggleRow('dailySummary', '🌅')}
        {me.notify.dailySummary ? (
          <ChipGroup<number>
            label={t('settings.notifications.summaryHour')}
            options={SUMMARY_HOURS.map((hour) => ({ value: hour, label: `${hour}:00` }))}
            value={me.notify.summaryHour}
            onChange={(summaryHour) => change({ summaryHour })}
          />
        ) : null}
        {toggleRow('overdue', '⏰')}
      </Card>

      <Card>
        {toggleRow('partnerCompleted', '✅')}
        {toggleRow('nudges', '🐾')}
      </Card>

      {permission === 'unsupported' ? null : (
        <Card>
          <Text variant="heading">🧪 {t('settings.notifications.test.title')}</Text>
          <Text variant="caption" color="inkSoft">
            {t('settings.notifications.test.thisPhone')}:{' '}
            {me.pushTokens.length > 0
              ? t('settings.notifications.test.registered')
              : t('settings.notifications.test.notRegistered')}
          </Text>
          {others.map((member) => (
            <Text key={member.uid} variant="caption" color="inkSoft">
              {member.pushTokens.length === 0
                ? t('settings.notifications.test.partnerMissing', { name: member.name })
                : member.notify.partnerCompleted
                  ? t('settings.notifications.test.partnerRegistered', {
                      name: member.name,
                      count: member.pushTokens.length,
                    })
                  : t('settings.notifications.test.partnerMuted', { name: member.name })}
            </Text>
          ))}
          <Button
            variant="secondary"
            label={t('settings.notifications.test.local')}
            disabled={permission !== 'granted'}
            onPress={testLocal}
          />
          <Button
            variant="secondary"
            label={t('settings.notifications.test.push')}
            disabled={permission !== 'granted'}
            loading={testing}
            onPress={testPush}
          />
          {testResult ? (
            <Text
              variant="caption"
              color={testResult.ok ? 'sageDeep' : 'danger'}
              accessibilityLiveRegion="polite">
              {testResult.text}
            </Text>
          ) : null}
        </Card>
      )}
    </Screen>
  );
}
