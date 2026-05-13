import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/theme/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Avatar from '@/components/Avatar';
import { api, uploadPhoto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Athlete, Coach } from '@/lib/types';

const SPORTS = ['Soccer', 'Tennis', 'Golf', 'Pickleball', 'Skiing', 'Baseball', 'Personal Training'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COACHING_OPTIONS = ['Adults', 'Kids', 'Groups'];
const STUDENT_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function ProfileSetup() {
  const router = useRouter();
  const { role, email, token } = useLocalSearchParams<{ role: 'athlete' | 'coach'; email?: string; token?: string }>();
  const { setUserLocally } = useAuth();

  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Athlete fields
  const [skillLevel, setSkillLevel] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [preferredCoachGender, setPreferredCoachGender] = useState('');

  // Coach fields
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [certification, setCertification] = useState('');
  const [selectedCoachingOptions, setSelectedCoachingOptions] = useState<string[]>([]);
  const [selectedStudentLevels, setSelectedStudentLevels] = useState<string[]>([]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      setUploadingPhoto(true);
      try {
        const { url } = await uploadPhoto(uri);
        setProfileImageUrl(url);
      } catch {
        Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
        setProfileImage(null);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const toggleOption = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (!sport) { Alert.alert('Error', 'Sport is required'); return; }
    if (!location.trim()) { Alert.alert('Error', 'Location is required'); return; }
    if (!email) { Alert.alert('Error', 'Email is missing. Please go back and try again.'); return; }

    setLoading(true);
    try {
      const body: Record<string, any> = {
        name: name.trim(),
        sport,
        location: location.trim(),
        email,
        verificationToken: token,
        password: 'placeholder',
      };
      if (profileImageUrl) body.profileImage = profileImageUrl;

      let user: Athlete | Coach;
      if (role === 'athlete') {
        if (skillLevel) body.skillLevel = skillLevel;
        if (gender) body.gender = gender;
        if (age) body.age = age;
        if (preferredCoachGender) body.preferredCoachGender = preferredCoachGender;
        user = await api.post<Athlete>('/api/athletes', body);
        await setUserLocally(user, 'athlete');
        router.replace('/(athlete)/coaches');
      } else {
        if (bio) body.bio = bio;
        if (hourlyRate) body.hourlyRate = hourlyRate;
        if (yearsOfExperience) body.yearsOfExperience = yearsOfExperience;
        if (certification) body.certification = certification;
        if (selectedCoachingOptions.length > 0) body.coachingOptions = selectedCoachingOptions;
        if (selectedStudentLevels.length > 0) body.studentLevels = selectedStudentLevels;
        user = await api.post<Coach>('/api/coaches', body);
        await setUserLocally(user, 'coach');
        router.replace('/(coach)/dashboard/availability');
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Button title="Back" variant="ghost" size="sm" onPress={() => router.back()} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Set up your {role} profile to get started</Text>

            <TouchableOpacity style={styles.avatarContainer} onPress={pickPhoto}>
              <Avatar name={name || '?'} imageUri={profileImage} size={80} />
              <View style={styles.avatarOverlay}>
                <Text style={styles.avatarOverlayText}>{uploadingPhoto ? '...' : 'Edit'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.form}>
              <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Smith" autoCapitalize="words" />
              <Input label="Location" value={location} onChangeText={setLocation} placeholder="Toronto, ON" autoCapitalize="words" />

              <Text style={styles.sectionLabel}>Sport</Text>
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

              {role === 'athlete' && (
                <>
                  <Text style={styles.sectionLabel}>Skill Level</Text>
                  <View style={styles.chipRow}>
                    {SKILL_LEVELS.map(l => (
                      <TouchableOpacity key={l} style={[styles.chip, skillLevel === l && styles.chipActive]} onPress={() => setSkillLevel(l)}>
                        <Text style={[styles.chipText, skillLevel === l && styles.chipTextActive]}>{l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.sectionLabel}>Gender</Text>
                  <View style={styles.chipRow}>
                    {GENDERS.map(g => (
                      <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                        <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Input label="Age (optional)" value={age} onChangeText={setAge} placeholder="e.g. 28" keyboardType="numeric" />
                </>
              )}

              {role === 'coach' && (
                <>
                  <Input label="Bio (optional)" value={bio} onChangeText={setBio} placeholder="Tell athletes about yourself..." multiline numberOfLines={3} />
                  <Input label="Hourly Rate ($CAD)" value={hourlyRate} onChangeText={setHourlyRate} placeholder="e.g. 75" keyboardType="numeric" />
                  <Input label="Years of Experience" value={yearsOfExperience} onChangeText={setYearsOfExperience} placeholder="e.g. 5" keyboardType="numeric" />
                  <Input label="Certification (optional)" value={certification} onChangeText={setCertification} placeholder="e.g. NCCP Level 2" />

                  <Text style={styles.sectionLabel}>Coaching Options</Text>
                  <View style={styles.chipRow}>
                    {COACHING_OPTIONS.map(o => (
                      <TouchableOpacity
                        key={o}
                        style={[styles.chip, selectedCoachingOptions.includes(o) && styles.chipActive]}
                        onPress={() => toggleOption(selectedCoachingOptions, setSelectedCoachingOptions, o)}
                      >
                        <Text style={[styles.chipText, selectedCoachingOptions.includes(o) && styles.chipTextActive]}>{o}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Student Levels</Text>
                  <View style={styles.chipRow}>
                    {STUDENT_LEVELS.map(l => (
                      <TouchableOpacity
                        key={l}
                        style={[styles.chip, selectedStudentLevels.includes(l) && styles.chipActive]}
                        onPress={() => toggleOption(selectedStudentLevels, setSelectedStudentLevels, l)}
                      >
                        <Text style={[styles.chipText, selectedStudentLevels.includes(l) && styles.chipTextActive]}>{l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Button title="Create Account" onPress={handleCreate} loading={loading} style={styles.submitBtn} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  content: { paddingHorizontal: 24, paddingTop: 20, gap: 18 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: -8 },
  avatarContainer: { alignSelf: 'center', marginVertical: 8 },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  avatarOverlayText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  form: { gap: 14 },
  submitBtn: { marginTop: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
});
