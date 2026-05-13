import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/theme/colors';
import CoachCard from '@/components/CoachCard';
import Avatar from '@/components/Avatar';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Coach, Athlete } from '@/lib/types';

const SPORTS = ['Soccer', 'Tennis', 'Golf', 'Pickleball', 'Skiing', 'Baseball', 'Personal Training'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COACHING_TYPES = ['Adults', 'Kids', 'Groups'];

function buildQueryString(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export default function CoachesScreen() {
  const router = useRouter();
  const { user, role } = useAuth();
  const athlete = role === 'athlete' ? (user as Athlete) : null;

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState('');
  const [appliedSport, setAppliedSport] = useState<string | null>(null);
  const [appliedLevels, setAppliedLevels] = useState<string[]>([]);
  const [appliedTypes, setAppliedTypes] = useState<string[]>([]);
  const [appliedMinRate, setAppliedMinRate] = useState('');
  const [appliedMaxRate, setAppliedMaxRate] = useState('');

  const queryParams = buildQueryString({
    sport: appliedSport || undefined,
    location: appliedLocation || undefined,
    minRate: appliedMinRate || undefined,
    maxRate: appliedMaxRate || undefined,
    levels: appliedLevels.length > 0 ? appliedLevels.join(',') : undefined,
    types: appliedTypes.length > 0 ? appliedTypes.join(',') : undefined,
  });

  const { data: coaches, isLoading } = useQuery<Coach[]>({
    queryKey: ['/api/coaches', queryParams],
    queryFn: () => api.get<Coach[]>(`/api/coaches${queryParams}`),
  });

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const applyFilters = () => {
    setAppliedLocation(locationFilter);
    setAppliedSport(selectedSport);
    setAppliedLevels(selectedLevels);
    setAppliedTypes(selectedTypes);
    setAppliedMinRate(minRate);
    setAppliedMaxRate(maxRate);
    setFilterVisible(false);
  };

  const clearFilters = () => {
    setSelectedSport(null);
    setSelectedLevels([]);
    setSelectedTypes([]);
    setMinRate('');
    setMaxRate('');
    setLocationFilter('');
    setAppliedSport(null);
    setAppliedLevels([]);
    setAppliedTypes([]);
    setAppliedMinRate('');
    setAppliedMaxRate('');
    setAppliedLocation('');
  };

  const filtered = (coaches || []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.sport.toLowerCase().includes(q);
  });

  const activeFilterCount = (appliedSport ? 1 : 0) + appliedLevels.length + appliedTypes.length +
    (appliedMinRate ? 1 : 0) + (appliedMaxRate ? 1 : 0) + (appliedLocation ? 1 : 0);

  if (isLoading) return <LoadingScreen message="Loading coaches..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Find Your Coach</Text>
            <Text style={styles.subGreeting}>{athlete ? `Hi, ${athlete.name.split(' ')[0]}!` : 'Browse coaches'}</Text>
          </View>
          {athlete ? (
            <TouchableOpacity onPress={() => router.push('/(athlete)/dashboard/profile')}>
              <Avatar name={athlete.name} imageUri={athlete.profileImage} size={40} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color={Colors.textTertiary} style={styles.searchIconEl} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, sport..."
              placeholderTextColor={Colors.textTertiary}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? '#fff' : Colors.textSecondary}
            />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.sportScroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportScrollContent}>
            <TouchableOpacity
              style={[styles.sportChip, !appliedSport && styles.sportChipActive]}
              onPress={() => { setSelectedSport(null); setAppliedSport(null); }}
            >
              <Text style={[styles.sportChipText, !appliedSport && styles.sportChipTextActive]}>All</Text>
            </TouchableOpacity>
            {SPORTS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sportChip, appliedSport === s && styles.sportChipActive]}
                onPress={() => {
                  const next = appliedSport === s ? null : s;
                  setSelectedSport(next);
                  setAppliedSport(next);
                }}
              >
                <Text style={[styles.sportChipText, appliedSport === s && styles.sportChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.resultCount}>{filtered.length} coach{filtered.length !== 1 ? 'es' : ''} found</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CoachCard
            coach={item}
            onPress={() => router.push(`/(athlete)/coach/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No coaches found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search or filters</Text>
            {activeFilterCount > 0 && (
              <Button title="Clear Filters" variant="outline" size="sm" onPress={clearFilters} style={styles.clearBtn} />
            )}
          </View>
        }
      />

      <Modal visible={filterVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <View style={styles.modalHeaderActions}>
              {activeFilterCount > 0 && (
                <Button title="Clear all" variant="ghost" size="sm" onPress={clearFilters} />
              )}
              <Button title="Apply" size="sm" onPress={applyFilters} />
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Location</Text>
            <TextInput
              style={styles.locationInput}
              value={locationFilter}
              onChangeText={setLocationFilter}
              placeholder="e.g. Toronto, Vancouver..."
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.filterSectionTitle}>Student Levels</Text>
            <View style={styles.chipRow}>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.chip, selectedLevels.includes(l) && styles.chipActive]}
                  onPress={() => toggleArr(selectedLevels, setSelectedLevels, l)}
                >
                  <Text style={[styles.chipText, selectedLevels.includes(l) && styles.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Coaching Types</Text>
            <View style={styles.chipRow}>
              {COACHING_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, selectedTypes.includes(t) && styles.chipActive]}
                  onPress={() => toggleArr(selectedTypes, setSelectedTypes, t)}
                >
                  <Text style={[styles.chipText, selectedTypes.includes(t) && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Hourly Rate (CAD $)</Text>
            <View style={styles.rateRow}>
              <TextInput
                style={styles.rateInput}
                value={minRate}
                onChangeText={setMinRate}
                placeholder="Min"
                keyboardType="numeric"
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={styles.rateSep}>to</Text>
              <TextInput
                style={styles.rateInput}
                value={maxRate}
                onChangeText={setMaxRate}
                placeholder="Max"
                keyboardType="numeric"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subGreeting: { fontSize: 14, color: Colors.textSecondary },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 12,
  },
  searchIconEl: { marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Colors.text },
  clearSearchBtn: { padding: 6 },
  filterBtn: {
    width: 46, height: 46, borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  sportScroll: {},
  sportScrollContent: { gap: 8, paddingHorizontal: 0 },
  sportChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  sportChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sportChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  sportChipTextActive: { color: '#fff', fontWeight: '600' },
  resultCount: { fontSize: 13, color: Colors.textTertiary },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary },
  clearBtn: { marginTop: 8 },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalHeaderActions: { flexDirection: 'row', gap: 8 },
  modalContent: { paddingHorizontal: 20, paddingTop: 20, gap: 14, paddingBottom: 40 },
  filterSectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 8 },
  locationInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: Colors.text,
    backgroundColor: Colors.surface,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: Colors.text,
    backgroundColor: Colors.surface,
  },
  rateSep: { fontSize: 14, color: Colors.textSecondary },
});
