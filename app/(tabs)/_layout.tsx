import { Tabs, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/ui/theme';
import { authService } from '@/entities/auth/api/auth.service';
import { onboardingStorage } from '@/shared/lib/onboardingStorage';
import { useAuth } from '@/shared/contexts/AuthContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const perfil = await authService.getProfile();
        const userId = perfil.email || perfil.nombre || '';
        const done = await onboardingStorage.isCompleted(userId);
        if (!done) {
          router.replace({
            pathname: '/onboarding',
            params: { userId, rol: perfil.rol },
          });
          return;
        }
      } catch {
      } finally {
        setChecked(true);
      }
    })();
  }, [isAuthenticated]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (!checked) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agendar"
        options={{
          title: 'Citas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}