import { Stack } from 'expo-router';

import { colors } from '@/ui';

export default function NoteLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
