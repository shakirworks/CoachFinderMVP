import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/theme/colors';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Coach, CoachMessageThread } from '@/lib/types';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

function MessagesTabIcon({ focused }: { focused: boolean }) {
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
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>💬</Text>
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
    position: 'absolute', top: -4, right: -8,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
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
          title: 'Availability',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => <MessagesTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
