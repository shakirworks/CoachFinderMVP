import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/theme/colors';
import LoadingScreen from '@/components/LoadingScreen';

const SPORT_LABELS: Record<string, string> = {
  soccer: 'Soccer', basketball: 'Basketball', tennis: 'Tennis', golf: 'Golf',
  pickleball: 'Pickleball', skiing: 'Skiing', baseball: 'Baseball', running: 'Running',
  swimming: 'Swimming', cycling: 'Cycling', yoga: 'Yoga', training: 'Personal Training',
};

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  soccer: 'football-outline',
  basketball: 'basketball-outline',
  tennis: 'tennisball-outline',
  golf: 'golf-outline' as keyof typeof Ionicons.glyphMap,
  pickleball: 'tennisball-outline',
  skiing: 'snow-outline',
  baseball: 'baseball-outline',
  running: 'walk-outline',
  swimming: 'water-outline',
  cycling: 'bicycle-outline',
  yoga: 'body-outline',
  training: 'barbell-outline',
};

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <SafeAreaView style={styles.heroSafe}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.heroContent}>
            <Text style={styles.headline}>Your coaching{'\n'}journey starts{'\n'}here.</Text>
            <Text style={styles.tagline}>
              Connect with elite coaches across{'\n'}every sport that matters to you.
            </Text>
            {selectedSports.length > 0 && (
              <View style={styles.sportPills}>
                {selectedSports.slice(0, 4).map(id => (
                  <View key={id} style={styles.pill}>
                    <Ionicons
                      name={SPORT_ICONS[id] || 'fitness-outline'}
                      size={13}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.pillText}>{SPORT_LABELS[id] || id}</Text>
                  </View>
                ))}
                {selectedSports.length > 4 && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>+{selectedSports.length - 4} more</Text>
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
              <View style={styles.roleCardLeft}>
                <Ionicons name="body-outline" size={20} color={Colors.primaryForeground} />
                <View>
                  <Text style={styles.roleCardTitle}>I'm an Athlete</Text>
                  <Text style={styles.roleCardDesc}>Discover and book coaching sessions</Text>
                </View>
              </View>
              <View style={styles.roleArrow}>
                <Ionicons name="chevron-forward" size={18} color={Colors.primaryForeground} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardOutline]}
            onPress={() => router.push('/(auth)/role-select?mode=signup&preRole=coach')}
            activeOpacity={0.85}
          >
            <View style={styles.roleCardInner}>
              <View style={styles.roleCardLeft}>
                <Ionicons name="trophy-outline" size={20} color={Colors.primary} />
                <View>
                  <Text style={[styles.roleCardTitle, styles.roleCardTitleDark]}>I'm a Coach</Text>
                  <Text style={styles.roleCardDescDark}>Grow your coaching business</Text>
                </View>
              </View>
              <View style={[styles.roleArrow, styles.roleArrowOutline]}>
                <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
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
  logoImage: {
    width: 160,
    height: 44,
    marginTop: 16,
    tintColor: 'rgba(255,255,255,0.9)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 24,
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
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
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    gap: 14,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -6,
  },
  roleCards: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
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
  roleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryForeground,
    marginBottom: 2,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleArrowOutline: {
    backgroundColor: Colors.surfaceSecondary,
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
