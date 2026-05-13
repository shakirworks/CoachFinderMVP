import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/theme/colors';
import { getAbsoluteUrl } from '@/lib/api';
import type { Coach } from '@/lib/types';

interface Props {
  coach: Coach;
  onPress: () => void;
}

export default function CoachCard({ coach, onPress }: Props) {
  const initials = coach.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rate = coach.hourlyRate ? `$${coach.hourlyRate}/hr` : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatarContainer}>
        {coach.profileImage ? (
          <Image source={{ uri: getAbsoluteUrl(coach.profileImage) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{coach.name}</Text>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{coach.sport}</Text>
          </View>
          {coach.yearsOfExperience ? (
            <View style={[styles.tag, styles.tagOutline]}>
              <Text style={styles.tagOutlineText}>{coach.yearsOfExperience} yrs exp</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.location} numberOfLines={1}>{coach.location}</Text>
        <View style={styles.footer}>
          {rate ? (
            <Text style={styles.rate}>{rate}</Text>
          ) : null}
          {coach.studentLevels && coach.studentLevels.length > 0 ? (
            <Text style={styles.levels} numberOfLines={1}>
              {coach.studentLevels.slice(0, 2).join(' · ')}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  avatarContainer: {},
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  info: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  tagOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagOutlineText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  rate: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  levels: {
    fontSize: 12,
    color: Colors.textTertiary,
    flex: 1,
    textAlign: 'right',
  },
});
