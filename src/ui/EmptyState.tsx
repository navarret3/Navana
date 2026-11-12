import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, spacing } from './theme';

type EmptyStateProps = {
  /** Emoji o ilustración pequeña. */
  icon: string;
  title: string;
  description?: string;
  /** Acción opcional (normalmente un `Button`). */
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.bubble}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text variant="heading" center>
        {title}
      </Text>
      {description ? (
        <Text color="inkSoft" center>
          {description}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  bubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.peachSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 44,
    lineHeight: 56,
  },
  action: {
    marginTop: spacing.lg,
  },
});
