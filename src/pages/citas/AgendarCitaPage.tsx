import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/entities/auth/api/auth.service';
import { citasService } from '@/entities/citas/api/citas.service';
import { DoctorItem } from '@/entities/citas/model/citas.types';
import { apiClient } from '@/shared/api/apiClient';
import { Button, Card, Input, DatePicker, LoadingScreen, ErrorScreen, colors, spacing } from '@/shared/ui';

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

  const validarHora = (hora: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora);
  const validarFecha = (f: string) => /^\d{4}-\d{2}-\d{2}$/.test(f);

  const handleAgendar = async () => {
    setFeedback(null);

    if (!doctorSel || !fecha || !horaInicio || !horaFin || !motivo) {
      setFeedback({ type: 'error', message: 'Todos los campos son obligatorios' });
      return;
    }
    if (!validarFecha(fecha)) {
      setFeedback({ type: 'error', message: 'Formato de fecha inválido' });
      return;
    }
    if (!validarHora(horaInicio) || !validarHora(horaFin)) {
      setFeedback({ type: 'error', message: 'Formato de hora inválido. Use HH:MM (ej: 09:00)' });
      return;
    }
    if (horaInicio >= horaFin) {
      setFeedback({ type: 'error', message: 'La hora de inicio debe ser menor a la hora fin' });
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
      setDoctorSel('');
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setMotivo('');
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
            />

            <View style={styles.horasRow}>
              <View style={styles.horaField}>
                <Input
                  label="Hora inicio"
                  value={horaInicio}
                  onChangeText={setHoraInicio}
                  placeholder="HH:MM"
                  leftIcon="time-outline"
                />
              </View>
              <View style={styles.horaField}>
                <Input
                  label="Hora fin"
                  value={horaFin}
                  onChangeText={setHoraFin}
                  placeholder="HH:MM"
                  leftIcon="time-outline"
                />
              </View>
            </View>

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
  horasRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  horaField: {
    flex: 1,
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
