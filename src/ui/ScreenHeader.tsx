import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, minTouchSize, spacing } from './theme';

type ScreenHeaderProps = {
  title: string;
};

/**
 * Vuelve a la pantalla anterior. Si no hay ninguna (la pantalla se abrió desde un
 * enlace o recargando en la web), va al inicio en vez de quedarse sin hacer nada.
 */
export function useGoBack(): () => void {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
}

/** Cabecera con botón de volver para las pantallas que se abren sobre las pestañas. */
export function ScreenHeader({ title }: ScreenHeaderProps) {
  const { t } = useTranslation();
  const goBack = useGoBack();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={goBack}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
        <Text variant="title">‹</Text>
      </Pressable>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
    </View>
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
