import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { posterUrl, type PosterSize } from '@/domain/movies';
import { Text, colors, radii } from '@/ui';

type PosterProps = {
  path: string | null;
  size: PosterSize;
  width: number;
  /** Título para leerlo en voz alta y para el hueco cuando no hay póster. */
  title: string;
};

/** Póster de una película, en proporción 2:3. Sin imagen (o si no carga), un hueco con 🎬. */
export function Poster({ path, size, width, title }: PosterProps) {
  const [failed, setFailed] = useState(false);
  const uri = failed ? null : posterUrl(path, size);
  const box = { width, height: Math.round(width * 1.5) };

  return uri ? (
    <Image
      source={{ uri }}
      accessibilityLabel={title}
      resizeMode="cover"
      onError={() => setFailed(true)}
      style={[styles.poster, box]}
    />
  ) : (
    <View accessible accessibilityLabel={title} style={[styles.poster, styles.empty, box]}>
      <Text style={{ fontSize: width * 0.3, lineHeight: width * 0.42 }}>🎬</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSunken,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
