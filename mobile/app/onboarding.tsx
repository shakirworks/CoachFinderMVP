import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/theme/colors';

type SportIconName = React.ComponentProps<typeof Ionicons>['name'];

const SPORTS: { id: string; label: string; icon: SportIconName }[] = [
  { id: 'soccer',      label: 'Soccer',           icon: 'football-outline' },
  { id: 'basketball',  label: 'Basketball',        icon: 'basketball-outline' },
  { id: 'tennis',      label: 'Tennis',            icon: 'tennisball-outline' },
  { id: 'golf',        label: 'Golf',              icon: 'golf-outline' as SportIconName },
  { id: 'pickleball',  label: 'Pickleball',        icon: 'tennisball-outline' },
  { id: 'skiing',      label: 'Skiing',            icon: 'snow-outline' },
  { id: 'baseball',    label: 'Baseball',          icon: 'baseball-outline' },
  { id: 'running',     label: 'Running',           icon: 'walk-outline' },
  { id: 'swimming',    label: 'Swimming',          icon: 'water-outline' },
  { id: 'cycling',     label: 'Cycling',           icon: 'bicycle-outline' },
  { id: 'yoga',        label: 'Yoga',              icon: 'body-outline' },
  { id: 'training',    label: 'Personal Training', icon: 'barbell-outline' },
];

const LOADING_MESSAGES = [
  'Personalizing your experience…',
  'Finding coaches near you…',
  'Getting everything ready…',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<'welcome' | 'sports' | 'loading'>('welcome');
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => transitionToSports(), 900);
    });
  }, []);

  const transitionToSports = () => {
    Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    setPhase('sports');
  };

  const toggleSport = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const startLoading = async () => {
    setPhase('loading');
    contentFade.setValue(0);

    await AsyncStorage.setItem('onboarding_complete', 'true');
    await AsyncStorage.setItem('selected_sports', JSON.stringify(selected));

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(progressAnim, { toValue: 1, duration: 2600, useNativeDriver: false }).start();

    const msgTimer1 = setTimeout(() => setLoadingMsgIdx(1), 900);
    const msgTimer2 = setTimeout(() => setLoadingMsgIdx(2), 1800);
    const navTimer  = setTimeout(() => {
      clearTimeout(msgTimer1);
      clearTimeout(msgTimer2);
      router.replace('/');
    }, 2800);

    return () => {
      clearTimeout(msgTimer1);
      clearTimeout(msgTimer2);
      clearTimeout(navTimer);
    };
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (phase === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[styles.loadingLogo, { transform: [{ scale: pulseAnim }] }]}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.loadingLogoImage}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.loadingMsg}>{LOADING_MESSAGES[loadingMsgIdx]}</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[
          styles.heroSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headline}>Find your perfect{'\n'}coach today</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: contentFade }]}>
          <Text style={styles.cardTitle}>Which sports are you into?</Text>
          <Text style={styles.cardSubtitle}>Select all that apply — we'll personalise your experience.</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sportsGrid}
          >
            {SPORTS.map(sport => {
              const isSelected = selected.includes(sport.id);
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.sportChip, isSelected && styles.sportChipSelected]}
                  onPress={() => toggleSport(sport.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={sport.icon}
                    size={15}
                    color={isSelected ? '#FFFFFF' : Colors.textSecondary}
                  />
                  <Text style={[styles.sportLabel, isSelected && styles.sportLabelSelected]}>
                    {sport.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={startLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>
                {selected.length > 0 ? `Continue with ${selected.length} sport${selected.length > 1 ? 's' : ''}` : "Let's Get Started"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={startLoading} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  safeArea: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 14,
  },
  logoImage: {
    width: 160,
    height: 44,
    tintColor: 'rgba(255,255,255,0.9)',
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 0,
    gap: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sportChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  sportLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardFooter: {
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
    alignItems: 'center',
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 40,
  },
  loadingLogo: {
    alignItems: 'center',
  },
  loadingLogoImage: {
    width: 200,
    height: 56,
    tintColor: '#FFFFFF',
  },
  loadingMsg: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    fontWeight: '400',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
});
