import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';

interface Props {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'secondary', style }: Props) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  primary: { backgroundColor: Colors.primary + '20' },
  secondary: { backgroundColor: Colors.surfaceSecondary },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
  success: { backgroundColor: Colors.success + '20' },
  warning: { backgroundColor: Colors.warning + '20' },
  error: { backgroundColor: Colors.error + '20' },
  text: { fontSize: 12, fontWeight: '600' },
  text_primary: { color: Colors.primary },
  text_secondary: { color: Colors.textSecondary },
  text_outline: { color: Colors.text },
  text_success: { color: Colors.success },
  text_warning: { color: Colors.warning },
  text_error: { color: Colors.error },
});
