import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors } from './theme';

type AvatarProps = {
  /** Emoji elegido por el miembro. Si falta, se usa la inicial del nombre o un gato. */
  emoji?: string | null;
  name?: string | null;
  /** Color del miembro en el hogar. */
  color?: string | null;
  size?: number;
};

export function Avatar({ emoji, name, color, size = 44 }: AvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || colors.peachSoft,
        },
      ]}>
      {/* Los colores de los miembros son claros en los dos temas: el texto, siempre oscuro. */}
      <Text
        variant="bodyStrong"
        color="onPeach"
        style={{ fontSize: size * 0.46, lineHeight: size * 0.6 }}>
        {emoji || initial || '🐱'}
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
