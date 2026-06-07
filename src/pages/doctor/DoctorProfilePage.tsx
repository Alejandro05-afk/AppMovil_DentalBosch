import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/entities/auth/api/auth.service';
import { DoctorProfile } from '@/entities/doctor/model/doctor.types';
import { Card, Button, colors, spacing } from '@/shared/ui';
import { EditDoctorForm } from '@/features/doctor';

const DIAS_ORDEN = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getDoctorProfile();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
        Alert.alert('Error', 'No se pudo cargar el perfil del doctor');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (data: Partial<DoctorProfile>) => {
    setIsLoading(true);
    try {
      await authService.actualizarPerfilDoctor(data);
      const refreshed = await authService.getDoctorProfile();
      setProfile(refreshed);
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error: any) {
      const mensaje = error.response?.data?.mensaje || 'No se pudo actualizar el perfil';
      Alert.alert('Error', mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!profile) {
    return null;
  }

  const horariosOrdenados = DIAS_ORDEN.map((dia) =>
    profile.horarioAtencion.find((h) => h.dia === dia),
  ).filter(Boolean);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {router.canGoBack() || isEditing ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (isEditing) {
              setIsEditing(false);
            } else {
              router.back();
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.headerTitle}>{isEditing ? 'Editar Perfil' : 'Mi Perfil'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {isEditing ? (
            <EditDoctorForm initialData={profile} onSave={handleSave} isLoading={isLoading} />
          ) : (
            <>
              <Card variant="elevated" style={styles.profileCard}>
                <View style={styles.avatar}>
                  <Ionicons name="medkit" size={32} color={colors.primary} />
                </View>
                <Text style={styles.doctorName}>
                  Dr. {profile.usuario.nombre} {profile.usuario.apellido}
                </Text>
                <View style={styles.specialtyBadge}>
                  <Text style={styles.specialtyText}>{profile.especialidad}</Text>
                </View>
                <View style={[styles.statusBadge, profile.activo ? styles.statusActive : styles.statusInactive]}>
                  <View style={[styles.statusDot, profile.activo ? styles.dotActive : styles.dotInactive]} />
                  <Text style={[styles.statusText, { color: profile.activo ? colors.success : colors.gray[500] }]}>
                    {profile.activo ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </Card>

              <Card variant="elevated" style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Información Personal</Text>
                  <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dataRow}>
                  <Ionicons name="mail-outline" size={16} color={colors.gray[400]} />
                  <Text style={styles.dataLabel}>Email:</Text>
                  <View style={styles.lockedValue}>
                    <Text style={styles.dataValueLocked} numberOfLines={1} ellipsizeMode="tail">{profile.usuario.email}</Text>
                    <Ionicons name="lock-closed" size={14} color={colors.gray[400]} />
                  </View>
                </View>
                <View style={styles.dataRow}>
                  <Ionicons name="call-outline" size={16} color={colors.gray[400]} />
                  <Text style={styles.dataLabel}>Teléfono:</Text>
                  <Text style={styles.dataValue}>{profile.usuario.telefono}</Text>
                </View>
              </Card>

              <Card variant="elevated" style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="briefcase" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Información Profesional</Text>
                </View>

                  <View style={styles.dataRow}>
                    <Ionicons name="flask" size={16} color={colors.gray[400]} />
                    <Text style={styles.dataLabel}>Especialidad:</Text>
                    <Text style={styles.dataValue}>{profile.especialidad}</Text>
                  </View>
              </Card>

              <Card variant="elevated" style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Horario de Atención</Text>
                </View>

                {horariosOrdenados.map((horario, index) => (
                  <View key={index} style={styles.horarioRow}>
                    <View style={styles.horarioDay}>
                      <Text style={styles.horarioDayText}>
                        {horario!.dia.charAt(0).toUpperCase() + horario!.dia.slice(1)}
                      </Text>
                    </View>
                    {horario!.disponible ? (
                      <View style={styles.horarioTime}>
                        <Ionicons name="time-outline" size={14} color={colors.secondary} />
                        <Text style={styles.horarioTimeText}>
                          {horario!.horaInicio} - {horario!.horaFin}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.horarioTime}>
                        <Ionicons name="close-outline" size={14} color={colors.danger} />
                        <Text style={styles.horarioOffText}>No disponible</Text>
                      </View>
                    )}
                  </View>
                ))}
              </Card>

              <View style={styles.actionsContainer}>
                <Button
                  label="Cambiar contraseña"
                  variant="outline"
                  onPress={() => router.push('/(profile)/change-password')}
                  icon="key-outline"
                />
              </View>
            </>
          )}
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
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  specialtyBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: colors.success + '15',
  },
  statusInactive: {
    backgroundColor: colors.gray[100],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.success,
  },
  dotInactive: {
    backgroundColor: colors.gray[400],
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dataLabel: {
    width: 100,
    fontSize: 14,
    color: colors.gray[500],
  },
  dataValue: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
    fontWeight: '500',
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  horarioDay: {
    width: 100,
  },
  horarioDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
  },
  horarioTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  horarioTimeText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  horarioOffText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
  lockedValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dataValueLocked: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
    flexShrink: 1,
  },
  editBtn: {
    padding: spacing.xs,
  },
  actionsContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
});
