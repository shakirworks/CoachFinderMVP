import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';

export default function BookingSuccess() {
  const router = useRouter();
  const { coachName, sessions, totalAmount } = useLocalSearchParams<{
    coachName?: string;
    sessions?: string;
    totalAmount?: string;
  }>();

  const sessionCount = parseInt(sessions || '1', 10);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={52} color={Colors.success} />
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>

        {(coachName || totalAmount) ? (
          <View style={styles.summaryCard}>
            {coachName ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coach</Text>
                <Text style={styles.summaryValue}>{coachName}</Text>
              </View>
            ) : null}
            {sessions ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sessions Booked</Text>
                <Text style={styles.summaryValue}>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            {totalAmount ? (
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryValueBold}>${totalAmount} CAD</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.desc}>
          Your session{sessionCount !== 1 ? 's have' : ' has'} been booked successfully. A confirmation email with your receipt is on its way.
        </Text>

        <View style={styles.actions}>
          <Button
            title="View My Bookings"
            onPress={() => router.replace('/(athlete)/dashboard/bookings')}
            style={styles.btn}
          />
          <Button
            title="Find More Coaches"
            variant="outline"
            onPress={() => router.replace('/(athlete)/coaches')}
            style={styles.btn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 20,
  },
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.success + '15', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  summaryCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  summaryValueBold: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  desc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  actions: { width: '100%', gap: 12, marginTop: 8 },
  btn: { width: '100%' },
});
