import { Stack } from 'expo-router';

import { colors } from '@/ui';

export default function MealLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
