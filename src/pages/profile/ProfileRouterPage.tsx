import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '@/entities/auth/api/auth.service';
import { authStorage } from '@/shared/api/authStorage';
import { ProfilePage } from './ProfilePage';
import { DoctorProfilePage } from '../doctor/DoctorProfilePage';
import { colors } from '@/shared/ui';

export function ProfileRouterPage() {
  const [rol, setRol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRol = async () => {
      try {
        const data = await authService.getProfile();
        setRol(data.rol);
      } catch {
        await authStorage.removeToken();
        router.replace('/(auth)/login');
        return;
      } finally {
        setIsLoading(false);
      }
    };
    fetchRol();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (rol === 'doctor') {
    return <DoctorProfilePage />;
  }

  return <ProfilePage />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBg,
  },
});
