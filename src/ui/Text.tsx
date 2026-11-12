import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type ColorName, type TextVariant } from './theme';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: ColorName;
  center?: boolean;
};

export function Text({ variant = 'body', color = 'ink', center, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[typography[variant], { color: colors[color] }, center && { textAlign: 'center' }, style]}
    />
  );
}
