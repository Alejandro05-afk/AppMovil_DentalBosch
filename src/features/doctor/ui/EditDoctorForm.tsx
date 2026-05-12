import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { Ionicons } from '@expo/vector-icons';
import { DoctorProfile } from '@/entities/doctor/model/doctor.types';
import { Input, Button, Card, colors, spacing } from '@/shared/ui';

interface EditDoctorFormProps {
  initialData: DoctorProfile;
  onSave: (data: Partial<DoctorProfile>) => Promise<void>;
  isLoading?: boolean;
}

export function EditDoctorForm({ initialData, onSave, isLoading }: EditDoctorFormProps) {
  const form = useForm({
    defaultValues: {
      nombre: initialData.usuario.nombre || '',
      apellido: initialData.usuario.apellido || '',
      telefono: initialData.usuario.telefono || '',
      especialidad: initialData.especialidad || '',
    },
    onSubmit: async ({ value }) => {
      await onSave(value);
    },
  });

  return (
    <View style={styles.container}>
      <Card variant="elevated" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Datos Personales</Text>
        </View>

        <form.Field
          name="nombre"
          children={(field) => (
            <Input
              label="Nombre"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              leftIcon="person-outline"
            />
          )}
        />

        <form.Field
          name="apellido"
          children={(field) => (
            <Input
              label="Apellido"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              leftIcon="person-outline"
            />
          )}
        />

        <form.Field
          name="telefono"
          children={(field) => (
            <Input
              label="Teléfono"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
          )}
        />
      </Card>

      <Card variant="elevated" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Especialidad</Text>
        </View>

        <form.Field
          name="especialidad"
          children={(field) => (
            <Input
              label="Especialidad"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              leftIcon="flask-outline"
            />
          )}
        />
      </Card>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
        children={([canSubmit, isSubmitting, isDirty]) => (
          <Button
            label="Guardar cambios"
            variant="primary"
            size="lg"
            loading={isLoading || isSubmitting}
            disabled={!canSubmit || !isDirty || isLoading || isSubmitting}
            onPress={() => form.handleSubmit()}
            icon={isLoading || isSubmitting ? undefined : 'save-outline'}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  sectionCard: {
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
});
