import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Athlete, Coach } from '@/lib/types';

export default function SignIn() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'athlete' | 'coach' }>();
  const { setUserLocally } = useAuth();

  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const endpoint = role === 'athlete' ? '/api/login' : '/api/login/coach';
      const data = await api.post<{ bypassed?: boolean; user?: Athlete | Coach; success?: boolean }>(endpoint, {
        email: email.trim(),
        password,
      });
      if (data.bypassed && data.user) {
        await setUserLocally(data.user, role);
        if (role === 'athlete') {
          router.replace('/(athlete)/coaches');
        } else {
          router.replace('/(coach)/dashboard/availability');
        }
      } else {
        setStep('code');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 5) {
      setError('Enter the 5-digit code from your email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const endpoint = role === 'athlete' ? '/api/login/verify' : '/api/login/coach/verify';
      const user = await api.post<Athlete | Coach>(endpoint, { email: email.trim(), code });
      await setUserLocally(user, role);
      if (role === 'athlete') {
        router.replace('/(athlete)/coaches');
      } else {
        router.replace('/(coach)/dashboard/availability');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Button
              title="Back"
              variant="ghost"
              size="sm"
              onPress={() => {
                if (step === 'code') {
                  setStep('credentials');
                  setError(null);
                  setCode('');
                } else {
                  router.back();
                }
              }}
            />
          </View>

          <View style={styles.content}>
            {step === 'credentials' ? (
              <>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in as {role === 'athlete' ? 'an athlete' : 'a coach'}
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
                    returnKeyType="next"
                  />
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Your password"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />

                  <TouchableOpacity onPress={() => router.push(`/(auth)/forgot-password?role=${role}`)}>
                    <Text style={styles.forgotLink}>Forgot password?</Text>
                  </TouchableOpacity>

                  <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.submitBtn} />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account?</Text>
                  <Button
                    title="Sign Up"
                    variant="ghost"
                    size="sm"
                    onPress={() => router.replace(`/(auth)/signup?role=${role}`)}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>Check Your Email</Text>
                <Text style={styles.subtitle}>
                  Enter the 5-digit code sent to {email}
                </Text>

                <View style={styles.form}>
                  {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                  <Input
                    label="Verification Code"
                    value={code}
                    onChangeText={setCode}
                    placeholder="5-digit code"
                    keyboardType="numeric"
                    maxLength={5}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                  />

                  <Button
                    title="Verify Code"
                    onPress={handleVerifyCode}
                    loading={loading}
                    style={styles.submitBtn}
                  />
                </View>

                <Text style={styles.resendHint}>
                  Didn't receive it? Check your spam folder or go back and try again.
                </Text>
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
  form: { gap: 14 },
  submitBtn: { marginTop: 8 },
  errorBox: {
    backgroundColor: Colors.error + '15',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { fontSize: 14, color: Colors.error },
  forgotLink: { fontSize: 14, color: Colors.primary, textAlign: 'right' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  resendHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
