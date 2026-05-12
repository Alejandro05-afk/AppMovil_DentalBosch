import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, Card, LoadingScreen, EmptyState } from '@/shared/ui';
import { authService } from '@/entities/auth/api/auth.service';
import { UserProfile } from '@/entities/auth/model/auth.types';
import { authStorage } from '@/shared/api/authStorage';
import { citasService } from '@/entities/citas/api/citas.service';
import { CitaPaciente } from '@/entities/citas/model/citas.types';

function getEstadoInfo(estado: string | any): { texto: string; color: string } {
  if (typeof estado === 'object' && estado !== null) {
    return { texto: estado.etiqueta || estado.valor, color: estado.color };
  }
  const mapa: Record<string, string> = {
    pendiente: '#f59e0b', confirmada: '#16a34a', finalizada: '#6b7280', cancelada: '#dc2626',
  };
  return { texto: estado, color: mapa[estado] || '#6b7280' };
}

function CitaCard({ cita }: { cita: CitaPaciente }) {
  const doctorNombre =
    cita.doctor?.usuario?.nombre || cita.doctor?.nombre || '';
  const doctorApellido =
    cita.doctor?.usuario?.apellido || cita.doctor?.apellido || '';
  const fechaSolo = cita.fecha?.split('T')[0] || cita.fecha;
  const est = getEstadoInfo(cita.estado);

  return (
    <Card variant="elevated" style={styles.citaCard}>
      <View style={styles.citaHeader}>
        <View style={styles.citaDoctor}>
          <Ionicons name="medkit-outline" size={20} color={colors.primary} />
          <Text style={styles.citaDoctorName}>
            {doctorNombre} {doctorApellido}
          </Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: est.color + '20' }]}>
          <Text style={[styles.estadoText, { color: est.color }]}>{est.texto}</Text>
        </View>
      </View>

      {cita.doctor?.especialidad ? (
        <Text style={styles.especialidadText}>{cita.doctor.especialidad}</Text>
      ) : null}

      <View style={styles.citaDetalles}>
        <View style={styles.detalleRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.gray[400]} />
          <Text style={styles.detalleText}>{fechaSolo}</Text>
        </View>
        <View style={styles.detalleRow}>
          <Ionicons name="time-outline" size={16} color={colors.gray[400]} />
          <Text style={styles.detalleText}>
            {cita.horaInicio} - {cita.horaFin}
          </Text>
        </View>
        <View style={styles.detalleRow}>
          <Ionicons name="document-text-outline" size={16} color={colors.gray[400]} />
          <Text style={styles.detalleText}>{cita.motivo}</Text>
        </View>
      </View>
    </Card>
  );
}

export function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [citas, setCitas] = useState<CitaPaciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [citasError, setCitasError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const perfil = await authService.getProfile();
      setProfile(perfil);
    } catch {
      // si falla el perfil, no bloqueamos
    }

    try {
      const citasData = await citasService.obtenerMisCitas({ limit: 50 });
      const lista = citasData.citas || [];
      setCitas(lista);
      setCitasError('');
    } catch (e: any) {
      const msg = e.response?.data?.mensaje || e.response?.data?.error || e.message || 'Error al cargar citas';
      setCitasError(msg);
      setCitas([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await authStorage.removeToken();
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.welcomeText}>Bienvenido de vuelta</Text>
            <Text style={styles.nameHeader}>
              {profile?.nombre} {profile?.apellido}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.gray[500]} />
          </TouchableOpacity>
        </View>

        {profile?.rol === 'paciente' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Citas Programadas</Text>
              <Text style={styles.sectionCount}>{citas.length}</Text>
            </View>

            {citasError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorBannerText}>{citasError}</Text>
              </View>
            ) : citas.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="Sin citas pendientes"
                message="No tienes citas programadas. Agenda una ahora."
                actionLabel="Agendar cita"
                onAction={() => router.push('/(tabs)/agendar')}
              />
            ) : (
              citas.map((c) => <CitaCard key={c._id} cita={c} />)
            )}
          </>
        )}

        {profile?.rol === 'doctor' && (
          <Card variant="outline" style={styles.cardPlaceholder}>
            <Text style={styles.sectionTitle}>Panel Médico</Text>
            <Text style={styles.sectionSubtitle}>
              Aquí podrás gestionar tus pacientes y visualizar tus próximas citas
              programadas.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  nameHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 2,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  citaCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  citaDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  citaDoctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  especialidadText: {
    fontSize: 13,
    color: colors.gray[500],
    marginLeft: 28,
    marginBottom: spacing.sm,
  },
  citaDetalles: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detalleText: {
    fontSize: 14,
    color: colors.gray[600],
    flex: 1,
  },
  cardPlaceholder: {
    padding: spacing.lg,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: 12,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
});
