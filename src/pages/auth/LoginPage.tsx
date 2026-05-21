import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from '@tanstack/react-form';
import { Input, Button, colors, spacing, Card } from '@/shared/ui';
import { loginSchema } from '@/shared/lib/formSchemas';
import { authService } from '@/entities/auth/api/auth.service';
import { authStorage } from '@/shared/api/authStorage';
import { publicApiClient } from '@/shared/api/apiClient';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showBackendPass, setShowBackendPass] = useState(false);
  const [backendEmail, setBackendEmail] = useState('');
  const [backendPassword, setBackendPassword] = useState('');
  const [backendLoading, setBackendLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: ({ value }) => {
        const result = loginSchema.safeParse(value);
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
        const response = await authService.login({ email: value.email, password: value.password });
        if (response.token) {
          await authStorage.setToken(response.token);
          router.replace('/(tabs)');
        } else {
          Alert.alert('Error', response.mensaje || 'Credenciales inválidas');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        Alert.alert('Error', error.response?.data?.mensaje || 'Credenciales inválidas o error de conexión');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response: any = await authService.loginWithGoogle();
      if (response.needsBackendAuth && response.email) {
        setBackendEmail(response.email);
        setShowBackendPass(true);
        return;
      }
      if (response.token) {
        await authStorage.setToken(response.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'No se pudo obtener la sesión de Google.');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      const msg = error?.message || '';
      if (msg.includes('canceló')) {
        // El usuario cerró el navegador, no mostrar alerta
      } else if (msg.includes('no está habilitado')) {
        Alert.alert(
          'Google no configurado',
          'El proveedor de Google no está activado en Supabase. Andá a Authentication > Providers > Google y activalo.'
        );
      } else {
        Alert.alert('Error', msg || 'Ocurrió un error al iniciar sesión con Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackendLink = async () => {
    if (!backendPassword.trim()) return;
    setBackendLoading(true);
    try {
      const r = await publicApiClient.post('/auth/login', {
        email: backendEmail,
        password: backendPassword,
      });
      const token = r.data?.token || r.data?.datos?.token || r.data?.data?.token;
      if (token) {
        await authStorage.setToken(token);
        setShowBackendPass(false);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'No se pudo obtener el token del backend.');
      }
    } catch (e: any) {
      const msg = e.response?.data?.mensaje || 'Credenciales inválidas';
      Alert.alert('Error', msg);
    } finally {
      setBackendLoading(false);
    }
  };

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
          <View style={styles.centerContent}>
            <View style={styles.logoSection}>
              <Image source={require('../../../assets/images/logo.jpeg')} style={styles.logoImage} />
              <Text style={styles.appName}>DentalBosch</Text>
              <Text style={styles.tagline}>Gestión inteligente de tu consultorio</Text>
            </View>

            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Bienvenido de vuelta</Text>
              <Text style={styles.cardSubtitle}>Inicia sesión para continuar</Text>

              <form.Field
                name="email"
                children={(field) => (
                  <Input
                    label="Correo electrónico"
                    placeholder="@gmail.com"
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
                name="password"
                children={(field) => (
                  <Input
                    label="Contraseña"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry
                    leftIcon="lock-closed-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              />

              <TouchableOpacity
                style={styles.forgotLink}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit]) => (
                  <Button
                    label="Iniciar sesión"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    disabled={!canSubmit}
                    onPress={() => form.handleSubmit()}
                    icon={isLoading ? undefined : 'arrow-forward'}
                    iconPosition="right"
                  />
                )}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.googleIconWrapper}>
                  <Ionicons name="logo-google" size={20} color={colors.dark} />
                </View>
                <Text style={styles.googleButtonText}>Iniciar con Google</Text>
              </TouchableOpacity>
            </Card>

            <View style={styles.registerSection}>
              <Text style={styles.registerText}>
                ¿No tienes cuenta?{' '}
                <Text
                  style={styles.registerLink}
                  onPress={() => router.push('/(auth)/register')}
                >
                  Regístrate
                </Text>
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Versión 1.0.0 · DentalBosch © 2026</Text>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={showBackendPass} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Vincular cuenta</Text>
              <Text style={styles.modalDesc}>
                El correo {backendEmail} ya está registrado. Ingresá tu contraseña para vincular tu cuenta de Google.
              </Text>
              <Input
                label="Contraseña"
                value={backendPassword}
                onChangeText={setBackendPassword}
                placeholder="Tu contraseña"
                secureTextEntry
                leftIcon="lock-closed-outline"
              />
              <View style={styles.modalActions}>
                <Button
                  variant="ghost"
                  title="Cancelar"
                  onPress={() => {
                    setShowBackendPass(false);
                    setBackendPassword('');
                  }}
                  disabled={backendLoading}
                />
                <Button
                  variant="primary"
                  title={backendLoading ? 'Vinculando...' : 'Vincular'}
                  onPress={handleBackendLink}
                  disabled={backendLoading || !backendPassword.trim()}
                  loading={backendLoading}
                />
              </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: spacing.xl,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    fontSize: 13,
    color: colors.gray[400],
    paddingHorizontal: spacing.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderRadius: 12,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  googleIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  registerSection: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
