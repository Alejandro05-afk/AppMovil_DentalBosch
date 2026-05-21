import React, { useState } from 'react';
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
import { Input, Button, colors, spacing, Card } from '@/shared/ui';
import { passwordRequestSchema } from '@/shared/lib/formSchemas';
import { authService } from '@/entities/auth/api/auth.service';

export function PasswordRequestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const AUTH_PROVIDER = process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'backend';

  const form = useForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onChange: ({ value }) => {
        const result = passwordRequestSchema.safeParse(value);
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
        await authService.recuperarPassword(value.email);
        if (AUTH_PROVIDER === 'supabase') {
          setEmailSent(true);
        } else {
          Alert.alert(
            'Código enviado',
            'Se ha enviado un código de verificación a tu correo electrónico.',
            [
              {
                text: 'Continuar',
                onPress: () => {
                  router.push({
                    pathname: '/(auth)/verify-code',
                    params: { email: value.email },
                  });
                },
              },
            ],
          );
        }
      } catch (error: any) {
        console.error('Password request error:', error);
        Alert.alert('Error', error.response?.data?.mensaje || error.message || 'No se pudo enviar el código. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (emailSent) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContent}>
            <Card variant="elevated" style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-check" size={40} color={colors.secondary} />
              </View>
              <Text style={styles.successTitle}>Correo enviado</Text>
              <Text style={styles.successMessage}>
                Revisá tu bandeja de entrada. Hemos enviado un enlace mágico para restablecer tu contraseña.
              </Text>
              <Button
                label="Entendido"
                variant="primary"
                size="lg"
                onPress={() => router.replace('/(auth)/login')}
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={colors.dark} />
            </TouchableOpacity>

            <View style={styles.headerIcon}>
              <Ionicons name="mail-unread" size={32} color={colors.primary} />
            </View>

            <Text style={styles.pageTitle}>Recuperar contraseña</Text>

            <Text style={styles.pageSubtitle}>
              {AUTH_PROVIDER === 'supabase'
                ? 'Ingresa tu correo electrónico y te enviaremos un enlace mágico para restablecer tu contraseña.'
                : 'Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.'}
            </Text>

            <form.Field
              name="email"
              children={(field) => (
                <Card variant="elevated">
                  <Input
                    label="Correo electrónico"
                    placeholder="doctor@consultorio.com"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon="mail-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />

                  <Button
                    label={AUTH_PROVIDER === 'supabase' ? 'Enviar enlace' : 'Enviar código'}
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    onPress={() => form.handleSubmit()}
                    icon={isLoading ? undefined : 'send'}
                    iconPosition="right"
                    containerStyle={styles.submitBtn}
                  />
                </Card>
              )}
            />

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={colors.gray[500]} />
              <Text style={styles.infoText}>
                {AUTH_PROVIDER === 'supabase'
                  ? 'El enlace mágico te llevará directamente a la pantalla para crear una nueva contraseña.'
                  : 'El código de verificación expirará en 5 minutos después de ser enviado.'}
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
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
  submitBtn: {
    marginTop: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
});
