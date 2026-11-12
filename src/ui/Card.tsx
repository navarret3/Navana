import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii, shadows, spacing } from './theme';

type CardProps = ViewProps & {
  tone?: 'surface' | 'peach' | 'sage';
};

const toneBackground = {
  surface: colors.surface,
  peach: colors.peachSoft,
  sage: colors.sageSoft,
} as const;

export function Card({ tone = 'surface', style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: toneBackground[tone] },
        tone === 'surface' && styles.outlined,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
});
