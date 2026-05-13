import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { api } from '@/lib/api';

export default function ForgotPassword() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim(), role: role || 'athlete' });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Button title="Back" variant="ghost" size="sm" onPress={() => router.back()} />
          </View>

          <View style={styles.content}>
            {sent ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="mail-outline" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Check Your Email</Text>
                <Text style={styles.successMsg}>
                  If an account exists for {email}, a password reset link has been sent. Check your inbox and spam folder.
                </Text>
                <Button
                  title="Back to Sign In"
                  onPress={() => router.replace(`/(auth)/signin?role=${role || 'athlete'}`)}
                  style={styles.btn}
                />
              </View>
            ) : (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a reset link.
                </Text>

                <View style={styles.form}>
                  {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />

                  <Button title="Send Reset Link" onPress={handleSubmit} loading={loading} style={styles.btn} />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 20 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: -8 },
  form: { gap: 16 },
  btn: { marginTop: 8, width: '100%' },
  errorBox: { backgroundColor: Colors.error + '15', borderRadius: 8, padding: 12 },
  errorText: { fontSize: 14, color: Colors.error },
  successContainer: { flex: 1, alignItems: 'center', paddingTop: 40, gap: 16 },
  successIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  successMsg: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
