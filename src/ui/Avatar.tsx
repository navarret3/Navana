import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors } from './theme';

type AvatarProps = {
  /** Nombre del miembro; se muestra su inicial. Sin nombre, un gato. */
  name?: string | null;
  /** Color del miembro en el hogar. */
  color?: string;
  size?: number;
};

export function Avatar({ name, color = colors.peachSoft, size = 44 }: AvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}>
      <Text variant="bodyStrong" style={{ fontSize: size * 0.42, lineHeight: size * 0.56 }}>
        {initial || '🐱'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
