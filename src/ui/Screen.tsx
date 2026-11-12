import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, maxContentWidth, spacing } from './theme';

type ScreenProps = {
  children: ReactNode;
  /** Con `false` el contenido no hace scroll (pantallas con listas propias). */
  scroll?: boolean;
  /** Bordes con área segura. Las pestañas no necesitan el inferior: lo cubre la barra. */
  edges?: readonly Edge[];
  /** Contenido fijo sobre la pantalla, que no se desplaza con el resto (un botón flotante). */
  floating?: ReactNode;
};

export function Screen({ children, scroll = true, edges = ['top'], floating }: ScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {/*
        En Android la app va de borde a borde y la ventana no se encoge al salir el teclado:
        sin esto, el teclado tapa los últimos campos de un formulario y no se puede llegar a
        ellos. Con `padding` la pantalla termina donde empieza el teclado y el scroll alcanza
        hasta el final.
      */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.content}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill]}>{children}</View>
        )}
        {floating}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  fill: {
    flex: 1,
  },
});
