import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

export default function Index() {
  const { authenticated, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (authenticated) {
      if (role === 'athlete') router.replace('/(athlete)/coaches');
      else if (role === 'coach') router.replace('/(coach)/dashboard/availability');
    } else {
      router.replace('/onboarding');
    }
  }, [authenticated, role, loading]);

  return <LoadingScreen message="Loading CoachFinders…" />;
}
