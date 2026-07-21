import { authService } from '@/entities/auth/api/auth.service';
import { useAuth } from '@/shared/contexts/AuthContext';
import { registerPushToken } from '@/shared/hooks/usePushNotifications';
import { loginSchema } from '@/shared/lib/formSchemas';
import { Button, Card, colors, Input, spacing } from '@/shared/ui';
import { useForm } from '@tanstack/react-form';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export function LoginPage() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

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
          await login(response.token);
          registerPushToken();
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
