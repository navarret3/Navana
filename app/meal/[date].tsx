import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { setMeal } from '@/data/extras';
import { dateKeyToLocalDate } from '@/domain/dates';
import { MEAL_TITLE_MAX, mealOf, parseIngredients, type MealSlot } from '@/domain/menu';
import { useExtras } from '@/state/extras';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { Button, Screen, ScreenHeader, Text, TextField, useGoBack } from '@/ui';

/** Editar la comida o la cena de un día del menú semanal. */
export default function MealScreen() {
  const params = useLocalSearchParams<{ date: string; slot?: string }>();
  const { t, i18n } = useTranslation();
  const goBack = useGoBack();
  const household = useSession((state) => state.household);
  const date = params.date;
  const slot: MealSlot = params.slot === 'dinner' ? 'dinner' : 'lunch';
  const existing = mealOf(
    useExtras((state) => state.menu.find((day) => day.date === date)),
    slot,
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [ingredients, setIngredients] = useState(existing?.ingredients.join(', ') ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!household || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const dayText = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateKeyToLocalDate(date));

  const save = () => {
    const cleanTitle = title.replace(/\s+/g, ' ').trim().slice(0, MEAL_TITLE_MAX);
    const list = parseIngredients(ingredients);
    if (!cleanTitle && list.length === 0) {
      setError(t('menu.form.empty'));
      return;
    }
    setMeal(household.id, date, slot, { title: cleanTitle, ingredients: list }).catch(
      saveFailed('No se ha podido guardar el menú'),
    );
    goBack();
  };

  const clear = () => {
    setMeal(household.id, date, slot, null).catch(saveFailed('No se ha podido vaciar el menú'));
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t(`menu.slots.${slot}`)} />
      <Text color="inkSoft">{dayText.charAt(0).toUpperCase() + dayText.slice(1)}</Text>
      <TextField
        label={t('menu.form.titleLabel')}
        placeholder={t('menu.form.titlePlaceholder')}
        value={title}
        onChangeText={setTitle}
        maxLength={MEAL_TITLE_MAX}
        autoCapitalize="sentences"
        error={error}
      />
      <TextField
        label={t('menu.form.ingredientsLabel')}
        placeholder={t('menu.form.ingredientsPlaceholder')}
        value={ingredients}
        onChangeText={setIngredients}
        multiline
        tall
        autoCapitalize="none"
        hint={t('menu.form.ingredientsHint')}
      />
      <Button label={t('common.save')} onPress={save} />
      {existing ? <Button variant="ghost" label={t('menu.form.clear')} onPress={clear} /> : null}
    </Screen>
  );
}
