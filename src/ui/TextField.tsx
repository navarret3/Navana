import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { colors, minTouchSize, radii, spacing, typography } from './theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Mensaje de error; pinta el borde en rojo y sustituye a la ayuda. */
  error?: string | null;
  hint?: string;
  /** Texto grande y espaciado, para códigos. */
  code?: boolean;
  /** Caja alta para textos largos (junto con `multiline`). */
  tall?: boolean;
};

export function TextField({ label, error, hint, code, tall, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const note = error || hint;

  return (
    <View style={styles.root}>
      <Text variant="label" color="inkSoft">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkMuted}
        selectionColor={colors.peachDeep}
        {...rest}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        style={[
          styles.input,
          code && styles.code,
          rest.multiline && styles.multiline,
          tall && styles.tall,
          focused && styles.focused,
          !!error && styles.invalid,
        ]}
      />
      {note ? (
        <Text variant="caption" color={error ? 'danger' : 'inkSoft'}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  input: {
    ...typography.body,
    minHeight: minTouchSize + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  code: {
    ...typography.title,
    textAlign: 'center',
    letterSpacing: 6,
  },
  multiline: {
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  tall: {
    minHeight: 160,
  },
  focused: {
    borderColor: colors.peach,
  },
  invalid: {
    borderColor: colors.danger,
  },
});
