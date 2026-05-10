import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/entities/user/model/user.types';
import { Input, Button, Card, DatePicker, colors, spacing } from '@/shared/ui';
import { editProfileSchema, EditProfileFormData } from '../model/profileSchema';

interface EditProfileFormProps {
  initialData: UserProfile;
  onSave: (data: EditProfileFormData) => Promise<void>;
  isLoading?: boolean;
}

const GENDERS = ['masculino', 'femenino', 'otro'];
const PARENTESCOS = ['madre', 'padre', 'hermano/a', 'esposo/a', 'hijo/a', 'otro'];

export function EditProfileForm({ initialData, onSave, isLoading }: EditProfileFormProps) {
  const [showGenderPicker, setShowGenderPicker] = React.useState(false);
  const [showParentescoPicker, setShowParentescoPicker] = React.useState(false);

  const form = useForm({
    defaultValues: {
      nombre: initialData.nombre || '',
      apellido: initialData.apellido || '',
      fechaNacimiento: initialData.fechaNacimiento || '',
      genero: initialData.genero || '',
      telefono: initialData.telefono || '',
      direccion: initialData.direccion || { calle: '', ciudad: '', provincia: '' },
      contactoEmergencia: initialData.contactoEmergencia || { nombre: '', telefono: '', parentesco: '' },
    },
    validators: {
      onChange: ({ value }) => {
        const result = editProfileSchema.safeParse(value);
        if (result.success) return undefined;
        const fields: Record<string, string> = {};
        for (const error of result.error.errors) {
          const field = error.path.join('.');
          fields[field] = error.message;
        }
        return { fields };
      },
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
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
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
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />

        <form.Field
          name="fechaNacimiento"
          children={(field) => (
            <DatePicker
              label="Fecha de Nacimiento"
              value={field.state.value}
              onChange={field.handleChange}
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />

        <form.Field
          name="genero"
          children={(field) => (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, field.state.meta.errors.length > 0 && styles.labelError]}>
                Género
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerInput,
                  field.state.meta.errors.length > 0 && styles.pickerInputError,
                ]}
                onPress={() => setShowGenderPicker(true)}
              >
                <Ionicons name="male-female-outline" size={20} color={colors.gray[400]} />
                <Text style={styles.pickerText}>
                  {field.state.value
                    ? field.state.value.charAt(0).toUpperCase() + field.state.value.slice(1)
                    : 'Seleccionar género'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
              {field.state.meta.errors.length > 0 && (
                <Text style={styles.errorText}>{String(field.state.meta.errors[0])}</Text>
              )}

              {showGenderPicker && (
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerSheetHeader}>
                    <Text style={styles.pickerSheetTitle}>Seleccionar género</Text>
                    <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                      <Ionicons name="close" size={24} color={colors.dark} />
                    </TouchableOpacity>
                  </View>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={styles.pickerOption}
                      onPress={() => {
                        field.handleChange(g);
                        setShowGenderPicker(false);
                      }}
                    >
                      <Ionicons
                        name={field.state.value === g ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={field.state.value === g ? colors.primary : colors.gray[400]}
                      />
                      <Text style={[styles.pickerOptionText, field.state.value === g && styles.pickerOptionTextSelected]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
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
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />
      </Card>

      <Card variant="elevated" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="home" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Dirección</Text>
        </View>

        <form.Field
          name="direccion.calle"
          children={(field) => (
            <Input
              label="Calle"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              leftIcon="home-outline"
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />

        <form.Field
          name="direccion.ciudad"
          children={(field) => (
            <Input
              label="Ciudad"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              leftIcon="business-outline"
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />

        <form.Field
          name="direccion.provincia"
          children={(field) => (
            <Input
              label="Provincia"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              leftIcon="map-outline"
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />
      </Card>

      <Card variant="elevated" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="alert-circle" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
        </View>

        <form.Field
          name="contactoEmergencia.nombre"
          children={(field) => (
            <Input
              label="Nombre"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              leftIcon="person-outline"
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />

        <form.Field
          name="contactoEmergencia.telefono"
          children={(field) => (
            <Input
              label="Teléfono"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />

        <form.Field
          name="contactoEmergencia.parentesco"
          children={(field) => (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, field.state.meta.errors.length > 0 && styles.labelError]}>
                Parentesco
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerInput,
                  field.state.meta.errors.length > 0 && styles.pickerInputError,
                ]}
                onPress={() => setShowParentescoPicker(true)}
              >
                <Ionicons name="people-outline" size={20} color={colors.gray[400]} />
                <Text style={styles.pickerText}>
                  {field.state.value
                    ? field.state.value.charAt(0).toUpperCase() + field.state.value.slice(1)
                    : 'Seleccionar parentesco'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
              {field.state.meta.errors.length > 0 && (
                <Text style={styles.errorText}>{String(field.state.meta.errors[0])}</Text>
              )}

              {showParentescoPicker && (
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerSheetHeader}>
                    <Text style={styles.pickerSheetTitle}>Seleccionar parentesco</Text>
                    <TouchableOpacity onPress={() => setShowParentescoPicker(false)}>
                      <Ionicons name="close" size={24} color={colors.dark} />
                    </TouchableOpacity>
                  </View>
                  {PARENTESCOS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={styles.pickerOption}
                      onPress={() => {
                        field.handleChange(p);
                        setShowParentescoPicker(false);
                      }}
                    >
                      <Ionicons
                        name={field.state.value === p ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={field.state.value === p ? colors.primary : colors.gray[400]}
                      />
                      <Text style={[styles.pickerOptionText, field.state.value === p && styles.pickerOptionTextSelected]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
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
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: colors.dark,
  },
  labelError: {
    color: colors.danger,
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
  },
  pickerInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '08',
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
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
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pickerOptionText: {
    fontSize: 15,
    color: colors.dark,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
