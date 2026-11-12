import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { backend } from '@/data/fb';
import { checkBackend, type BackendStatus } from '@/data/health';
import { isModuleEnabled, modules } from '@/modules/registry';
import { useSession } from '@/state/session';
import { Button, Card, ListRow, Screen, Text, colors, minTouchSize, spacing } from '@/ui';

// Fase 1: hogar, miembros, zonas y avisos se añaden como secciones de esta pantalla.
export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const enabledModules = useSession((state) => state.enabledModules);
  const setModuleEnabled = useSession((state) => state.setModuleEnabled);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={goBack}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
          <Text variant="title">‹</Text>
        </Pressable>
        <Text variant="title">{t('settings.title')}</Text>
      </View>

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
                value={isModuleEnabled(module, enabledModules)}
                onValueChange={(value) => setModuleEnabled(module.id, value)}
                trackColor={{ false: colors.border, true: colors.sage }}
                thumbColor={colors.surface}
              />
            }
          />
        ))}
      </Card>

      {__DEV__ ? <EnvironmentCard /> : null}
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.md,
  },
  backPressed: {
    backgroundColor: colors.surfaceSunken,
  },
});
