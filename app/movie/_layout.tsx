import { Stack } from 'expo-router';

import { colors } from '@/ui';

export default function MovieLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
