import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';
import { colors, maxContentWidth, minTouchSize, radii, spacing } from './theme';

type ActionSheetProps = {
  visible: boolean;
  title: string;
  options: readonly { label: string; onPress: () => void; destructive?: boolean }[];
  onClose: () => void;
};

/** Menú de opciones que sube desde abajo. Tocar fuera lo cierra. */
export function ActionSheet({ visible, title, options, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityLabel={title} style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Text variant="heading" center style={styles.title}>
            {title}
          </Text>
          {/* Con muchas opciones (las secciones del súper) la lista se desplaza. */}
          <ScrollView style={styles.options} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <Text variant="bodyStrong" color={option.destructive ? 'danger' : 'ink'}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 52, 43, 0.35)',
  },
  sheet: {
    width: '100%',
    maxWidth: maxContentWidth,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  options: {
    maxHeight: 420,
  },
  option: {
    minHeight: minTouchSize + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
});
