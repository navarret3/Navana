import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';

import { backend } from '@/data/fb';
import { checkBackend, type BackendStatus } from '@/data/health';
import { setHouseholdModuleEnabled } from '@/data/households';
import { AccountActions } from '@/features/household/AccountActions';
import { isModuleEnabled, modules } from '@/modules/registry';
import { saveFailed } from '@/state/notices';
import { useCurrentMember, useSession } from '@/state/session';
import { runningUpdateDate } from '@/updates/appUpdate';
import { Avatar, Button, Card, ListRow, Screen, ScreenHeader, Text, colors } from '@/ui';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useSession((state) => state.user);
  const household = useSession((state) => state.household);
  const members = useSession((state) => state.members);
  const me = useCurrentMember();

  if (!household) return null;

  // Qué versión está en marcha: sirve para saber si ya ha llegado la última actualización.
  const version = Constants.expoConfig?.version ?? '';
  const updateDate = runningUpdateDate();
  const updated = updateDate
    ? new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(updateDate)
    : null;

  // Uno mismo primero y el resto por nombre.
  const sortedMembers = [...members].sort((a, b) => {
    if (a.uid === user?.uid) return -1;
    if (b.uid === user?.uid) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.title')} />

      <Card>
        <Text variant="heading">{t('settings.profile.title')}</Text>
        <ListRow
          title={me?.name ?? ''}
          subtitle={t('settings.profile.edit')}
          leading={<Avatar emoji={me?.avatar} name={me?.name} color={me?.color} />}
          trailing={<Text color="inkMuted">›</Text>}
          onPress={() => router.push('/settings/profile')}
        />
      </Card>

      <Card>
        <Text variant="heading">{t('settings.household.title')}</Text>
        <ListRow
          icon={household.icon}
          title={household.name}
          subtitle={t('settings.household.edit')}
          trailing={<Text color="inkMuted">›</Text>}
          onPress={() => router.push('/settings/household')}
        />
        <Text variant="label" color="inkSoft">
          {t('settings.household.members')}
        </Text>
        {sortedMembers.map((member) => (
          <ListRow
            key={member.uid}
            title={member.name}
            subtitle={member.uid === user?.uid ? t('settings.household.you') : undefined}
            leading={
              <Avatar emoji={member.avatar} name={member.name} color={member.color} size={36} />
            }
          />
        ))}
        <Button
          variant="secondary"
          label={t('settings.household.invite')}
          onPress={() => router.push('/settings/invite')}
        />
      </Card>

      <Card>
        <Text variant="heading">{t('settings.zones.title')}</Text>
        <ListRow
          icon="🗂️"
          title={t('settings.zones.title')}
          subtitle={t('settings.zones.edit')}
          trailing={<Text color="inkMuted">›</Text>}
          onPress={() => router.push('/settings/zones')}
        />
      </Card>

      <Card>
        <Text variant="heading">{t('settings.notifications.title')}</Text>
        <ListRow
          icon="🔔"
          title={t('settings.notifications.title')}
          subtitle={t('settings.notifications.edit')}
          trailing={<Text color="inkMuted">›</Text>}
          onPress={() => router.push('/settings/notifications')}
        />
      </Card>

      <Card>
        <Text variant="heading">{t('settings.modules.title')}</Text>
        <Text variant="caption" color="inkSoft">
          {t('settings.modules.description')}
        </Text>
        {modules.map((module) => (
          <ListRow
            key={module.id}
            icon={module.icon}
            title={t(`${module.id}.title`)}
            subtitle={t(`${module.id}.description`)}
            trailing={
              <Switch
                accessibilityLabel={t(`${module.id}.title`)}
                value={isModuleEnabled(module, household.enabledModules)}
                onValueChange={(value) => {
                  setHouseholdModuleEnabled(household.id, module.id, value).catch(saveFailed('No se ha podido cambiar el módulo'));
                }}
                trackColor={{ false: colors.border, true: colors.sage }}
                thumbColor={colors.white}
              />
            }
          />
        ))}
      </Card>

      {__DEV__ ? <EnvironmentCard /> : null}

      <AccountActions />

      <Text variant="caption" color="inkMuted" center>
        {updated
          ? t('settings.version.updated', { version, date: updated })
          : t('settings.version.installed', { version })}
      </Text>
    </Screen>
  );
}

/** Solo en desarrollo: a qué backend habla la app y si responde. */
function EnvironmentCard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'checking' | BackendStatus>('idle');

  const check = async () => {
    setStatus('checking');
    setStatus(await checkBackend());
  };

  return (
    <Card tone="sage">
      <Text variant="heading">{t('settings.environment.title')}</Text>
      <ListRow
        icon={backend === 'emulator' ? '🧪' : '🔥'}
        title={t(`settings.environment.backend.${backend}`)}
        subtitle={t(`settings.environment.status.${status}`)}
      />
      <Button
        variant="secondary"
        label={t('settings.environment.check')}
        loading={status === 'checking'}
        onPress={check}
      />
    </Card>
  );
}
