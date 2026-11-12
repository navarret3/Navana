import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Text, spacing } from '@/ui';

type TodaySummaryCardProps = {
  icon: string;
  title: string;
  tone?: 'surface' | 'peach' | 'sage';
  children: ReactNode;
};

/** Marco común de las tarjetas que cada módulo aporta a "Hoy". */
export function TodaySummaryCard({ icon, title, tone, children }: TodaySummaryCardProps) {
  return (
    <Card tone={tone}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text variant="heading">{title}</Text>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
    lineHeight: 26,
  },
});
