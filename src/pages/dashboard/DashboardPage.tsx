import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import {
  Button,
  Card,
  H2,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
} from 'tamagui';

import { authService } from '@/entities/auth/api/auth.service';
import { UserProfile } from '@/entities/auth/model/auth.types';
import { citasService } from '@/entities/citas/api/citas.service';
import { CitaPaciente } from '@/entities/citas/model/citas.types';
import { MisPacientesList } from '@/features/doctor';
import { authStorage } from '@/shared/api/authStorage';
import { colors, Input, LoadingScreen, spacing } from '@/shared/ui';

function getEstadoInfo(estado: string | any): { texto: string; color: string } {
  if (typeof estado === 'object' && estado !== null) {
    return { texto: estado.etiqueta || estado.valor, color: estado.color };
  }
  const mapa: Record<string, string> = {
    pendiente: '#f59e0b',
    confirmada: '#16a34a',
    finalizada: '#6b7280',
    cancelada: '#dc2626',
  };
  return { texto: estado, color: mapa[estado] || '#6b7280' };
}

function puedeCancelar(estado: string | any): boolean {
  const str = typeof estado === 'object' ? estado?.valor || '' : estado;
  return ['pendiente', 'confirmada'].includes(str);
}

function CitaCard({ cita, onCancel }: { cita: CitaPaciente; onCancel: () => void }) {
  const doctorNombre = cita.doctor?.usuario?.nombre || cita.doctor?.nombre || '';
  const doctorApellido = cita.doctor?.usuario?.apellido || cita.doctor?.apellido || '';
  const fechaSolo = cita.fecha?.split('T')[0] || cita.fecha;
  const est = getEstadoInfo(cita.estado);

  return (
    <Card
      elevate
      bordered
      backgroundColor="#FFFFFF"
      borderColor="#E2E8F0"
      borderRadius={18}
      padding="$4"
      gap="$3"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <XStack flex={1} alignItems="center" gap="$3">
          <YStack
            width={42}
            height={42}
            borderRadius={14}
            alignItems="center"
            justifyContent="center"
            backgroundColor="#FFF0F7"
          >
            <Ionicons name="medkit-outline" size={20} color="#FF4FA3" />
          </YStack>
          <YStack flex={1} gap="$1">
            <Text color="#0F172A" fontSize={16} fontWeight="800">
              {doctorNombre} {doctorApellido}
            </Text>
            {cita.doctor?.especialidad ? (
              <Text color="#64748B" fontSize={13}>
                {cita.doctor.especialidad}
              </Text>
            ) : null}
          </YStack>
        </XStack>

        <YStack
          backgroundColor={`${est.color}20`}
          borderRadius={999}
          paddingHorizontal="$3"
          paddingVertical="$1"
        >
          <Text color={est.color} fontSize={12} fontWeight="800" textTransform="capitalize">
            {est.texto}
          </Text>
        </YStack>
      </XStack>

      <Separator borderColor="#E2E8F0" />

      <XStack gap="$3" flexWrap="wrap">
        <XStack alignItems="center" gap="$2">
          <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
          <Text color="#475569" fontSize={13}>{fechaSolo}</Text>
        </XStack>
        <XStack alignItems="center" gap="$2">
          <Ionicons name="time-outline" size={16} color="#94A3B8" />
          <Text color="#475569" fontSize={13}>{cita.horaInicio} - {cita.horaFin}</Text>
        </XStack>
      </XStack>

      <XStack alignItems="flex-start" gap="$2">
        <Ionicons name="document-text-outline" size={16} color="#94A3B8" />
        <Text flex={1} color="#475569" fontSize={13} lineHeight={18}>
          {cita.motivo}
        </Text>
      </XStack>

      {puedeCancelar(cita.estado) ? (
        <Button
          borderRadius={12}
          backgroundColor="#FEF2F2"
          borderColor="#FECACA"
          borderWidth={1}
          color="#DC2626"
          fontWeight="800"
          icon={<Ionicons name="close-circle-outline" size={18} color="#DC2626" />}
          onPress={onCancel}
          pressStyle={{ opacity: 0.86, scale: 0.98 }}
        >
          Cancelar cita
        </Button>
      ) : null}
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

  const stats = useMemo(() => {
    const pendientes = citas.filter((cita) => getEstadoInfo(cita.estado).texto?.toLowerCase().includes('pend')).length;
    const confirmadas = citas.filter((cita) => getEstadoInfo(cita.estado).texto?.toLowerCase().includes('confirm')).length;
    return [
      { label: 'Citas', value: String(citas.length), color: '#FF4FA3' },
      { label: 'Pendientes', value: String(pendientes), color: '#F59E0B' },
      { label: 'Confirmadas', value: String(confirmadas), color: '#38D6C4' },
    ];
  }, [citas]);

  if (isLoading) {
    return <LoadingScreen message="Cargando..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <YStack padding="$5" paddingBottom="$8" gap="$5">
          <XStack alignItems="center" justifyContent="space-between" gap="$3">
            <YStack flex={1}>
              <Text color="#64748B" fontSize={14} fontWeight="700">
                Bienvenido de vuelta
              </Text>
              <Text color="#0F172A" fontSize={24} fontWeight="900" numberOfLines={1}>
                {profile?.nombre} {profile?.apellido}
              </Text>
            </YStack>
            <Button
              circular
              size="$4"
              backgroundColor="#FFFFFF"
              borderColor="#E2E8F0"
              borderWidth={1}
              icon={<Ionicons name="log-out-outline" size={22} color="#64748B" />}
              onPress={handleLogout}
              pressStyle={{ opacity: 0.8, scale: 0.96 }}
            />
          </XStack>

          <Card
            elevate
            bordered
            backgroundColor="#FFFFFF"
            borderColor="#E2E8F0"
            borderRadius={24}
            overflow="hidden"
            padding="$5"
            gap="$4"
          >
            <XStack alignItems="center" gap="$4" flexWrap="wrap">
              <YStack width={130} height={120} alignItems="center" justifyContent="center">
                <LottieView
                  source={require('../../../assets/lottie/dental-pulse.json')}
                  autoPlay
                  loop
                  style={{ width: 160, height: 120 }}
                />
              </YStack>
              <YStack flex={1} minWidth={170} gap="$2">
                <Text color="#FF4FA3" fontSize={12} fontWeight="900">
                  DENTALBOSCH
                </Text>
                <H2 color="#0F172A" fontSize={27} lineHeight={31}>
                  Tu agenda clinica, lista para hoy
                </H2>
                <Paragraph color="#64748B" fontSize={14} lineHeight={20}>
                  Revisa tus citas, confirma horarios y mantén tu consultorio al día.
                </Paragraph>
              </YStack>
            </XStack>

            {profile?.rol === 'paciente' ? (
              <Button
                backgroundColor="#FF4FA3"
                color="#FFFFFF"
                borderRadius={14}
                fontWeight="900"
                iconAfter={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                onPress={() => router.push('/(tabs)/agendar')}
                pressStyle={{ opacity: 0.88, scale: 0.98 }}
              >
                Agendar nueva cita
              </Button>
            ) : null}
          </Card>

          <XStack gap="$3" flexWrap="wrap">
            {stats.map((item) => (
              <Card
                key={item.label}
                flex={1}
                minWidth={98}
                backgroundColor="#FFFFFF"
                borderColor="#E2E8F0"
                borderRadius={18}
                borderWidth={1}
                padding="$4"
                gap="$1"
              >
                <Text color={item.color} fontSize={25} fontWeight="900">
                  {item.value}
                </Text>
                <Text color="#64748B" fontSize={12} fontWeight="800">
                  {item.label}
                </Text>
              </Card>
            ))}
          </XStack>

          {profile?.rol === 'paciente' ? (
            <YStack gap="$3">
              <XStack alignItems="center" justifyContent="space-between">
                <Text color="#0F172A" fontSize={19} fontWeight="900">
                  Mis citas programadas
                </Text>
                <Text color="#38D6C4" fontSize={13} fontWeight="900">
                  {citas.length} total
                </Text>
              </XStack>

              {citasError ? (
                <Card
                  backgroundColor="#FEF2F2"
                  borderColor="#FECACA"
                  borderRadius={16}
                  borderWidth={1}
                  padding="$4"
                >
                  <XStack alignItems="center" gap="$3">
                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    <Text flex={1} color="#DC2626" fontSize={14}>{citasError}</Text>
                  </XStack>
                </Card>
              ) : citas.length === 0 ? (
                <Card
                  backgroundColor="#FFFFFF"
                  borderColor="#E2E8F0"
                  borderRadius={20}
                  borderWidth={1}
                  padding="$5"
                  gap="$3"
                  alignItems="center"
                >
                  <YStack
                    width={64}
                    height={64}
                    borderRadius={22}
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor="#ECFEFF"
                  >
                    <Ionicons name="calendar-outline" size={30} color="#38D6C4" />
                  </YStack>
                  <Text color="#0F172A" fontSize={18} fontWeight="900" textAlign="center">
                    Sin citas pendientes
                  </Text>
                  <Text color="#64748B" fontSize={14} lineHeight={20} textAlign="center">
                    No tienes citas programadas. Agenda una ahora para ver el detalle aquí.
                  </Text>
                  <Button
                    backgroundColor="#38D6C4"
                    color="#FFFFFF"
                    borderRadius={14}
                    fontWeight="900"
                    onPress={() => router.push('/(tabs)/agendar')}
                  >
                    Agendar cita
                  </Button>
                </Card>
              ) : (
                citas.map((cita) => (
                  <CitaCard key={cita._id} cita={cita} onCancel={() => openCancelModal(cita)} />
                ))
              )}
            </YStack>
          ) : null}

          {profile?.rol === 'doctor' ? (
            <Card
              backgroundColor="#FFFFFF"
              borderColor="#E2E8F0"
              borderRadius={20}
              borderWidth={1}
              padding="$4"
              gap="$3"
            >
              <Text color="#0F172A" fontSize={19} fontWeight="900">
                Mis pacientes
              </Text>
              <MisPacientesList />
            </Card>
          ) : null}
        </YStack>
      </ScrollView>

      <Modal visible={cancelModalVisible} transparent animationType="fade" onRequestClose={() => setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text color="#0F172A" fontSize={18} fontWeight="900">Cancelar cita</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} disabled={cancelLoading}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {cancelCita ? (
              <View>
                <YStack backgroundColor="#F8FAFC" borderRadius={14} padding="$4" gap="$2" marginBottom="$4">
                  <Text color="#0F172A" fontSize={16} fontWeight="800">
                    {cancelCita.doctor?.usuario?.nombre || cancelCita.doctor?.nombre}{' '}
                    {cancelCita.doctor?.usuario?.apellido || cancelCita.doctor?.apellido}
                  </Text>
                  <XStack alignItems="center" gap="$2">
                    <Ionicons name="calendar-outline" size={14} color={colors.gray[500]} />
                    <Text color="#64748B" fontSize={14}>
                      {cancelCita.fecha?.split('T')[0]} | {cancelCita.horaInicio} - {cancelCita.horaFin}
                    </Text>
                  </XStack>
                </YStack>

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
                    <Text color={colors.danger} flex={1} fontSize={14}>{cancelError}</Text>
                  </View>
                ) : null}

                <View style={styles.cancelActions}>
                  <TouchableOpacity
                    style={styles.cancelSecondaryBtn}
                    onPress={() => setCancelModalVisible(false)}
                    disabled={cancelLoading}
                  >
                    <Text color={colors.gray[600]} fontSize={15} fontWeight="800">Volver</Text>
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
                        <Text color={colors.white} fontSize={15} fontWeight="900">Sí, cancelar cita</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: '#F8FAFC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
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
  cancelErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  cancelActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
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
});
