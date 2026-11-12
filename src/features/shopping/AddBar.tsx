import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SHOPPING_CATEGORIES } from '@/domain/shopping/categories';
import { ITEM_NAME_MAX } from '@/domain/shopping/normalize';
import { suggest, type Suggestion } from '@/domain/shopping/suggest';
import { useShopping } from '@/state/shopping';
import { Text, colors, minTouchSize, radii, shadows, spacing, typography } from '@/ui';

import { useShoppingActions, type AddResult } from './useShoppingActions';

const MESSAGE_MS = 3000;

const iconOf = (categoryId: string) =>
  SHOPPING_CATEGORIES.find((category) => category.id === categoryId)?.icon ?? '🛒';

/**
 * Barra para añadir a la lista, siempre a mano. Mientras se escribe propone productos
 * (primero lo que ya se compra en casa) y al enviar deja el teclado abierto para
 * seguir apuntando.
 */
export function AddBar() {
  const { t } = useTranslation();
  const items = useShopping((state) => state.items);
  const catalog = useShopping((state) => state.catalog);
  const { add } = useShoppingActions();
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const suggestions = suggest(text, { catalog, items });

  const report = ({ outcome, name }: AddResult) => {
    if (outcome === 'empty') return;
    setText('');
    setMessage(
      outcome === 'alreadyThere'
        ? t('shopping.alreadyThere', { name })
        : outcome === 'restored'
          ? t('shopping.restored', { name })
          : null,
    );
  };

  const submit = () => report(add(text));
  const pick = (suggestion: Suggestion) => report(add(suggestion.name, suggestion.categoryId));

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <TextInput
          accessibilityLabel={t('shopping.addLabel')}
          placeholder={t('shopping.addPlaceholder')}
          placeholderTextColor={colors.inkMuted}
          selectionColor={colors.peachDeep}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          // Deja el teclado abierto para apuntar varias cosas seguidas.
          submitBehavior="submit"
          returnKeyType="done"
          autoCapitalize="sentences"
          autoCorrect={false}
          maxLength={ITEM_NAME_MAX}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('shopping.add')}
          disabled={!text.trim()}
          onPress={submit}
          style={({ pressed }) => [
            styles.addButton,
            !text.trim() && styles.addButtonDisabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.addIcon}>＋</Text>
        </Pressable>
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.key}
              accessibilityRole="button"
              accessibilityLabel={suggestion.name}
              onPress={() => pick(suggestion)}
              style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}>
              <Text style={styles.suggestionIcon}>{iconOf(suggestion.categoryId)}</Text>
              <Text>{suggestion.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {message ? (
        <Text variant="caption" color="inkSoft" accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: minTouchSize + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  addButton: {
    width: minTouchSize + 4,
    height: minTouchSize + 4,
    borderRadius: (minTouchSize + 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.peach,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addIcon: {
    fontSize: 26,
    lineHeight: 32,
    color: colors.onPeach,
  },
  pressed: {
    opacity: 0.75,
  },
  suggestions: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  suggestion: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  suggestionIcon: {
    fontSize: 18,
    lineHeight: 24,
    width: 26,
    textAlign: 'center',
  },
});
