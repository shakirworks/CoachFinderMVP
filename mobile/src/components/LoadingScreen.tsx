import React from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '@/theme/colors';

interface Props {
  message?: string;
}

export default function LoadingScreen({ message }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={Colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 20,
  },
  logo: {
    width: 180,
    height: 52,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
