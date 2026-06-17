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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from '@tanstack/react-form';
import { Input, Button, Divider, colors, spacing, Card } from '@/shared/ui';
import { loginSchema } from '@/shared/lib/formSchemas';
import { authService } from '@/entities/auth/api/auth.service';
import { authStorage } from '@/shared/api/authStorage';
import { registerPushToken } from '@/shared/hooks/usePushNotifications';
import { useGoogleAuth } from '@/shared/api/googleAuth';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const { promptAsync: googlePromptAsync, googleLoading, disabled: googleDisabled } = useGoogleAuth(() => {
    registerPushToken();
    router.replace('/(tabs)');
  });

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
          registerPushToken();
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
              <Image source={require('../../../assets/images/logo.png')} style={styles.logoImage} />
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

              <Divider label="o continua con" style={{ marginVertical: spacing.lg }} />

              <Button
                label="Google"
                variant="outline"
                size="lg"
                loading={googleLoading}
                disabled={googleDisabled}
                onPress={() => googlePromptAsync()}
                icon="logo-google"
                iconPosition="left"
              />

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
});
