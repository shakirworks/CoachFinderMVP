import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/theme/colors';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Coach, CoachMessageThread } from '@/lib/types';

function MessagesTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const { user, role } = useAuth();
  const coach = role === 'coach' ? (user as Coach) : null;

  const { data: threads } = useQuery<CoachMessageThread[]>({
    queryKey: ['/api/coaches', coach?.id, 'messages'],
    queryFn: () => api.get<CoachMessageThread[]>(`/api/coaches/${coach?.id}/messages`),
    enabled: !!coach?.id,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const unreadTotal = (threads || []).reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  return (
    <View style={iconStyles.wrapper}>
      <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />
      {unreadTotal > 0 && (
        <View style={iconStyles.badge}>
          <Text style={iconStyles.badgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
        </View>
      )}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -10,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});

export default function CoachDashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="availability"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused, color }) => <MessagesTabIcon focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
