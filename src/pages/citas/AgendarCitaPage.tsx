import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/entities/auth/api/auth.service';
import { citasService } from '@/entities/citas/api/citas.service';
import { DoctorItem } from '@/entities/citas/model/citas.types';
import { apiClient } from '@/shared/api/apiClient';
import { Button, Card, Input, DatePicker, LoadingScreen, ErrorScreen, colors, spacing } from '@/shared/ui';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const SLOT_DURACION = 60;

function generarSlots(inicio: string, fin: string): string[] {
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);
  const startMin = hI * 60 + mI;
  const endMin = hF * 60 + mF;
  const slots: string[] = [];
  for (let m = startMin; m + SLOT_DURACION <= endMin; m += SLOT_DURACION) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function AgendarCitaPage() {
  const [pageState, setPageState] = useState<'loading' | 'no-acceso' | 'error' | 'ready'>('loading');
  const [pacienteId, setPacienteId] = useState('');
  const [doctores, setDoctores] = useState<DoctorItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pageError, setPageError] = useState('');

  const [doctorSel, setDoctorSel] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [focusCount, setFocusCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusCount((c) => c + 1);
    }, [])
  );

  useEffect(() => {
    if (focusCount > 1 && pageState === 'ready') {
      setDoctorSel('');
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setMotivo('');
      setSelectedSlot('');
      setAvailableSlots([]);
      setOccupiedSlots([]);
      setFeedback(null);
    }
  }, [focusCount, pageState]);

  const cargarDatos = async () => {
    setPageState('loading');
    setPageError('');
    try {
      const perfil = await authService.getProfile();
      if (perfil.rol !== 'paciente') {
        setPageState('no-acceso');
        return;
      }

      const pacResp = await apiClient.get<any>('/pacientes/perfil/paciente');
      const pacData = pacResp.data?.datos || pacResp.data?.data || pacResp.data;
      const idPaciente = pacData._id || pacData.id || '';
      if (!idPaciente) throw new Error('No se pudo obtener el ID del paciente');
      setPacienteId(idPaciente);

      const lista = await citasService.obtenerDoctores();
      setDoctores(lista);
      setPageState('ready');
    } catch (e: any) {
      setPageError(e.response?.data?.mensaje || e.message || 'Error al cargar los datos');
      setPageState('error');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pageState === 'ready') {
        setDoctorSel('');
        setFecha('');
        setHoraInicio('');
        setHoraFin('');
        setMotivo('');
        setSelectedSlot('');
        setAvailableSlots([]);
        setOccupiedSlots([]);
        setFeedback(null);
      }
    }, [pageState])
  );

  const cargarSlots = useCallback(async () => {
    if (!doctorSel || !fecha) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    setHoraInicio('');
    setHoraFin('');
    setSlotsMessage('');
    setAvailableSlots([]);
    setOccupiedSlots([]);

    try {
      const docData = doctores.find((d) => d._id === doctorSel) as any;
      const horarios: any[] = docData?.horarioAtencion || [];

      if (!horarios || horarios.length === 0) {
        setSlotsMessage('Horario del doctor no disponible');
        return;
      }

      const dateObj = new Date(fecha + 'T12:00:00');
      const diaSemana = DIAS[dateObj.getDay()];
      const horarioHoy = horarios.find((h: any) => h.dia === diaSemana);

      if (!horarioHoy || !horarioHoy.disponible) {
        setSlotsMessage('El doctor no atiende este día');
        return;
      }

      const slots = generarSlots(horarioHoy.horaInicio, horarioHoy.horaFin);

      if (slots.length === 0) {
        setSlotsMessage('No hay horarios disponibles para esta fecha');
        setAvailableSlots(slots);
        return;
      }

      let ocupados: string[] = [];
      try {
        ocupados = await citasService.obtenerSlotsOcupados(doctorSel, fecha);
      } catch (e) {
        console.warn('Error al obtener slots ocupados:', e);
      }

      const hoy = new Date();
      const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      if (fecha === hoyStr) {
        const horaActual = hoy.getHours();
        const minActual = hoy.getMinutes();
        const ahoraMin = horaActual * 60 + minActual;
        ocupados = ocupados.concat(
          slots.filter((s) => {
            const [h, m] = s.split(':').map(Number);
            return h * 60 + m < ahoraMin;
          })
        );
      }
      setOccupiedSlots(ocupados);
      setAvailableSlots(slots);
    } catch (e: any) {
      const msg = e.response?.data?.mensaje || e.response?.data?.error || e.message || 'Error al cargar horarios disponibles';
      setSlotsMessage(msg);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorSel, fecha, doctores]);

  useEffect(() => {
    cargarSlots();
  }, [cargarSlots]);

  const handleSlotSelect = (slot: string) => {
    if (occupiedSlots.includes(slot)) return;
    setSelectedSlot(slot);
    setHoraInicio(slot);
    setHoraFin(sumarMinutos(slot, SLOT_DURACION));
    setFeedback(null);
  };

  const handleAgendar = async () => {
    setFeedback(null);

    if (!doctorSel || !fecha || !horaInicio || !horaFin || !motivo) {
      setFeedback({ type: 'error', message: 'Todos los campos son obligatorios' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setFeedback({ type: 'error', message: 'Formato de fecha inválido' });
      return;
    }

    setIsLoading(true);

    try {
      await citasService.agendarCita({
        paciente: pacienteId,
        doctor: doctorSel,
        fecha,
        horaInicio,
        horaFin,
        motivo,
      });
      setFeedback({ type: 'success', message: 'Cita agendada correctamente' });
      setTimeout(() => router.replace('/'), 1500);
    } catch (error: any) {
      const msg = error.response?.data?.mensaje || 'No se pudo agendar la cita';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  if (pageState === 'loading') {
    return <LoadingScreen message="Verificando acceso..." fullScreen />;
  }

  if (pageState === 'no-acceso') {
    return (
      <View style={styles.fullScreenCenter}>
        <Ionicons name="lock-closed" size={48} color={colors.gray[300]} />
        <Text style={styles.notAccessTitle}>Acceso denegado</Text>
        <Text style={styles.notAccessMsg}>Solo los pacientes pueden agendar citas</Text>
        <Button label="Volver al inicio" variant="primary" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  if (pageState === 'error') {
    return (
      <ErrorScreen
        title="Error de conexión"
        message={pageError}
        fullScreen
        onRetry={cargarDatos}
      />
    );
  }

  const doctorSelObj = doctores.find((d) => d._id === doctorSel);
  const getDoctorName = (d: DoctorItem | undefined) => {
    if (!d) return '(sin nombre)';
    if (d.usuario?.nombre) return `${d.usuario.nombre} ${d.usuario.apellido || ''}`.trim();
    if (d.nombreCompleto) return d.nombreCompleto;
    if (d.nombre) return `${d.nombre} ${d.apellido || ''}`.trim();
    return '(sin nombre)';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Cita</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Card variant="elevated" style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Nueva Cita</Text>
            </View>

            <Text style={styles.label}>Doctor</Text>
            <TouchableOpacity style={styles.pickerInput} onPress={() => setShowPicker(!showPicker)}>
              <Ionicons name="medkit-outline" size={20} color={colors.gray[400]} />
              <Text style={[styles.pickerText, !doctorSelObj && styles.pickerPlaceholder]}>
                {doctorSelObj ? getDoctorName(doctorSelObj) : 'Seleccionar doctor'}
              </Text>
              <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gray[400]} />
            </TouchableOpacity>

            {showPicker && (
              <View style={styles.pickerSheet}>
                <View style={styles.pickerSheetHeader}>
                  <Text style={styles.pickerSheetTitle}>Seleccionar doctor</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Ionicons name="close" size={24} color={colors.dark} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerList}>
                  {doctores.map((d) => (
                    <TouchableOpacity
                      key={d._id}
                      style={[styles.pickerOption, doctorSel === d._id && styles.pickerOptionSel]}
                      onPress={() => {
                        setDoctorSel(d._id);
                        setShowPicker(false);
                      }}
                    >
                      <Ionicons
                        name={doctorSel === d._id ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={doctorSel === d._id ? colors.primary : colors.gray[400]}
                      />
                      <View style={styles.pickerOptionContent}>
                        <Text style={styles.pickerOptionText}>{getDoctorName(d)}</Text>
                        {d.especialidad ? (
                          <Text style={styles.pickerOptionSub}>{d.especialidad}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <DatePicker
              label="Fecha"
              value={fecha}
              onChange={(v) => {
                setFecha(v);
                setFeedback(null);
              }}
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 365.25 * 3 * 24 * 60 * 60 * 1000)}
            />

            {doctorSel && fecha ? (
              <>
                <Text style={styles.label}>Horario disponible</Text>
                {loadingSlots ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.slotsLoader} />
                ) : slotsMessage ? (
                  <View style={styles.slotsMessageBox}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.gray[400]} />
                    <Text style={styles.slotsMessageText}>{slotsMessage}</Text>
                  </View>
                ) : availableSlots.length > 0 ? (
                  <View style={styles.slotsGrid}>
                    {availableSlots.map((slot) => {
                      const isOccupied = occupiedSlots.includes(slot);
                      const isSelected = slot === selectedSlot;
                      return (
                        <TouchableOpacity
                          key={slot}
                          disabled={isOccupied}
                          style={[
                            styles.slotChip,
                            isSelected && styles.slotChipSelected,
                            isOccupied && styles.slotChipOccupied,
                          ]}
                          onPress={() => handleSlotSelect(slot)}
                          activeOpacity={isOccupied ? 1 : 0.7}
                        >
                          <Ionicons
                            name={isOccupied ? 'lock-closed' : isSelected ? 'checkmark-circle' : 'time-outline'}
                            size={16}
                            color={isOccupied ? colors.gray[300] : isSelected ? colors.white : colors.primary}
                          />
                          <Text
                            style={[
                              styles.slotChipText,
                              isSelected && styles.slotChipTextSelected,
                              isOccupied && styles.slotChipTextOccupied,
                            ]}
                          >
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                {selectedSlot ? (
                  <View style={styles.slotSummary}>
                    <Ionicons name="time-outline" size={16} color={colors.secondary} />
                    <Text style={styles.slotSummaryText}>
                      {horaInicio} — {horaFin} ({SLOT_DURACION} min)
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}

            <Input
              label="Motivo"
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Motivo de la cita"
              leftIcon="document-text-outline"
            />
          </Card>

          {feedback && (
            <View style={[styles.feedback, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
              <Ionicons
                name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={feedback.type === 'success' ? '#16a34a' : '#dc2626'}
              />
              <Text style={[styles.feedbackText, { color: feedback.type === 'success' ? '#16a34a' : '#dc2626' }]}>
                {feedback.message}
              </Text>
            </View>
          )}

          <Button
            label={isLoading ? 'Agendando...' : 'Agendar Cita'}
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleAgendar}
            icon={isLoading ? undefined : 'calendar-outline'}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  card: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: colors.dark,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 52,
    borderColor: colors.gray[300],
    marginBottom: 16,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    marginLeft: 10,
  },
  pickerPlaceholder: {
    color: colors.gray[400],
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pickerSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  pickerList: {
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pickerOptionSel: {
    backgroundColor: colors.primary + '08',
    borderRadius: 8,
  },
  pickerOptionContent: {
    flex: 1,
  },
  pickerOptionText: {
    fontSize: 15,
    color: colors.dark,
  },
  pickerOptionSub: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  slotsLoader: {
    marginVertical: spacing.lg,
  },
  slotsMessageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  slotsMessageText: {
    fontSize: 14,
    color: colors.gray[500],
    flex: 1,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    backgroundColor: colors.white,
  },
  slotChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotChipOccupied: {
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
    opacity: 0.55,
  },
  slotChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  slotChipTextSelected: {
    color: colors.white,
  },
  slotChipTextOccupied: {
    color: colors.gray[300],
  },
  slotSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary + '15',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  slotSummaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  fullScreenCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.lightBg,
    gap: spacing.md,
  },
  notAccessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
    marginTop: spacing.sm,
  },
  notAccessMsg: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  feedbackSuccess: {
    backgroundColor: '#dcfce7',
  },
  feedbackError: {
    backgroundColor: '#fef2f2',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
