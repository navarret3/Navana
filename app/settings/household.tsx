import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { updateHousehold } from '@/data/households';
import { HOUSEHOLD_ICONS, HOUSEHOLD_NAME_MAX, cleanName } from '@/domain/household';
import { useSession } from '@/state/session';
import { Button, OptionPicker, Screen, ScreenHeader, TextField, useGoBack } from '@/ui';

export default function HouseholdScreen() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);

  const [name, setName] = useState(household?.name ?? '');
  const [icon, setIcon] = useState(household?.icon ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!household) return null;

  const save = async () => {
    const cleaned = cleanName(name, HOUSEHOLD_NAME_MAX);
    if (!cleaned) {
      setError(t('settings.household.nameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateHousehold(household.id, { name: cleaned, icon });
      goBack();
    } catch (cause) {
      console.warn('No se ha podido guardar el hogar', cause);
      setError(t('common.genericError'));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.household.title')} />

      <TextField
        label={t('settings.household.nameLabel')}
        value={name}
        onChangeText={setName}
        maxLength={HOUSEHOLD_NAME_MAX}
        autoCapitalize="sentences"
        error={error}
      />
      <OptionPicker
        kind="emoji"
        label={t('settings.household.iconLabel')}
        options={HOUSEHOLD_ICONS}
        value={icon}
        onChange={setIcon}
      />

      <Button label={t('common.save')} loading={busy} onPress={save} />
    </Screen>
  );
}
