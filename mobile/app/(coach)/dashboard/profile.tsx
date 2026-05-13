import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';
import { api, uploadPhoto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Coach } from '@/lib/types';

const SPORTS = ['Soccer', 'Tennis', 'Golf', 'Pickleball', 'Skiing', 'Baseball', 'Personal Training'];
const COACHING_OPTIONS = ['Adults', 'Kids', 'Groups'];
const STUDENT_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function CoachProfileTab() {
  const { user, role, logout, setUserLocally } = useAuth();
  const router = useRouter();
  const coach = role === 'coach' ? (user as Coach) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(coach?.name || '');
  const [location, setLocation] = useState(coach?.location || '');
  const [sport, setSport] = useState(coach?.sport || '');
  const [bio, setBio] = useState(coach?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(coach?.hourlyRate || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(coach?.yearsOfExperience || '');
  const [certification, setCertification] = useState(coach?.certification || '');
  const [gender, setGender] = useState(coach?.gender || '');
  const [age, setAge] = useState(coach?.age || '');
  const [coachingOptions, setCoachingOptions] = useState<string[]>(coach?.coachingOptions || []);
  const [studentLevels, setStudentLevels] = useState<string[]>(coach?.studentLevels || []);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Coach>) => {
      return api.patch<Coach>(`/api/coaches/${coach?.id}`, updates);
    },
    onSuccess: async (updated) => {
      await setUserLocally(updated, 'coach');
      setIsEditing(false);
      setProfileImageUri(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated!');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to update profile'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/coaches/${coach?.id}`),
    onSuccess: () => {
      logout();
      router.replace('/');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to delete account'),
  });

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setProfileImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim() || !location.trim() || !sport) {
      Alert.alert('Error', 'Name, location, and sport are required'); return;
    }
    const updates: Partial<Coach> = { name: name.trim(), location: location.trim(), sport };
    if (bio) updates.bio = bio;
    if (hourlyRate) updates.hourlyRate = hourlyRate;
    if (yearsOfExperience) updates.yearsOfExperience = yearsOfExperience;
    if (certification) updates.certification = certification;
    if (gender) updates.gender = gender;
    if (age) updates.age = age;
    if (coachingOptions.length > 0) updates.coachingOptions = coachingOptions;
    if (studentLevels.length > 0) updates.studentLevels = studentLevels;

    if (profileImageUri) {
      setUploadingPhoto(true);
      try {
        const { url } = await uploadPhoto(profileImageUri);
        updates.profileImage = url;
      } catch {
        Alert.alert('Warning', 'Photo upload failed. Saving other changes...');
      } finally { setUploadingPhoto(false); }
    }
    updateMutation.mutate(updates);
  };

  const handleCancel = () => {
    if (coach) {
      setName(coach.name); setLocation(coach.location); setSport(coach.sport);
      setBio(coach.bio || ''); setHourlyRate(coach.hourlyRate || '');
      setYearsOfExperience(coach.yearsOfExperience || ''); setCertification(coach.certification || '');
      setGender(coach.gender || ''); setAge(coach.age || '');
      setCoachingOptions(coach.coachingOptions || []); setStudentLevels(coach.studentLevels || []);
    }
    setProfileImageUri(null);
    setIsEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert('Delete Account', 'This permanently deletes your account and all data. Cannot be undone.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }]
    );
  };

  if (!coach) return null;

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
              <Avatar name={coach.name} imageUri={profileImageUri || coach.profileImage} size={90} />
              {isEditing && (
                <View style={styles.editPhotoOverlay}>
                  <Text style={styles.editPhotoText}>Edit</Text>
                </View>
              )}
            </TouchableOpacity>

            {!isEditing && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{coach.name}</Text>
                <Text style={styles.profileEmail}>{coach.email}</Text>
                <View style={styles.profileLocationRow}>
                  <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.profileLocation}>{coach.location}</Text>
                </View>
                {coach.bio && <Text style={styles.profileBio} numberOfLines={3}>{coach.bio}</Text>}
                <View style={styles.badgeRow}>
                  {coach.sport && <Badge label={coach.sport} variant="primary" />}
                  {coach.hourlyRate && <Badge label={`$${coach.hourlyRate}/hr`} variant="secondary" />}
                  {coach.yearsOfExperience && <Badge label={`${coach.yearsOfExperience} yrs exp`} variant="outline" />}
                </View>
                {coach.coachingOptions && coach.coachingOptions.length > 0 && (
                  <View style={styles.badgeRow}>
                    {coach.coachingOptions.map(o => <Badge key={o} label={o} variant="outline" />)}
                  </View>
                )}
                {coach.studentLevels && coach.studentLevels.length > 0 && (
                  <View style={styles.badgeRow}>
                    {coach.studentLevels.map(l => <Badge key={l} label={l} variant="outline" />)}
                  </View>
                )}
              </View>
            )}
          </View>

          {isEditing && (
            <View style={styles.form}>
              <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
              <Input label="Location" value={location} onChangeText={setLocation} placeholder="City, Province" autoCapitalize="words" />
              <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell athletes about yourself..." multiline numberOfLines={4} />
              <Input label="Hourly Rate ($CAD)" value={hourlyRate} onChangeText={setHourlyRate} placeholder="e.g. 75" keyboardType="numeric" />
              <Input label="Years of Experience" value={yearsOfExperience} onChangeText={setYearsOfExperience} placeholder="e.g. 5" keyboardType="numeric" />
              <Input label="Certification" value={certification} onChangeText={setCertification} placeholder="e.g. NCCP Level 2" />
              <Input label="Age (optional)" value={age} onChangeText={setAge} placeholder="Your age" keyboardType="numeric" />

              <Text style={styles.formLabel}>Sport</Text>
              <View style={styles.chipRow}>
                {SPORTS.map(s => (
                  <TouchableOpacity key={s} style={[styles.chip, sport === s && styles.chipActive]} onPress={() => setSport(s)}>
                    <Text style={[styles.chipText, sport === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Coaching Options</Text>
              <View style={styles.chipRow}>
                {COACHING_OPTIONS.map(o => (
                  <TouchableOpacity key={o} style={[styles.chip, coachingOptions.includes(o) && styles.chipActive]} onPress={() => toggleArr(coachingOptions, setCoachingOptions, o)}>
                    <Text style={[styles.chipText, coachingOptions.includes(o) && styles.chipTextActive]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Student Levels</Text>
              <View style={styles.chipRow}>
                {STUDENT_LEVELS.map(l => (
                  <TouchableOpacity key={l} style={[styles.chip, studentLevels.includes(l) && styles.chipActive]} onPress={() => toggleArr(studentLevels, setStudentLevels, l)}>
                    <Text style={[styles.chipText, studentLevels.includes(l) && styles.chipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Gender (optional)</Text>
              <View style={styles.chipRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(gender === g ? '' : g)}>
                    <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.saveActions}>
                <Button title={updateMutation.isPending || uploadingPhoto ? 'Saving...' : 'Save Changes'} onPress={handleSave} loading={updateMutation.isPending || uploadingPhoto} style={styles.saveBtn} />
                <Button title="Cancel" variant="outline" onPress={handleCancel} style={styles.saveBtn} />
              </View>

              <View style={styles.dangerZone}>
                <Text style={styles.dangerTitle}>Danger Zone</Text>
                <Text style={styles.dangerDesc}>Once deleted, your account cannot be recovered.</Text>
                <Button title="Delete Account" variant="destructive" size="sm" onPress={confirmDelete} loading={deleteMutation.isPending} />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  avatarSection: { paddingHorizontal: 20, paddingVertical: 16, gap: 16, alignItems: 'center' },
  editPhotoOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 },
  editPhotoText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  profileInfo: { alignItems: 'center', gap: 6, width: '100%' },
  profileName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  profileEmail: { fontSize: 14, color: Colors.textSecondary },
  profileLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileLocation: { fontSize: 14, color: Colors.textSecondary },
  profileBio: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  form: { paddingHorizontal: 20, gap: 14, paddingBottom: 24 },
  formLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  saveBtn: { flex: 1 },
  dangerZone: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.error + '40', backgroundColor: Colors.error + '08', gap: 8 },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: Colors.error },
  dangerDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
