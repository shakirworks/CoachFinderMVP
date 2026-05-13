import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';

export default function RoleSelect() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; preRole?: string }>();
  const mode = params.mode || 'signup';
  const isSignIn = mode === 'signin';

  const handleRole = (role: 'athlete' | 'coach') => {
    if (isSignIn) {
      router.push(`/(auth)/signin?role=${role}`);
    } else {
      router.push(`/(auth)/signup?role=${role}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{isSignIn ? 'Sign In' : 'Join CoachFinders'}</Text>
        <Text style={styles.subtitle}>
          {isSignIn ? 'Select your account type' : 'How will you use the platform?'}
        </Text>

        <View style={styles.cards}>
          <TouchableOpacity style={styles.card} onPress={() => handleRole('athlete')} activeOpacity={0.8}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="body-outline" size={32} color={Colors.primaryForeground} />
            </View>
            <Text style={styles.cardTitle}>Athlete</Text>
            <Text style={styles.cardDesc}>
              {isSignIn ? 'Sign in to your athlete account' : 'Find and book coaching sessions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.cardCoach]} onPress={() => handleRole('coach')} activeOpacity={0.8}>
            <View style={[styles.cardIconContainer, styles.cardIconCoach]}>
              <Ionicons name="trophy-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.cardTitle, styles.cardTitleCoach]}>Coach</Text>
            <Text style={[styles.cardDesc, styles.cardDescCoach]}>
              {isSignIn ? 'Sign in to your coach account' : 'Manage your coaching business'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  cards: {
    gap: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 28,
    gap: 10,
  },
  cardCoach: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardIconCoach: {
    backgroundColor: Colors.primaryLight + '18',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryForeground,
  },
  cardTitleCoach: {
    color: Colors.text,
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  cardDescCoach: {
    color: Colors.textSecondary,
  },
});
