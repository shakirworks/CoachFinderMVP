import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';
import { api } from '@/lib/api';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifiedData, setVerifiedData] = useState<{ email: string; role: string; token: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found.');
      return;
    }
    api.get<{ verified: boolean; email: string; role: string; token: string }>(`/api/verify-email/${token}`)
      .then(data => {
        setVerifiedData({ email: data.email, role: data.role, token: data.token });
        setStatus('success');
      })
      .catch(err => {
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed. The link may be expired or already used.');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Verifying your email...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Verification Failed</Text>
          <Text style={styles.errorDesc}>{errorMsg}</Text>
          <Button title="Go to Sign In" onPress={() => router.replace('/')} style={styles.btn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Email Verified!</Text>
        <Text style={styles.successDesc}>
          Your email has been verified. Now let's set up your profile.
        </Text>
        <Button
          title="Complete Profile Setup"
          onPress={() => router.replace({
            pathname: '/(auth)/profile-setup',
            params: {
              email: verifiedData?.email,
              role: verifiedData?.role,
              token: verifiedData?.token,
            },
          })}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  loadingText: { fontSize: 16, color: Colors.textSecondary, marginTop: 16 },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 24, fontWeight: '700', color: Colors.error },
  errorDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successIcon: { fontSize: 48, width: 80, height: 80, textAlign: 'center', lineHeight: 80, backgroundColor: Colors.success + '15', borderRadius: 40 },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.success },
  successDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  btn: { width: '100%', marginTop: 8 },
});
