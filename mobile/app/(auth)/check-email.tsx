import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';

export default function CheckEmail() {
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{ email?: string; role?: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.description}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>Next steps:</Text>
          <Text style={styles.step}>1. Open the email from CoachFinders</Text>
          <Text style={styles.step}>2. Tap the verification link</Text>
          <Text style={styles.step}>3. Complete your profile setup</Text>
        </View>

        <Text style={styles.note}>
          The link expires in 24 hours. Check your spam folder if you don't see it.
        </Text>

        <Button
          title="Back to Sign In"
          variant="outline"
          onPress={() => router.replace(`/(auth)/signin?role=${role || 'athlete'}`)}
          style={styles.btn}
        />
        <Button
          title="Go to Home"
          variant="ghost"
          onPress={() => router.replace('/')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  steps: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  step: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  note: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  btn: { width: '100%', marginTop: 16 },
});
