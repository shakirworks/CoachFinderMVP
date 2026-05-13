import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme/colors';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Invoice, Athlete } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { BASE_URL } from '@/lib/api';

export default function BookingsTab() {
  const { user, role } = useAuth();
  const athlete = role === 'athlete' ? (user as Athlete) : null;
  const router = useRouter();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/athletes', athlete?.id, 'invoices'],
    queryFn: () => api.get<Invoice[]>(`/api/athletes/${athlete?.id}/invoices`),
    enabled: !!athlete?.id,
  });

  if (isLoading) return <LoadingScreen message="Loading bookings..." />;

  const formatDate = (d: string) => {
    try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d; }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Bookings</Text>
      </View>

      <FlatList
        data={invoices || []}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const sessions = item.sessionDetails as Array<{ date: string; startTime: string; endTime: string }>;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.coachName}>{item.coachName}</Text>
                  <Text style={styles.invoiceNum}>Invoice #{item.invoiceNumber}</Text>
                </View>
                <View style={[styles.statusBadge, item.paidAt ? styles.statusPaid : styles.statusPending]}>
                  <Text style={[styles.statusText, item.paidAt ? styles.statusTextPaid : styles.statusTextPending]}>
                    {item.paidAt ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.sessions}>
                {sessions.slice(0, 3).map((s, i) => (
                  <View key={i} style={styles.sessionRow}>
                    <View style={styles.sessionDateRow}>
                      <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.sessionDate}>{s.date}</Text>
                    </View>
                    <Text style={styles.sessionTime}>{s.startTime} – {s.endTime}</Text>
                  </View>
                ))}
                {sessions.length > 3 && (
                  <Text style={styles.moreSessions}>+{sessions.length - 3} more sessions</Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>${(item.totalAmount / 100).toFixed(2)} {item.currency}</Text>
                </View>
                <View style={styles.footerActions}>
                  {item.paidAt && (
                    <Text style={styles.paidDate}>Paid {formatDate(item.paidAt)}</Text>
                  )}
                  {item.providerReceiptUrl && (
                    <Button
                      title="View Receipt"
                      variant="outline"
                      size="sm"
                      onPress={() => Linking.openURL(item.providerReceiptUrl!)}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyDesc}>Book a session with a coach to get started</Text>
            <Button
              title="Find Coaches"
              onPress={() => router.push('/(athlete)/coaches')}
              style={styles.emptyBtn}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: 16, marginBottom: 12, gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  coachName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  invoiceNum: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusPaid: { backgroundColor: Colors.success + '20' },
  statusPending: { backgroundColor: Colors.warning + '20' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextPaid: { color: Colors.success },
  statusTextPending: { color: Colors.warning },
  sessions: { gap: 6, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionDate: { fontSize: 13, color: Colors.text },
  sessionTime: { fontSize: 13, color: Colors.textSecondary },
  moreSessions: { fontSize: 12, color: Colors.textTertiary, fontStyle: 'italic' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10,
  },
  totalLabel: { fontSize: 12, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalAmount: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  footerActions: { alignItems: 'flex-end', gap: 6 },
  paidDate: { fontSize: 12, color: Colors.textTertiary },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 8, width: '100%' },
});
