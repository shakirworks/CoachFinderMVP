import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/theme/colors';
import LoadingScreen from '@/components/LoadingScreen';

const { height } = Dimensions.get('window');

export default function Index() {
  const { authenticated, role, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  useEffect(() => {
    if (loading) return;
    if (authenticated) {
      if (role === 'athlete') router.replace('/(athlete)/coaches');
      else if (role === 'coach') router.replace('/(coach)/dashboard/availability');
      return;
    }
    (async () => {
      const done = await AsyncStorage.getItem('onboarding_complete');
      if (!done) {
        router.replace('/onboarding');
        return;
      }
      try {
        const raw = await AsyncStorage.getItem('selected_sports');
        if (raw) setSelectedSports(JSON.parse(raw));
      } catch {}
      setCheckingOnboarding(false);
    })();
  }, [authenticated, role, loading]);

  if (loading || checkingOnboarding) {
    return <LoadingScreen message="Loading CoachFinders…" />;
  }

  if (authenticated) return <LoadingScreen />;

  const sportIcons: Record<string, string> = {
    soccer: '⚽', basketball: '🏀', tennis: '🎾', golf: '⛳',
    pickleball: '🏓', skiing: '⛷', baseball: '⚾', running: '🏃',
    swimming: '🏊', cycling: '🚴', yoga: '🧘', training: '💪',
  };
  const sportLabels: Record<string, string> = {
    soccer: 'Soccer', basketball: 'Basketball', tennis: 'Tennis', golf: 'Golf',
    pickleball: 'Pickleball', skiing: 'Skiing', baseball: 'Baseball', running: 'Running',
    swimming: 'Swimming', cycling: 'Cycling', yoga: 'Yoga', training: 'Personal Training',
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <SafeAreaView style={styles.heroSafe}>
          <Text style={styles.wordmark}>CoachFinders</Text>
          <View style={styles.heroContent}>
            <Text style={styles.headline}>Your coaching{'\n'}journey starts{'\n'}here.</Text>
            <Text style={styles.tagline}>
              Connect with elite coaches across{'\n'}every sport that matters to you.
            </Text>
            {selectedSports.length > 0 && (
              <View style={styles.sportPills}>
                {selectedSports.slice(0, 5).map(id => (
                  <View key={id} style={styles.pill}>
                    <Text style={styles.pillIcon}>{sportIcons[id]}</Text>
                    <Text style={styles.pillText}>{sportLabels[id]}</Text>
                  </View>
                ))}
                {selectedSports.length > 5 && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>+{selectedSports.length - 5} more</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Get started</Text>
        <Text style={styles.sheetSubtitle}>Choose how you'd like to use the platform.</Text>

        <View style={styles.roleCards}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/(auth)/role-select?mode=signup&preRole=athlete')}
            activeOpacity={0.85}
          >
            <View style={styles.roleCardInner}>
              <View>
                <Text style={styles.roleCardTitle}>I'm an Athlete</Text>
                <Text style={styles.roleCardDesc}>Discover and book coaching sessions</Text>
              </View>
              <View style={styles.roleArrow}>
                <Text style={styles.roleArrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardOutline]}
            onPress={() => router.push('/(auth)/role-select?mode=signup&preRole=coach')}
            activeOpacity={0.85}
          >
            <View style={styles.roleCardInner}>
              <View>
                <Text style={[styles.roleCardTitle, styles.roleCardTitleDark]}>I'm a Coach</Text>
                <Text style={styles.roleCardDescDark}>Grow your coaching business</Text>
              </View>
              <View style={[styles.roleArrow, styles.roleArrowOutline]}>
                <Text style={[styles.roleArrowText, styles.roleArrowTextDark]}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signinRow}
          onPress={() => router.push('/(auth)/role-select?mode=signin')}
          activeOpacity={0.7}
        >
          <Text style={styles.signinText}>Already have an account?</Text>
          <Text style={styles.signinLink}> Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  hero: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  heroSafe: {
    flex: 1,
    paddingHorizontal: 28,
  },
  wordmark: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 20,
  },
  headline: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 50,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  sportPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillIcon: {
    fontSize: 13,
  },
  pillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  roleCards: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  roleCardOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleCardTitleDark: {
    color: Colors.text,
  },
  roleCardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  roleCardDescDark: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  roleArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleArrowOutline: {
    backgroundColor: Colors.surfaceSecondary,
  },
  roleArrowText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  roleArrowTextDark: {
    color: Colors.text,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  signinText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signinLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
});
