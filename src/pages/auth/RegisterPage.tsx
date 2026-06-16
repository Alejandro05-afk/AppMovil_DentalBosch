import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Input, Button, Divider, colors, spacing, Card, DatePicker } from '@/shared/ui';
import { authService } from '@/entities/auth/api/auth.service';
import { authStorage } from '@/shared/api/authStorage';
import { registerPushToken } from '@/shared/hooks/usePushNotifications';
import { signInWithGoogle } from '@/shared/api/googleAuth';
import {
  emailSchema,
  passwordSchema,
  birthDateSchema,
  PASSWORD_RULES,
} from '@/shared/lib/formSchemas';

const GENDERS = ['masculino', 'femenino', 'otro'];
const PARENTESCOS = ['madre', 'padre', 'hermano/a', 'esposo/a', 'hijo/a', 'otro'];

const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre es muy corto').refine((val) => !/\d/.test(val), 'El nombre no puede contener números'),
  apellido: z.string().min(2, 'El apellido es muy corto').refine((val) => !/\d/.test(val), 'El apellido no puede contener números'),
  cedula: z.string().min(1, 'La cédula es obligatoria').regex(/^\d+$/, 'Solo números'),
  fechaNacimiento: birthDateSchema,
  genero: z.string().min(1, 'Selecciona un género'),
  email: emailSchema,
  telefono: z.string().min(1, 'El teléfono es obligatorio').regex(/^\d+$/, 'Solo números'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Debes confirmar tu contraseña'),
  direccion: z.object({
    calle: z.string().min(1, 'La calle es obligatoria'),
    ciudad: z.string().min(1, 'La ciudad es obligatoria').refine((val) => !/\d/.test(val), 'La ciudad no puede contener números'),
    provincia: z.string().min(1, 'La provincia es obligatoria').refine((val) => !/\d/.test(val), 'La provincia no puede contener números'),
  }),
  contactoEmergencia: z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').refine((val) => !/\d/.test(val), 'El nombre no puede contener números'),
    telefono: z.string().min(1, 'El teléfono es obligatorio').regex(/^\d+$/, 'Solo números'),
    parentesco: z.string().min(1, 'El parentesco es obligatorio'),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showParentescoPicker, setShowParentescoPicker] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        registerPushToken();
        router.replace('/(tabs)');
      } else {
        Alert.alert('Google no disponible', 'El inicio de sesión con Google requiere un APK generado. Usa correo y contraseña por ahora.');
      }
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const form = useForm({
    defaultValues: {
      nombre: '',
      apellido: '',
      cedula: '',
      fechaNacimiento: '',
      genero: '',
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      direccion: {
        calle: '',
        ciudad: '',
        provincia: '',
      },
      contactoEmergencia: {
        nombre: '',
        telefono: '',
        parentesco: '',
      },
    },
    validators: {
      onChange: ({ value }) => {
        const result = registerSchema.safeParse(value);
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
      setIsLoading(true);
      try {
        const payload = {
          nombre: value.nombre,
          apellido: value.apellido,
          email: value.email,
          password: value.password,
          rol: 'paciente' as const,
          cedula: value.cedula,
          telefono: value.telefono,
          fechaNacimiento: value.fechaNacimiento,
          genero: value.genero,
          direccion: {
            calle: value.direccion.calle,
            ciudad: value.direccion.ciudad,
            provincia: value.direccion.provincia,
          },
          contactoEmergencia: {
            nombre: value.contactoEmergencia.nombre,
            telefono: value.contactoEmergencia.telefono,
            parentesco: value.contactoEmergencia.parentesco,
          },
        };

        const response = await authService.register(payload);
        if (response.token) {
          await authStorage.setToken(response.token);
          registerPushToken();
          router.replace('/(tabs)');
        } else {
          Alert.alert('Éxito', response.mensaje || 'Registro exitoso');
          router.replace('/(auth)/login');
        }
      } catch (error: any) {
        console.error('Register error:', error);
        Alert.alert('Error', error.response?.data?.mensaje || 'Error al crear la cuenta');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const password = form.getFieldValue('password');

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
    return (passed / PASSWORD_RULES.length) * 100;
  }, [password]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 25) return colors.danger;
    if (passwordStrength <= 50) return colors.warning;
    if (passwordStrength <= 75) return colors.secondary;
    return colors.success;
  }, [passwordStrength]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength <= 25) return 'Débil';
    if (passwordStrength <= 50) return 'Regular';
    if (passwordStrength <= 75) return 'Buena';
    return 'Fuerte';
  }, [passwordStrength]);

  const maxBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const minBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d;
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pageContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}>
              <Ionicons name="arrow-back" size={22} color={colors.dark} />
            </TouchableOpacity>

            <Text style={styles.pageTitle}>Crear cuenta</Text>
            <Text style={styles.pageSubtitle}>
              Completa tus datos para comenzar a gestionar tu consultorio.
            </Text>

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
                    placeholder="Juan"
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
                    placeholder="Pérez"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    leftIcon="person-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              />

              <form.Field
                name="cedula"
                children={(field) => (
                  <Input
                    label="Cédula"
                    placeholder="1720106663"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    keyboardType="numeric"
                    leftIcon="card-outline"
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
                    placeholder="Seleccionar fecha"
                    maximumDate={maxBirthDate}
                    minimumDate={minBirthDate}
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
                        styles.inputContainer,
                        field.state.meta.errors.length > 0 && styles.inputError,
                        !!field.state.value && styles.inputFilled,
                      ]}
                      onPress={() => setShowGenderPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="male-female-outline" size={20} color={colors.gray[400]} />
                      <Text style={[styles.inputText, !field.state.value && styles.placeholderText]}>
                        {field.state.value
                          ? field.state.value.charAt(0).toUpperCase() + field.state.value.slice(1).replace('_', ' ')
                          : 'Seleccionar género'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
                    </TouchableOpacity>
                    {field.state.meta.errors.length > 0 && (
                      <Text style={styles.errorText}>{String(field.state.meta.errors[0])}</Text>
                    )}

                    {showGenderPicker && (
                      <View style={styles.genderSheet}>
                        <View style={styles.genderSheetHeader}>
                          <Text style={styles.genderSheetTitle}>Seleccionar género</Text>
                          <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                            <Ionicons name="close" size={24} color={colors.dark} />
                          </TouchableOpacity>
                        </View>
                        {GENDERS.map((g) => (
                          <TouchableOpacity
                            key={g}
                            style={[
                              styles.genderOption,
                              field.state.value === g && styles.genderOptionSelected,
                            ]}
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
                            <Text style={[styles.genderOptionText, field.state.value === g && styles.genderOptionTextSelected]}>
                              {g.charAt(0).toUpperCase() + g.slice(1).replace('_', ' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              />
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Contacto y Acceso</Text>
              </View>

              <form.Field
                name="email"
                children={(field) => (
                  <Input
                    label="Correo electrónico"
                    placeholder="correo@ejemplo.com"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon="mail-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              />

              <form.Field
                name="telefono"
                children={(field) => (
                  <Input
                    label="Teléfono"
                    placeholder="0991234145"
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
                name="password"
                children={(field) => (
                  <Input
                    label="Contraseña"
                    placeholder="Mínimo 8 caracteres"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry
                    leftIcon="lock-closed-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              />

              {password.length > 0 && showPasswordRules && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        { width: `${passwordStrength}%`, backgroundColor: strengthColor },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                    {strengthLabel}
                  </Text>
                </View>
              )}

              <form.Field
                name="confirmPassword"
                children={(field) => (
                  <Input
                    label="Confirmar contraseña"
                    placeholder="Repite tu contraseña"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry
                    leftIcon="shield-checkmark-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              />

              <TouchableOpacity
                style={styles.rulesToggle}
                onPress={() => setShowPasswordRules((prev) => !prev)}
              >
                <Ionicons
                  name={showPasswordRules ? 'chevron-down' : 'chevron-forward'}
                  size={18}
                  color={colors.gray[500]}
                />
                <Text style={styles.rulesToggleText}>
                  {showPasswordRules ? 'Ocultar' : 'Ver'} requisitos
                </Text>
              </TouchableOpacity>

              {showPasswordRules && password.length > 0 && (
                <View style={styles.rulesList}>
                  {PASSWORD_RULES.map((rule, index) => {
                    const passed = rule.test(password);
                    return (
                      <View key={index} style={styles.ruleRow}>
                        <Ionicons
                          name={passed ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={passed ? colors.success : colors.gray[300]}
                          style={styles.ruleDot}
                        />
                        <Text style={[styles.ruleText, passed && styles.rulePassed]}>
                          {rule.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
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
                    placeholder="Calle Principal 123"
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
                    placeholder="Quito"
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
                    placeholder="Pichincha"
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
                    placeholder="María García"
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
                    placeholder="0998765432"
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
                        styles.inputContainer,
                        field.state.meta.errors.length > 0 && styles.inputError,
                        !!field.state.value && styles.inputFilled,
                      ]}
                      onPress={() => setShowParentescoPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="people-outline" size={20} color={colors.gray[400]} />
                      <Text style={[styles.inputText, !field.state.value && styles.placeholderText]}>
                        {field.state.value
                          ? field.state.value.charAt(0).toUpperCase() + field.state.value.slice(1)
                          : 'Seleccionar parentesco'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
                    </TouchableOpacity>
                    {field.state.meta.errors.length > 0 && (
                      <Text style={styles.errorText}>{field.state.meta.errors[0] as string}</Text>
                    )}

                    {showParentescoPicker && (
                      <View style={styles.genderSheet}>
                        <View style={styles.genderSheetHeader}>
                          <Text style={styles.genderSheetTitle}>Seleccionar parentesco</Text>
                          <TouchableOpacity onPress={() => setShowParentescoPicker(false)}>
                            <Ionicons name="close" size={24} color={colors.dark} />
                          </TouchableOpacity>
                        </View>
                        {PARENTESCOS.map((p) => (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.genderOption,
                              field.state.value === p && styles.genderOptionSelected,
                            ]}
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
                            <Text style={[styles.genderOptionText, field.state.value === p && styles.genderOptionTextSelected]}>
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
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit]) => (
                <Button
                  label="Crear cuenta"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  disabled={!canSubmit}
                  onPress={() => form.handleSubmit()}
                  icon={isLoading ? undefined : 'checkmark-circle'}
                  iconPosition="right"
                  containerStyle={styles.submitBtn}
                />
              )}
            />

            <Divider label="o regístrate con" style={{ marginVertical: spacing.lg }} />

            <Button
              label="Google"
              variant="outline"
              size="lg"
              loading={googleLoading}
              onPress={handleGoogleLogin}
              icon="logo-google"
              iconPosition="left"
            />

            <View style={styles.loginLinkSection}>
              <Text style={styles.loginLinkText}>
                ¿Ya tienes cuenta?{' '}
                <Text
                  style={styles.loginLink}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  Inicia sesión
                </Text>
              </Text>
            </View>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  pageContent: {
    flex: 1,
    padding: spacing.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: spacing.lg,
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
  submitBtn: {
    marginTop: spacing.sm,
  },
  loginLinkSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 52,
    borderColor: colors.gray[300],
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '08',
  },
  inputFilled: {
    borderColor: colors.primary,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    marginLeft: 10,
  },
  placeholderText: {
    color: colors.gray[400],
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
  genderSheet: {
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
  genderSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  genderSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  genderOptionSelected: {
    backgroundColor: colors.primary + '08',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
  },
  genderOptionText: {
    fontSize: 15,
    color: colors.dark,
  },
  genderOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  strengthBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 55,
    textAlign: 'right',
  },
  rulesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  rulesToggleText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  rulesList: {
    marginTop: spacing.md,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ruleDot: {
    marginRight: spacing.sm,
  },
  ruleText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  rulePassed: {
    color: colors.success,
  },
});
