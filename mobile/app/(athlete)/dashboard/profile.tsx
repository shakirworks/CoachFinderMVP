import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';
import { api, uploadPhoto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Athlete } from '@/lib/types';

const SPORTS = ['Soccer', 'Tennis', 'Golf', 'Pickleball', 'Skiing', 'Baseball', 'Personal Training'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function AthleteProfileTab() {
  const { user, role, logout, setUserLocally } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const athlete = role === 'athlete' ? (user as Athlete) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(athlete?.name || '');
  const [location, setLocation] = useState(athlete?.location || '');
  const [sport, setSport] = useState(athlete?.sport || '');
  const [skillLevel, setSkillLevel] = useState(athlete?.skillLevel || '');
  const [gender, setGender] = useState(athlete?.gender || '');
  const [age, setAge] = useState(athlete?.age || '');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Athlete>) => {
      return api.patch<Athlete>(`/api/athletes/${athlete?.id}`, updates);
    },
    onSuccess: async (updated) => {
      await setUserLocally(updated, 'athlete');
      setIsEditing(false);
      setProfileImageUri(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully!');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to update profile'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/athletes/${athlete?.id}`),
    onSuccess: () => {
      logout();
      router.replace('/');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to delete account'),
  });

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !location.trim() || !sport) {
      Alert.alert('Error', 'Name, location, and sport are required');
      return;
    }
    const updates: Partial<Athlete> = { name: name.trim(), location: location.trim(), sport };
    if (skillLevel) updates.skillLevel = skillLevel;
    if (gender) updates.gender = gender;
    if (age) updates.age = age;

    if (profileImageUri) {
      setUploadingPhoto(true);
      try {
        const { url } = await uploadPhoto(profileImageUri);
        updates.profileImage = url;
      } catch {
        Alert.alert('Warning', 'Photo upload failed. Saving other changes...');
      } finally {
        setUploadingPhoto(false);
      }
    }
    updateMutation.mutate(updates);
  };

  const handleCancel = () => {
    if (athlete) {
      setName(athlete.name);
      setLocation(athlete.location);
      setSport(athlete.sport);
      setSkillLevel(athlete.skillLevel || '');
      setGender(athlete.gender || '');
      setAge(athlete.age || '');
    }
    setProfileImageUri(null);
    setIsEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (!athlete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.pageTitle}>My Profile</Text>
            {!isEditing ? (
              <View style={styles.headerActions}>
                <Button title="Edit" variant="outline" size="sm" onPress={() => setIsEditing(true)} />
                <Button title="Sign Out" variant="ghost" size="sm" onPress={logout} />
              </View>
            ) : null}
          </View>

          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={isEditing ? pickPhoto : undefined} disabled={!isEditing}>
              <Avatar
                name={athlete.name}
                imageUri={profileImageUri || athlete.profileImage}
                size={90}
              />
              {isEditing && (
                <View style={styles.editPhotoOverlay}>
                  <Text style={styles.editPhotoText}>Edit</Text>
                </View>
              )}
            </TouchableOpacity>

            {!isEditing && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{athlete.name}</Text>
                <Text style={styles.profileEmail}>{athlete.email}</Text>
                <View style={styles.profileLocationRow}>
                  <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.profileLocation}>{athlete.location}</Text>
                </View>
                <View style={styles.badgeRow}>
                  {athlete.sport && <Badge label={athlete.sport} variant="primary" />}
                  {athlete.skillLevel && <Badge label={athlete.skillLevel} variant="secondary" />}
                  {athlete.gender && <Badge label={athlete.gender} variant="outline" />}
                  {athlete.age && <Badge label={`Age ${athlete.age}`} variant="outline" />}
                </View>
              </View>
            )}
          </View>

          {isEditing && (
            <View style={styles.form}>
              <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
              <Input label="Location" value={location} onChangeText={setLocation} placeholder="City, Province" autoCapitalize="words" />

              <Text style={styles.formLabel}>Sport</Text>
              <View style={styles.chipRow}>
                {SPORTS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, sport === s && styles.chipActive]}
                    onPress={() => setSport(s)}
                  >
                    <Text style={[styles.chipText, sport === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Skill Level</Text>
              <View style={styles.chipRow}>
                {SKILL_LEVELS.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.chip, skillLevel === l && styles.chipActive]}
                    onPress={() => setSkillLevel(l)}
                  >
                    <Text style={[styles.chipText, skillLevel === l && styles.chipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Gender</Text>
              <View style={styles.chipRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, gender === g && styles.chipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Age (optional)" value={age} onChangeText={setAge} placeholder="Your age" keyboardType="numeric" />

              <View style={styles.saveActions}>
                <Button
                  title={updateMutation.isPending || uploadingPhoto ? 'Saving...' : 'Save Changes'}
                  onPress={handleSave}
                  loading={updateMutation.isPending || uploadingPhoto}
                  style={styles.saveBtn}
                />
                <Button title="Cancel" variant="outline" onPress={handleCancel} style={styles.saveBtn} />
              </View>

              <View style={styles.dangerZone}>
                <Text style={styles.dangerTitle}>Danger Zone</Text>
                <Text style={styles.dangerDesc}>Once deleted, your account cannot be recovered.</Text>
                <Button
                  title="Delete Account"
                  variant="destructive"
                  size="sm"
                  onPress={confirmDelete}
                  loading={deleteMutation.isPending}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 15 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  avatarSection: { paddingHorizontal: 20, paddingVertical: 16, gap: 16, alignItems: 'center' },
  editPhotoOverlay: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary,
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3,
  },
  editPhotoText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  profileInfo: { alignItems: 'center', gap: 6 },
  profileName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  profileEmail: { fontSize: 14, color: Colors.textSecondary },
  profileLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileLocation: { fontSize: 14, color: Colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  form: { paddingHorizontal: 20, gap: 14, paddingBottom: 24 },
  formLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  saveBtn: { flex: 1 },
  dangerZone: {
    marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.error + '40', backgroundColor: Colors.error + '08', gap: 8,
  },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: Colors.error },
  dangerDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
