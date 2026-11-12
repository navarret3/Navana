import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Switch } from 'react-native';

import { updateNotifyPrefs } from '@/data/households';
import type { NotifyPrefs } from '@/domain/household';
import { getPermissionState, type PermissionState } from '@/notifications/device';
import { registerThisDevice } from '@/notifications/useNotificationSync';
import { saveFailed } from '@/state/notices';
import { useCurrentMember, useSession } from '@/state/session';
import { Button, Card, ChipGroup, ListRow, Screen, ScreenHeader, Text, colors } from '@/ui';

const SUMMARY_HOURS = [7, 8, 9, 10, 12, 20] as const;

type Toggle = Exclude<keyof NotifyPrefs, 'summaryHour'>;

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const household = useSession((state) => state.household);
  const me = useCurrentMember();
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
    </Screen>
  );
}
