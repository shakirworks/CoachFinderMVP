import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/theme/colors';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Coach } from '@/lib/types';

export default function PaymentsTab() {
  const { user, role } = useAuth();
  const coach = role === 'coach' ? (user as Coach) : null;
  const [onboarding, setOnboarding] = useState(false);

  const { data: coachData, isLoading, refetch } = useQuery<Coach>({
    queryKey: ['/api/coaches', coach?.id],
    queryFn: () => api.get<Coach>(`/api/coaches/${coach?.id}`),
    enabled: !!coach?.id,
  });

  const runOnboardingFlow = async (coachId: string) => {
    const { url: onboardingUrl } = await api.post<{ url: string; accountId: string }>(
      `/api/coaches/${coachId}/stripe/connect`
    );
    await api.post<{ clientSecret: string }>(
      `/api/coaches/${coachId}/stripe/account-session`
    );
    await WebBrowser.openBrowserAsync(onboardingUrl, {
      dismissButtonStyle: 'done',
      toolbarColor: '#6B1A2B',
      controlsColor: '#FFFFFF',
    });
  };

  const connectAndOnboard = async () => {
    if (!coach?.id) return;
    setOnboarding(true);
    try {
      await runOnboardingFlow(coach.id);
      await refetch();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to start Stripe onboarding');
    } finally {
      setOnboarding(false);
    }
  };

  const completeOnboarding = async () => {
    if (!coach?.id) return;
    setOnboarding(true);
    try {
      await runOnboardingFlow(coach.id);
      await refetch();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to open Stripe onboarding');
    } finally {
      setOnboarding(false);
    }
  };

  if (isLoading) return <LoadingScreen message="Loading payment info..." />;

  const currentCoach = coachData || coach;
  const isConnected = !!currentCoach?.stripeAccountId;
  const isOnboardingComplete = currentCoach?.stripeOnboardingComplete === 'true';

  const getStatusVariant = (): 'success' | 'warning' | 'secondary' => {
    if (isOnboardingComplete) return 'success';
    if (isConnected) return 'warning';
    return 'secondary';
  };

  const getStatusLabel = () => {
    if (isOnboardingComplete) return 'Active';
    if (isConnected) return 'Setup Required';
    return 'Not Connected';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Payments</Text>
          <Text style={styles.pageSubtitle}>Manage your Stripe Connect account</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Stripe Account Status</Text>
            <Badge label={getStatusLabel()} variant={getStatusVariant()} />
          </View>

          {isOnboardingComplete ? (
            <View style={styles.successContent}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={44} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Payment Account Active</Text>
              <Text style={styles.successDesc}>
                Athletes can book and pay for your sessions. Payments go directly to your Stripe account after each booking.
              </Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Platform Fee</Text>
                  <Text style={styles.infoValue}>7%</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>HST</Text>
                  <Text style={styles.infoValue}>13%</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Currency</Text>
                  <Text style={styles.infoValue}>CAD</Text>
                </View>
              </View>
              <Button
                title="Manage on Stripe"
                variant="outline"
                size="sm"
                onPress={() => WebBrowser.openBrowserAsync('https://dashboard.stripe.com')}
                style={styles.actionBtn}
              />
            </View>
          ) : isConnected ? (
            <View style={styles.pendingContent}>
              <Ionicons name="warning-outline" size={44} color={Colors.warning} />
              <Text style={styles.pendingTitle}>Onboarding Incomplete</Text>
              <Text style={styles.pendingDesc}>
                Your Stripe account has been created but you need to complete onboarding to start receiving payments from athletes.
              </Text>
              <Button
                title={onboarding ? 'Opening...' : 'Complete Stripe Onboarding'}
                onPress={completeOnboarding}
                loading={onboarding}
                style={styles.actionBtn}
              />
            </View>
          ) : (
            <View style={styles.notConnectedContent}>
              <Text style={styles.notConnectedTitle}>Connect Your Stripe Account</Text>
              <Text style={styles.notConnectedDesc}>
                To receive payments from athletes, connect a Stripe account. This lets CoachFinders pay you directly after each session.
              </Text>
              <View style={styles.benefitsList}>
                {['Secure, instant payouts', 'Direct bank deposits', 'Automatic invoicing', 'Canadian tax support (HST)'].map(b => (
                  <View key={b} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.benefit}>{b}</Text>
                  </View>
                ))}
              </View>
              <Button
                title={onboarding ? 'Connecting...' : 'Connect with Stripe'}
                onPress={connectAndOnboard}
                loading={onboarding}
                style={styles.actionBtn}
              />
            </View>
          )}
        </View>

        <View style={styles.feeCard}>
          <Text style={styles.feeCardTitle}>How Payments Work</Text>
          <View style={styles.feeBreakdown}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Your hourly rate</Text>
              <Text style={styles.feeValue}>${currentCoach?.hourlyRate || '0'}/hr</Text>
            </View>
            <View style={styles.feeDivider} />
            <Text style={styles.feeNote}>
              Athletes pay your rate + 7% platform fee + 13% HST (Ontario). You receive your rate directly, minus Stripe processing fees.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 4 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary },
  card: { margin: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 20, gap: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  successContent: { gap: 12, alignItems: 'center' },
  successIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.success + '15', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 18, fontWeight: '700', color: Colors.success },
  successDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  infoGrid: { flexDirection: 'row', gap: 24, marginTop: 8 },
  infoItem: { alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  infoValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  pendingContent: { gap: 12, alignItems: 'center' },
  pendingTitle: { fontSize: 17, fontWeight: '700', color: Colors.warning },
  pendingDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  notConnectedContent: { gap: 14 },
  notConnectedTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  notConnectedDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  benefitsList: { gap: 8, backgroundColor: Colors.muted, borderRadius: 10, padding: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefit: { fontSize: 14, color: Colors.text },
  actionBtn: { width: '100%' },
  feeCard: { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 20, gap: 12 },
  feeCardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  feeBreakdown: { gap: 10 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 14, color: Colors.textSecondary },
  feeValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  feeDivider: { height: 1, backgroundColor: Colors.border },
  feeNote: { fontSize: 13, color: Colors.textTertiary, lineHeight: 18 },
});
