import { Stack } from 'expo-router';
import { Colors } from '@/theme/colors';

export default function AthleteLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
