import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
} from 'tamagui';

import { citasService } from '@/entities/citas/api/citas.service';
import { CitaPaciente, DoctorItem } from '@/entities/citas/model/citas.types';
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

const STATUS_LABELS: Record<string, string> = {
  todas: 'Todas las citas',
  pendientes: 'Citas pendientes',
  finalizadas: 'Citas finalizadas',
};

function CitaCard({ cita, doctorMap, onCancel }: { cita: CitaPaciente; doctorMap: Record<string, string>; onCancel: () => void }) {
  const d = cita.doctor || {};
  const nombreMostrar = doctorMap[d._id] || d.nombreCompleto || d.nombre || d.apellido || '';
  const especialidad = d.especialidad || '';
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
              {nombreMostrar || 'Doctor'}
            </Text>
            {especialidad ? (
              <Text color="#64748B" fontSize={13}>
                {especialidad}
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

function getDoctorName(d: DoctorItem | undefined): string {
  if (!d) return '';
  if (d.usuario && typeof d.usuario === 'object' && d.usuario.nombre) return `${d.usuario.nombre} ${d.usuario.apellido || ''}`.trim();
  if (d.nombreCompleto && d.nombreCompleto !== 'Doctor') return d.nombreCompleto;
  if (d.nombre) return `${d.nombre} ${d.apellido || ''}`.trim();
  return '';
}

export function MisCitasPage() {
  const { status } = useLocalSearchParams<{ status: string }>();
  const statusKey = status || 'todas';

  const [citas, setCitas] = useState<CitaPaciente[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({});
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
      const [citasData, doctores] = await Promise.all([
        citasService.obtenerMisCitas({ limit: 50 }),
        citasService.obtenerDoctores(),
      ]);
      const lista = citasData.citas || [];
      const map: Record<string, string> = {};
      for (const d of doctores) {
        const name = getDoctorName(d);
        if (name) map[d._id] = name;
      }
      setDoctorMap(map);
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

  const filteredCitas = useMemo(() => {
    let result = citas;
    if (statusKey === 'pendientes') {
      result = citas.filter((cita) => {
        const texto = getEstadoInfo(cita.estado).texto?.toLowerCase();
        return texto?.includes('pend') || texto === 'confirmada';
      });
    } else if (statusKey === 'finalizadas') {
      result = citas.filter((cita) =>
        getEstadoInfo(cita.estado).texto?.toLowerCase().includes('finaliz')
      );
    }
    return [...result].sort((a, b) => {
      const fechaA = a.fecha?.split('T')[0] || '';
      const fechaB = b.fecha?.split('T')[0] || '';
      if (fechaA !== fechaB) return fechaB.localeCompare(fechaA);
      return (b.horaInicio || '').localeCompare(a.horaInicio || '');
    });
  }, [citas, statusKey]);

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
        <YStack padding="$5" paddingBottom="$8" gap="$4">
          <XStack alignItems="center" gap="$3">
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <YStack flex={1}>
              <Text color="#64748B" fontSize={14} fontWeight="700">
                Mis citas
              </Text>
              <Text color="#0F172A" fontSize={22} fontWeight="900">
                {STATUS_LABELS[statusKey] || 'Citas'}
              </Text>
            </YStack>
            <Text color="#38D6C4" fontSize={13} fontWeight="900">
              {filteredCitas.length} resultado{filteredCitas.length !== 1 ? 's' : ''}
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
          ) : null}

          {!citasError && filteredCitas.length === 0 ? (
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
                {statusKey === 'pendientes'
                  ? 'Sin citas pendientes'
                  : statusKey === 'finalizadas'
                  ? 'Sin citas finalizadas'
                  : 'No tienes citas registradas'}
              </Text>
              <Paragraph color="#64748B" fontSize={14} lineHeight={20} textAlign="center">
                {statusKey === 'pendientes'
                  ? 'No tienes citas programadas. Agenda una para ver el detalle aquí.'
                  : 'No hay citas que mostrar en esta categoría.'}
              </Paragraph>
              {statusKey === 'pendientes' ? (
                <Button
                  backgroundColor="#38D6C4"
                  color="#FFFFFF"
                  borderRadius={14}
                  fontWeight="900"
                  onPress={() => router.push('/(tabs)/agendar')}
                >
                  Agendar cita
                </Button>
              ) : null}
            </Card>
          ) : null}

          {filteredCitas.map((cita) => (
            <CitaCard key={cita._id} cita={cita} doctorMap={doctorMap} onCancel={() => openCancelModal(cita)} />
          ))}
        </YStack>
      </ScrollView>

      <Modal visible={cancelModalVisible} transparent animationType="fade" onRequestClose={() => setCancelModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text color="#0F172A" fontSize={18} fontWeight="900">Cancelar cita</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} disabled={cancelLoading}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {cancelCita ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <YStack backgroundColor="#F8FAFC" borderRadius={14} padding="$4" gap="$2" marginBottom="$4">
                  <Text color="#0F172A" fontSize={16} fontWeight="800">
                    {doctorMap[cancelCita.doctor?._id] || cancelCita.doctor?.nombreCompleto || cancelCita.doctor?.nombre}{' '}
                    {cancelCita.doctor?.apellido || ''}
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
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
