import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { colors, spacing, Card, Input, LoadingScreen, EmptyState } from '@/shared/ui';
import { authService } from '@/entities/auth/api/auth.service';
import { UserProfile } from '@/entities/auth/model/auth.types';
import { authStorage } from '@/shared/api/authStorage';
import { citasService } from '@/entities/citas/api/citas.service';
import { CitaPaciente } from '@/entities/citas/model/citas.types';
import { MisPacientesList } from '@/features/doctor';

function getEstadoInfo(estado: string | any): { texto: string; color: string } {
  if (typeof estado === 'object' && estado !== null) {
    return { texto: estado.etiqueta || estado.valor, color: estado.color };
  }
  const mapa: Record<string, string> = {
    pendiente: '#f59e0b', confirmada: '#16a34a', finalizada: '#6b7280', cancelada: '#dc2626',
  };
  return { texto: estado, color: mapa[estado] || '#6b7280' };
}

function puedeCancelar(estado: string | any): boolean {
  const str = typeof estado === 'object' ? estado?.valor || '' : estado;
  return ['pendiente', 'confirmada'].includes(str);
}

function CitaCard({ cita, onCancel }: { cita: CitaPaciente; onCancel: () => void }) {
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

      {puedeCancelar(cita.estado) && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.cancelBtnText}>Cancelar cita</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

export function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [citas, setCitas] = useState<CitaPaciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [citasError, setCitasError] = useState('');

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelCita, setCancelCita] = useState<CitaPaciente | null>(null);
  const [motivoCancel, setMotivoCancel] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await authStorage.removeToken();
    router.replace('/(auth)/login');
  };

  const openCancelModal = (cita: CitaPaciente) => {
    setCancelCita(cita);
    setMotivoCancel('');
    setCancelError('');
    setCancelModalVisible(true);
  };

  const handleCancel = async () => {
    if (!cancelCita || !motivoCancel.trim()) {
      setCancelError('Debes ingresar un motivo de cancelación');
      return;
    }
    setCancelLoading(true);
    setCancelError('');
    try {
      await citasService.cancelarCita(cancelCita._id, motivoCancel.trim());
      setCancelModalVisible(false);
      setCancelCita(null);
      setMotivoCancel('');
      fetchData();
    } catch (e: any) {
      const msg = e.response?.data?.mensaje || e.response?.data?.error || e.message || 'Error al cancelar la cita';
      setCancelError(msg);
    } finally {
      setCancelLoading(false);
    }
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
              citas.map((c) => <CitaCard key={c._id} cita={c} onCancel={() => openCancelModal(c)} />)
            )}
          </>
        )}

        {profile?.rol === 'doctor' && (
          <MisPacientesList />
        )}
      </ScrollView>

      <Modal visible={cancelModalVisible} transparent animationType="fade" onRequestClose={() => setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancelar Cita</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} disabled={cancelLoading}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {cancelCita ? (
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <View style={styles.cancelInfoCard}>
                  <Text style={styles.cancelInfoTitle}>
                    {cancelCita.doctor?.usuario?.nombre || cancelCita.doctor?.nombre}{' '}
                    {cancelCita.doctor?.usuario?.apellido || cancelCita.doctor?.apellido}
                  </Text>
                  <View style={styles.cancelInfoRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.gray[500]} />
                    <Text style={styles.cancelInfoText}>
                      {cancelCita.fecha?.split('T')[0]} | {cancelCita.horaInicio} - {cancelCita.horaFin}
                    </Text>
                  </View>
                </View>

                <Input
                  label="Motivo de cancelación"
                  value={motivoCancel}
                  onChangeText={setMotivoCancel}
                  placeholder="Ej: No podré asistir"
                  leftIcon="document-text-outline"
                  multiline
                />

                {cancelError ? (
                  <View style={styles.cancelErrorBox}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={styles.cancelErrorText}>{cancelError}</Text>
                  </View>
                ) : null}

                <View style={styles.cancelActions}>
                  <TouchableOpacity
                    style={styles.cancelSecondaryBtn}
                    onPress={() => setCancelModalVisible(false)}
                    disabled={cancelLoading}
                  >
                    <Text style={styles.cancelSecondaryBtnText}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelPrimaryBtn, cancelLoading && styles.cancelPrimaryBtnDisabled]}
                    onPress={handleCancel}
                    disabled={cancelLoading}
                    activeOpacity={0.7}
                  >
                    {cancelLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={18} color={colors.white} />
                        <Text style={styles.cancelPrimaryBtnText}>Sí, cancelar cita</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger + '30',
    backgroundColor: colors.danger + '08',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  modalBody: {
    gap: spacing.md,
  },
  cancelInfoCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cancelInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  cancelInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cancelInfoText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  cancelErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: 12,
  },
  cancelErrorText: {
    fontSize: 14,
    color: colors.danger,
    flex: 1,
  },
  cancelActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
  },
  cancelSecondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
  cancelPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.danger,
  },
  cancelPrimaryBtnDisabled: {
    opacity: 0.6,
  },
  cancelPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
