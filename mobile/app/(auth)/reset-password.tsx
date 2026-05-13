import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const router = useRouter();
  const { token, role } = useLocalSearchParams<{ token?: string; role?: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!newPassword) e.newPassword = 'Password is required';
    else if (newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!token) {
      setApiError('Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword, role: role || 'athlete' });
      setDone(true);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to reset password. The link may be expired.');
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
            {done ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark" size={40} color={Colors.success} />
                </View>
                <Text style={styles.title}>Password Reset!</Text>
                <Text style={styles.successMsg}>
                  Your password has been updated successfully. You can now sign in with your new password.
                </Text>
                <Button
                  title="Sign In"
                  onPress={() => router.replace(`/(auth)/signin?role=${role || 'athlete'}`)}
                  style={styles.btn}
                />
              </View>
            ) : (
              <>
                <Text style={styles.title}>Set New Password</Text>
                <Text style={styles.subtitle}>Choose a strong password for your account.</Text>

                <View style={styles.form}>
                  {apiError ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{apiError}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    secureTextEntry
                    error={errors.newPassword}
                    returnKeyType="next"
                  />
                  <Input
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat your new password"
                    secureTextEntry
                    error={errors.confirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />

                  <Button
                    title="Reset Password"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.btn}
                  />
                </View>

                <Button
                  title="Request a new link"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.replace(`/(auth)/forgot-password?role=${role || 'athlete'}`)}
                />
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
  btn: { marginTop: 8, width: '100%' },
  errorBox: { backgroundColor: Colors.error + '15', borderRadius: 8, padding: 12 },
  errorText: { fontSize: 14, color: Colors.error },
  successContainer: { flex: 1, alignItems: 'center', paddingTop: 40, gap: 16 },
  successIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.success + '15', alignItems: 'center', justifyContent: 'center',
  },
  successMsg: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
