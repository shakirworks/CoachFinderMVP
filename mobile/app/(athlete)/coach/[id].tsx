import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/theme/colors';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Coach, AvailabilitySlot, BookingQuote, Athlete, Message } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface SelectedSlot extends AvailabilitySlot {
  slotId: string;
}

export default function CoachProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const athlete = role === 'athlete' ? (user as Athlete) : null;
  const queryClient = useQueryClient();

  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [chatMessage, setChatMessage] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const { data: coach, isLoading } = useQuery<Coach>({
    queryKey: ['/api/coaches', id],
    queryFn: () => api.get<Coach>(`/api/coaches/${id}`),
    enabled: !!id,
  });

  const { data: slots } = useQuery<AvailabilitySlot[]>({
    queryKey: ['/api/availability', id],
    queryFn: () => api.get<AvailabilitySlot[]>(`/api/availability/${id}`),
    enabled: !!id,
  });

  // Get server-confirmed quote when slots are selected
  const slotIds = selectedSlots.map(s => s.id);
  const { data: quote, isFetching: quoteFetching } = useQuery<BookingQuote>({
    queryKey: ['/api/bookings/quote', id, slotIds.join(',')],
    queryFn: () => api.post<BookingQuote>('/api/bookings/quote', { coachId: id, slotIds }),
    enabled: selectedSlots.length > 0 && !!id,
    staleTime: 30_000,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', athlete?.id, id],
    queryFn: () => api.get<Message[]>(`/api/messages/${athlete?.id}/${id}`),
    enabled: !!athlete && !!id,
    refetchInterval: chatVisible ? 5000 : false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) => api.post('/api/messages', {
      athleteId: athlete?.id,
      coachId: id,
      message: msg,
      senderType: 'athlete',
    }),
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages', athlete?.id, id] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!athlete) throw new Error('Please sign in to book sessions');
      const data = await api.post<{ url: string; purchaseId: string; sessionId: string }>(
        '/api/bookings/checkout',
        { athleteId: athlete.id, coachId: id, slotIds }
      );
      return data;
    },
    onSuccess: async ({ url, sessionId }) => {
      await WebBrowser.openBrowserAsync(url, { dismissButtonStyle: 'close' });

      // After browser closes (payment complete or cancelled), verify with backend
      setVerifyingPayment(true);
      try {
        const status = await api.get<{ success: boolean; status: string }>(
          `/api/bookings/verify/${sessionId}`
        );
        if (status.success && status.status === 'paid') {
          setSelectedSlots([]);
          // Navigate to success with booking details from the confirmed quote
          router.push({
            pathname: '/(athlete)/booking-success',
            params: {
              coachName: coach?.name || '',
              sessions: selectedSlots.length.toString(),
              totalAmount: quote ? (quote.totalAmount / 100).toFixed(2) : '0',
            },
          });
        } else {
          Alert.alert(
            'Payment Not Confirmed',
            'Your payment may still be processing. Check your bookings tab to confirm, or try again.',
            [
              { text: 'View Bookings', onPress: () => router.push('/(athlete)/dashboard/bookings') },
              { text: 'OK', style: 'cancel' },
            ]
          );
        }
      } catch {
        Alert.alert(
          'Could Not Verify Payment',
          'Please check your bookings tab to see if your booking was confirmed.',
          [
            { text: 'View Bookings', onPress: () => router.push('/(athlete)/dashboard/bookings') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } finally {
        setVerifyingPayment(false);
      }
    },
    onError: (err: Error) => {
      Alert.alert('Checkout Error', err.message || 'Failed to start checkout');
    },
  });

  const toggleSlot = (slot: AvailabilitySlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const exists = selectedSlots.find(s => s.id === slot.id);
    if (exists) {
      setSelectedSlots(prev => prev.filter(s => s.id !== slot.id));
    } else {
      setSelectedSlots(prev => [...prev, { ...slot, slotId: slot.id }]);
    }
  };

  // Display quote amounts (server-authoritative) or local estimates while loading
  const displaySubtotal = quote ? (quote.subtotal / 100) : 0;
  const displayServiceFee = quote ? (quote.serviceFee / 100) : 0;
  const displayTax = quote ? (quote.taxAmount / 100) : 0;
  const displayTotal = quote ? (quote.totalAmount / 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to day boundary so same-day slots are not treated as past
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();

  const getDateStr = (day: number) => {
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getSlotsForDate = (dateStr: string) =>
    (slots || []).filter(s => s.date === dateStr);

  if (isLoading) return <LoadingScreen message="Loading coach profile..." />;
  if (!coach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Coach not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <Button title="Back" variant="ghost" size="sm" onPress={() => router.back()} />
        {athlete && (
          <Button title="Chat" variant="outline" size="sm" onPress={() => setChatVisible(true)} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileSection}>
          <Avatar name={coach.name} imageUri={coach.profileImage} size={96} />
          <Text style={styles.coachName}>{coach.name}</Text>
          <View style={styles.badgeRow}>
            <Badge label={coach.sport} variant="primary" />
            {coach.hourlyRate && <Badge label={`$${coach.hourlyRate}/hr`} variant="secondary" />}
            {coach.yearsOfExperience && <Badge label={`${coach.yearsOfExperience} yrs`} variant="outline" />}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{coach.location}</Text>
          </View>
        </View>

        {coach.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{coach.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.infoGrid}>
            {coach.coachingOptions && coach.coachingOptions.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Coaching</Text>
                <Text style={styles.infoValue}>{coach.coachingOptions.join(', ')}</Text>
              </View>
            )}
            {coach.studentLevels && coach.studentLevels.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Levels</Text>
                <Text style={styles.infoValue}>{coach.studentLevels.join(', ')}</Text>
              </View>
            )}
            {coach.certification && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Certification</Text>
                <Text style={styles.infoValue}>{coach.certification}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{athlete ? 'Book a Session' : 'Availability'}</Text>

          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.calNavBtn} onPress={() => setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.calMonthTitle}>
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity style={styles.calNavBtn} onPress={() => setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>
              <Ionicons name="chevron-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calGrid}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <Text key={d} style={styles.calDayHeader}>{d}</Text>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateStr(day);
              const daySlots = getSlotsForDate(dateStr);
              const isPast = new Date(dateStr) < today;
              const hasSlots = daySlots.length > 0;
              return (
                <View key={day} style={styles.calCell}>
                  <Text style={[styles.calDay, isPast && styles.calDayPast]}>{day}</Text>
                  {hasSlots && <View style={styles.calDot} />}
                </View>
              );
            })}
          </View>

          {slots && slots.length > 0 ? (
            <View style={styles.slotsList}>
              <Text style={styles.slotsSubtitle}>Available Slots</Text>
              {slots
                .filter(s => {
                  const slotDate = new Date(s.date + 'T00:00:00');
                  return slotDate >= today;
                })
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .slice(0, 20)
                .map(slot => {
                  const isSelected = selectedSlots.some(s => s.id === slot.id);
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.slotItem, isSelected && styles.slotItemSelected]}
                      onPress={() => athlete && toggleSlot(slot)}
                      disabled={!athlete}
                    >
                      <View>
                        <Text style={[styles.slotDate, isSelected && styles.slotDateSelected]}>
                          {format(parseISO(slot.date), 'EEE, MMM d')}
                        </Text>
                        <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                          {slot.startTime} – {slot.endTime}
                        </Text>
                      </View>
                      {athlete && (
                        <View style={[styles.slotCheck, isSelected && styles.slotCheckSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          ) : (
            <View style={styles.noSlots}>
              <Text style={styles.noSlotsText}>No available slots yet</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {athlete && selectedSlots.length > 0 && (
        <View style={styles.bookingSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{selectedSlots.length} session{selectedSlots.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.summaryTotal}>
              {quoteFetching ? '...' : `$${displayTotal.toFixed(2)} CAD`}
            </Text>
          </View>
          {quote && (
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryDetail}>Subtotal: ${displaySubtotal.toFixed(2)}</Text>
              <Text style={styles.summaryDetail}>Service fee ({Math.round(quote.serviceFeePercentage * 100)}%): ${displayServiceFee.toFixed(2)}</Text>
              <Text style={styles.summaryDetail}>HST ({Math.round(quote.taxPercentage * 100)}%): ${displayTax.toFixed(2)}</Text>
            </View>
          )}
          <Button
            title={verifyingPayment ? 'Verifying Payment...' : checkoutMutation.isPending ? 'Opening Checkout...' : 'Book Now'}
            onPress={() => checkoutMutation.mutate()}
            loading={checkoutMutation.isPending || verifyingPayment || quoteFetching}
            style={styles.bookBtn}
          />
        </View>
      )}

      <Modal visible={chatVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.chatModal}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat with {coach.name}</Text>
            <Button title="Close" variant="ghost" size="sm" onPress={() => setChatVisible(false)} />
          </View>
          <ScrollView
            contentContainerStyle={styles.chatMessages}
            ref={ref => { if (ref && messages.length > 0) ref.scrollToEnd({ animated: false }); }}
          >
            {messages.length === 0 ? (
              <View style={styles.chatEmpty}>
                <Text style={styles.chatEmptyText}>Start the conversation!</Text>
              </View>
            ) : (
              messages.map(m => {
                const isOwn = m.senderType === 'athlete';
                return (
                  <View key={m.id} style={[styles.msgWrapper, isOwn ? styles.msgWrapperOwn : styles.msgWrapperOther]}>
                    <View style={[styles.msgBubble, isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther]}>
                      <Text style={[styles.msgText, isOwn ? styles.msgTextOwn : styles.msgTextOther]}>
                        {m.message}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={500}
            />
            <Button
              title="Send"
              size="sm"
              onPress={() => {
                if (chatMessage.trim()) {
                  sendMessageMutation.mutate(chatMessage.trim());
                }
              }}
              loading={sendMessageMutation.isPending}
              disabled={!chatMessage.trim()}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  scroll: { paddingBottom: 220 },
  profileSection: {
    alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24,
    gap: 10,
  },
  coachName: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  locationRow: { flexDirection: 'row', gap: 4 },
  locationText: { fontSize: 14, color: Colors.textSecondary },
  section: {
    paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  bioText: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  infoGrid: { gap: 12 },
  infoItem: { gap: 2 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, color: Colors.text },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  calNavBtn: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  calMonthTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayHeader: {
    width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600',
    color: Colors.textTertiary, paddingBottom: 8,
  },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  calDay: { fontSize: 14, color: Colors.text },
  calDayPast: { color: Colors.textTertiary },
  calDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 2 },
  slotsList: { gap: 8 },
  slotsSubtitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  slotItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  slotItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  slotDate: { fontSize: 14, fontWeight: '600', color: Colors.text },
  slotDateSelected: { color: Colors.primary },
  slotTime: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  slotTimeSelected: { color: Colors.primary },
  slotCheck: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  slotCheckSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotCheckMark: { color: '#fff' },
  noSlots: { alignItems: 'center', paddingVertical: 20 },
  noSlotsText: { fontSize: 14, color: Colors.textTertiary },
  bottomPad: { height: 40 },
  bookingSummary: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 20, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  summaryTotal: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  summaryDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryDetail: { fontSize: 12, color: Colors.textSecondary },
  bookBtn: { marginTop: 4 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 18, color: Colors.textSecondary },
  chatModal: { flex: 1, backgroundColor: Colors.background },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chatTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  chatMessages: { paddingHorizontal: 16, paddingVertical: 16, gap: 8, flexGrow: 1, minHeight: 200 },
  chatEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  chatEmptyText: { fontSize: 14, color: Colors.textTertiary },
  msgWrapper: { maxWidth: '80%' },
  msgWrapperOwn: { alignSelf: 'flex-end' },
  msgWrapperOther: { alignSelf: 'flex-start' },
  msgBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  msgBubbleOwn: { backgroundColor: Colors.primary },
  msgBubbleOther: { backgroundColor: Colors.surfaceSecondary },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  msgTextOther: { color: Colors.text },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  chatInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, backgroundColor: Colors.surface,
    fontSize: 15, color: Colors.text,
  },
});
