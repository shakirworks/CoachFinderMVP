import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { getAbsoluteUrl } from '@/lib/api';

interface Props {
  name?: string;
  imageUri?: string | null;
  size?: number;
  style?: ViewStyle;
}

export default function Avatar({ name, imageUri, size = 48, style }: Props) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {imageUri ? (
        <Image source={{ uri: getAbsoluteUrl(imageUri) }} style={[styles.image, containerStyle]} />
      ) : (
        <View style={[styles.fallback, containerStyle]}>
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    color: Colors.primary,
  },
});
