import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { addShoppingStore, removeShoppingStore } from '@/data/shopping';
import { cleanName } from '@/domain/household';
import { STORE_NAME_MAX } from '@/domain/shopping/stores';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { useShopping } from '@/state/shopping';
import { Button, Card, ListRow, Screen, ScreenHeader, TextField } from '@/ui';

export default function ShoppingStoresScreen() {
  const { t } = useTranslation();
  const householdId = useSession((state) => state.household?.id);
  const stores = useShopping((state) => state.stores);
  const [draft, setDraft] = useState('');
  const name = cleanName(draft, STORE_NAME_MAX);
  const duplicate = stores.some((store) => store.name.localeCompare(name, undefined, { sensitivity: 'base' }) === 0);

  const add = () => {
    if (!householdId || !name || duplicate) return;
    addShoppingStore(householdId, name).catch(saveFailed('Añadir establecimiento'));
    setDraft('');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('shopping.stores.title')} />
      <Card>
        <TextField
          label={t('shopping.stores.name')}
          placeholder={t('shopping.stores.example')}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          maxLength={STORE_NAME_MAX}
          error={duplicate ? t('shopping.stores.duplicate') : null}
        />
        <Button label={t('shopping.stores.add')} disabled={!name || duplicate} onPress={add} />
      </Card>
      {stores.length > 0 ? (
        <Card>
          {stores.map((store) => (
            <ListRow
              key={store.id}
              title={store.name}
              trailing={
                <Button
                  variant="secondary"
                  label={t('shopping.stores.remove')}
                  accessibilityLabel={t('shopping.stores.removeNamed', { name: store.name })}
                  onPress={() => {
                    if (householdId) removeShoppingStore(householdId, store.id).catch(saveFailed('Quitar establecimiento'));
                  }}
                />
              }
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
