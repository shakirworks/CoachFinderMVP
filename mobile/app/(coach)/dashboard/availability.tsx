import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/theme/colors';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AvailabilitySlot, Coach } from '@/lib/types';
import { format, parseISO } from 'date-fns';

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
];

function addHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const newH = (h + 1) % 24;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function AvailabilityTab() {
  const { user, role } = useAuth();
  const coach = role === 'coach' ? (user as Coach) : null;
  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const { data: slots, isLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ['/api/availability', coach?.id],
    queryFn: () => api.get<AvailabilitySlot[]>(`/api/availability/${coach?.id}`),
    enabled: !!coach?.id,
  });

  const addSlotMutation = useMutation({
    mutationFn: (data: { date: string; startTime: string; endTime: string }) =>
      api.post('/api/availability', { ...data, coachId: coach?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability', coach?.id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to add slot'),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.delete(`/api/availability/${slotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability', coach?.id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to delete slot'),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();

  const getDateStr = (day: number) => {
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getSlotsForDate = (dateStr: string) =>
    (slots || []).filter(s => s.date === dateStr);

  const handleAddSlots = async () => {
    if (!selectedDate || selectedTimes.length === 0) return;
    for (const t of selectedTimes) {
      await addSlotMutation.mutateAsync({
        date: selectedDate,
        startTime: t,
        endTime: addHour(t),
      });
    }
    setAddModalVisible(false);
    setSelectedTimes([]);
  };

  const handleDeleteSlot = (slot: AvailabilitySlot) => {
    Alert.alert(
      'Remove Slot',
      `Remove ${slot.date} ${slot.startTime}–${slot.endTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteSlotMutation.mutate(slot.id) },
      ]
    );
  };

  const selectedDateSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

  if (isLoading) return <LoadingScreen message="Loading availability..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Availability</Text>
        <Text style={styles.pageSubtitle}>Manage your coaching schedule</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.calSection}>
          <View style={styles.calNav}>
            <TouchableOpacity onPress={() => setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>
              <Text style={styles.calNavBtn}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthTitle}>
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>
              <Text style={styles.calNavBtn}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calGrid}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <Text key={d} style={styles.calDayHeader}>{d}</Text>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <View key={`e-${i}`} style={styles.calCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateStr(day);
              const daySlots = getSlotsForDate(dateStr);
              const isToday = new Date(dateStr + 'T00:00:00').toDateString() === new Date().toDateString();
              const isPast = new Date(dateStr + 'T00:00:00') < today;
              const isSelected = selectedDate === dateStr;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.calCell, isSelected && styles.calCellSelected, isToday && styles.calCellToday]}
                  onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                  disabled={isPast}
                >
                  <Text style={[styles.calDay, isPast && styles.calDayPast, isSelected && styles.calDaySelected]}>
                    {day}
                  </Text>
                  {daySlots.length > 0 && (
                    <View style={[styles.calDot, isSelected && styles.calDotSelected]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedDate && (
          <View style={styles.daySection}>
            <View style={styles.daySectionHeader}>
              <Text style={styles.daySectionTitle}>
                {format(parseISO(selectedDate), 'EEEE, MMMM d')}
              </Text>
              <Button
                title="+ Add Slots"
                size="sm"
                onPress={() => setAddModalVisible(true)}
              />
            </View>

            {selectedDateSlots.length === 0 ? (
              <View style={styles.noSlots}>
                <Text style={styles.noSlotsText}>No slots on this day</Text>
                <Text style={styles.noSlotsHint}>Tap "+ Add Slots" to add availability</Text>
              </View>
            ) : (
              <View style={styles.slotList}>
                {selectedDateSlots
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(slot => (
                    <View key={slot.id} style={styles.slotRow}>
                      <View style={styles.slotTimeContainer}>
                        <Text style={styles.slotTime}>{slot.startTime} – {slot.endTime}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteSlotBtn}
                        onPress={() => handleDeleteSlot(slot)}
                      >
                        <Text style={styles.deleteSlotText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {!selectedDate && (
          <View style={styles.promptSection}>
            <Text style={styles.promptText}>Tap a date to view or manage time slots</Text>
          </View>
        )}

        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingTitle}>Upcoming Slots</Text>
          {(slots || [])
            .filter(s => new Date(s.date + 'T00:00:00') >= today)
            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
            .slice(0, 10)
            .map(slot => (
              <View key={slot.id} style={styles.upcomingSlot}>
                <View>
                  <Text style={styles.upcomingDate}>{format(parseISO(slot.date), 'EEE, MMM d')}</Text>
                  <Text style={styles.upcomingTime}>{slot.startTime} – {slot.endTime}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSlot(slot)}>
                  <Text style={styles.removeBtn}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          {(slots || []).filter(s => new Date(s.date + 'T00:00:00') >= today).length === 0 && (
            <Text style={styles.noUpcoming}>No upcoming slots. Select a date above to add availability.</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Add Slots – {selectedDate ? format(parseISO(selectedDate), 'MMM d') : ''}
            </Text>
            <Button title="Close" variant="ghost" size="sm" onPress={() => { setAddModalVisible(false); setSelectedTimes([]); }} />
          </View>
          <Text style={styles.modalSubtitle}>Select one or more time slots to add</Text>
          <ScrollView contentContainerStyle={styles.timeGrid}>
            {TIME_SLOTS.map(t => {
              const isSelected = selectedTimes.includes(t);
              const existingSlot = selectedDateSlots.find(s => s.startTime === t);
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeSlot, isSelected && styles.timeSlotSelected, existingSlot && styles.timeSlotExists]}
                  onPress={() => {
                    if (existingSlot) return;
                    setSelectedTimes(prev =>
                      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                    );
                  }}
                  disabled={!!existingSlot}
                >
                  <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected, existingSlot && styles.timeSlotTextExists]}>
                    {t}
                  </Text>
                  {existingSlot && <Text style={styles.timeSlotExistsLabel}>Added</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button
              title={`Add ${selectedTimes.length} Slot${selectedTimes.length !== 1 ? 's' : ''}`}
              onPress={handleAddSlots}
              loading={addSlotMutation.isPending}
              disabled={selectedTimes.length === 0}
              style={styles.addBtn}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, gap: 2 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary },
  scroll: { paddingBottom: 40 },
  calSection: { margin: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calNavBtn: { fontSize: 28, color: Colors.primary, paddingHorizontal: 8 },
  calMonthTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayHeader: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textTertiary, paddingBottom: 8 },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 7, borderRadius: 8 },
  calCellSelected: { backgroundColor: Colors.primary },
  calCellToday: { borderWidth: 1.5, borderColor: Colors.primary },
  calDay: { fontSize: 14, color: Colors.text },
  calDayPast: { color: Colors.textTertiary },
  calDaySelected: { color: '#fff', fontWeight: '700' },
  calDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 2 },
  calDotSelected: { backgroundColor: '#fff' },
  daySection: { marginHorizontal: 16, gap: 12 },
  daySectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  daySectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  noSlots: { padding: 20, alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  noSlotsText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  noSlotsHint: { fontSize: 13, color: Colors.textTertiary },
  slotList: { gap: 8 },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12 },
  slotTimeContainer: {},
  slotTime: { fontSize: 15, fontWeight: '600', color: Colors.text },
  deleteSlotBtn: { padding: 6 },
  deleteSlotText: { fontSize: 16, color: Colors.error },
  promptSection: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  promptText: { fontSize: 14, color: Colors.textTertiary, fontStyle: 'italic' },
  upcomingSection: { margin: 16, gap: 10 },
  upcomingTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  upcomingSlot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12 },
  upcomingDate: { fontSize: 14, fontWeight: '600', color: Colors.text },
  upcomingTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  removeBtn: { fontSize: 13, color: Colors.error, fontWeight: '500' },
  noUpcoming: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center', paddingVertical: 12 },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalSubtitle: { fontSize: 14, color: Colors.textSecondary, paddingHorizontal: 20, paddingTop: 12 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 10, paddingBottom: 24 },
  timeSlot: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, minWidth: '28%', alignItems: 'center' },
  timeSlotSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeSlotExists: { backgroundColor: Colors.muted, borderColor: Colors.border },
  timeSlotText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  timeSlotTextSelected: { color: '#fff' },
  timeSlotTextExists: { color: Colors.textTertiary },
  timeSlotExistsLabel: { fontSize: 10, color: Colors.success, marginTop: 2 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  addBtn: { width: '100%' },
});
