import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { createZone, deleteZone, updateZone } from '@/data/tasks';
import { ZONE_ICONS } from '@/domain/tasks/template';
import { activeTasks } from '@/domain/tasks/today';
import type { Zone } from '@/domain/tasks/types';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { useTasks } from '@/state/tasks';
import {
  Button,
  Card,
  ListRow,
  OptionPicker,
  Screen,
  ScreenHeader,
  Text,
  TextField,
  spacing,
} from '@/ui';

const NAME_MAX = 30;

export default function ZonesScreen() {
  const { t } = useTranslation();
  const household = useSession((state) => state.household);
  const zones = useTasks((state) => state.zones);
  const tasks = activeTasks(useTasks((state) => state.tasks));

  /** Zona que se está editando; `null` es "nueva zona". */
  const [editing, setEditing] = useState<Zone | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ZONE_ICONS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!household) return null;

  const startEditing = (zone: Zone | null) => {
    setEditing(zone);
    setName(zone?.name ?? '');
    setIcon(zone?.icon ?? ZONE_ICONS[0]);
    setError(null);
  };

  const save = () => {
    const cleaned = name.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
    if (!cleaned) {
      setError(t('settings.zones.nameRequired'));
      return;
    }
    if (editing) {
      updateZone(household.id, editing.id, { name: cleaned, icon }).catch(
        saveFailed('No se ha podido guardar la zona'),
      );
    } else {
      const order = zones.reduce((max, zone) => Math.max(max, zone.order + 1), 0);
      createZone(household.id, { name: cleaned, icon, order }).catch(
        saveFailed('No se ha podido crear la zona'),
      );
    }
    startEditing(null);
  };

  /** Intercambia dos zonas de sitio. Se guarda la posición de todas para que el orden sea estable. */
  const move = (from: number, to: number) => {
    const reordered = [...zones];
    const [moved] = reordered.splice(from, 1);
    if (!moved) return;
    reordered.splice(to, 0, moved);
    reordered.forEach((zone, position) => {
      if (zone.order !== position) {
        updateZone(household.id, zone.id, { order: position }).catch(
          saveFailed('No se ha podido reordenar la zona'),
        );
      }
    });
  };

  const remove = () => {
    if (!editing) return;
    if (tasks.some((task) => task.zoneId === editing.id)) {
      setError(t('settings.zones.inUse'));
      return;
    }
    deleteZone(household.id, editing.id).catch(saveFailed('No se ha podido eliminar la zona'));
    startEditing(null);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.zones.title')} />

      <Card>
        {zones.length === 0 ? <Text color="inkSoft">{t('settings.zones.empty')}</Text> : null}
        {zones.map((zone, index) => (
          <ListRow
            key={zone.id}
            icon={zone.icon}
            title={zone.name}
            trailing={
              <View style={styles.order}>
                {(['up', 'down'] as const).map((direction) => {
                  const target = index + (direction === 'up' ? -1 : 1);
                  const disabled = target < 0 || target >= zones.length;
                  return (
                    <Pressable
                      key={direction}
                      accessibilityRole="button"
                      accessibilityLabel={t(`settings.zones.move.${direction}`, { name: zone.name })}
                      disabled={disabled}
                      hitSlop={spacing.xs}
                      onPress={() => move(index, target)}
                      style={[styles.arrow, disabled && styles.arrowDisabled]}>
                      <Text color="inkSoft">{direction === 'up' ? '▲' : '▼'}</Text>
                    </Pressable>
                  );
                })}
                {/* Editar es un botón más de la fila, no la fila entera: así no hay botones anidados. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.zones.editZone', { name: zone.name })}
                  hitSlop={spacing.xs}
                  onPress={() => startEditing(zone)}
                  style={styles.arrow}>
                  <Text color={editing?.id === zone.id ? 'peachDeep' : 'inkSoft'}>✎</Text>
                </Pressable>
              </View>
            }
          />
        ))}
      </Card>

      <Card tone="sage">
        <Text variant="heading">
          {editing ? t('settings.zones.editing') : t('settings.zones.new')}
        </Text>
        <TextField
          label={t('settings.zones.nameLabel')}
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX}
          autoCapitalize="sentences"
          error={error}
        />
        <OptionPicker
          kind="emoji"
          label={t('settings.zones.iconLabel')}
          options={ZONE_ICONS}
          value={icon}
          onChange={setIcon}
        />
        <Button label={editing ? t('common.save') : t('settings.zones.add')} onPress={save} />
        {editing ? (
          <>
            <Button variant="ghost" label={t('settings.zones.delete')} onPress={remove} />
            <Button
              variant="ghost"
              label={t('common.cancel')}
              onPress={() => startEditing(null)}
            />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  order: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.25,
  },
});
