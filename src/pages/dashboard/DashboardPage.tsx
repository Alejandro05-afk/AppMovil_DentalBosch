import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, Card } from '@/shared/ui';
import { authService } from '@/entities/auth/api/auth.service';
import { UserProfile } from '@/entities/auth/model/auth.types';
import { authStorage } from '@/shared/api/authStorage';
import { router } from 'expo-router';

export function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await authStorage.removeToken();
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.welcomeText}>Bienvenido de vuelta</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.gray[500]} />
          </TouchableOpacity>
        </View>
        
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.nameText}>
            {profile?.nombre} {profile?.apellido}
          </Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{profile?.rol?.toUpperCase() || 'USUARIO'}</Text>
          </View>
        </Card>
        
        {profile?.rol === 'doctor' && (
          <Card variant="outline" style={styles.dashboardSection}>
            <Text style={styles.sectionTitle}>Panel Médico</Text>
            <Text style={styles.sectionSubtitle}>Aquí podrás gestionar tus pacientes y visualizar tus próximas citas programadas.</Text>
          </Card>
        )}

        {profile?.rol === 'paciente' && (
          <Card variant="outline" style={styles.dashboardSection}>
            <Text style={styles.sectionTitle}>Portal del Paciente</Text>
            <Text style={styles.sectionSubtitle}>Aquí podrás agendar nuevas citas odontológicas y ver tu historial médico.</Text>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  roleTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  roleText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  dashboardSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  }
});
