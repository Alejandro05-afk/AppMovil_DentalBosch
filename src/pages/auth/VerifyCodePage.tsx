import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from '@tanstack/react-form';
import { Button, colors, spacing, Card, OtpInput } from '@/shared/ui';
import { verifyCodeSchema } from '@/shared/lib/formSchemas';
import { authService } from '@/entities/auth/api/auth.service';

const TIMER_SECONDS = 300;

export function VerifyCodePage() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';

  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const form = useForm({
    defaultValues: {
      code: '',
    },
    validators: {
      onChange: ({ value }) => {
        const result = verifyCodeSchema.safeParse(value);
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
        const result = await authService.verificarCodigo(value.code);
        if (result.success) {
          router.push({
            pathname: '/(auth)/reset-password',
            params: { email, code: value.code },
          });
        } else {
          Alert.alert('Error', result.mensaje || 'Código inválido. Verifica e intenta de nuevo.');
        }
      } catch (error: any) {
        console.error('Verify code error:', error);
        Alert.alert('Error', error.response?.data?.mensaje || 'Código inválido. Verifica e intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleResendCode = useCallback(async () => {
    if (timeLeft > 0) return;

    try {
      await authService.recuperarPassword(email);
      setTimeLeft(TIMER_SECONDS);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert('Código reenviado', 'Se ha enviado un nuevo código a tu correo.');
    } catch (error: any) {
      console.error('Resend code error:', error);
      Alert.alert('Error', error.response?.data?.mensaje || 'No se pudo reenviar el código.');
    }
  }, [timeLeft, email]);

  const isTimerActive = timeLeft > 0;

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

            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={32} color={colors.secondary} />
            </View>

            <Text style={styles.pageTitle}>Verificar código</Text>

            <Text style={styles.pageSubtitle}>
              Ingresa el código de 6 dígitos que enviamos a{' '}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <Card variant="elevated">
              <form.Field
                name="code"
                children={(field) => (
                  <>
                    <OtpInput
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                    />

                    <Button
                      label="Verificar código"
                      variant="primary"
                      size="lg"
                      loading={isLoading}
                      onPress={() => form.handleSubmit()}
                      icon={isLoading ? undefined : 'checkmark-circle'}
                      iconPosition="right"
                      containerStyle={styles.submitBtn}
                    />
                  </>
                )}
              />

              <View style={styles.timerRow}>
                {isTimerActive ? (
                  <>
                    <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
                    <Text style={styles.timerText}>
                      Reenviar código en {formatTime(timeLeft)}
                    </Text>
                  </>
                ) : (
                  <Button
                    label="Reenviar código"
                    variant="ghost"
                    size="sm"
                    onPress={handleResendCode}
                    icon="refresh"
                    iconPosition="left"
                    containerStyle={styles.resendBtn}
                    labelStyle={styles.resendLabel}
                  />
                )}
              </View>
            </Card>

            <TouchableOpacity
              style={styles.changeEmailBtn}
              onPress={() => router.replace('/(auth)/password-request')}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={styles.changeEmailText}>Cambiar correo</Text>
            </TouchableOpacity>
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
    backgroundColor: colors.secondary + '15',
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
  emailText: {
    color: colors.dark,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  timerText: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
  },
  resendBtn: {
    paddingVertical: 0,
  },
  resendLabel: {
    fontSize: 14,
  },
  changeEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: 6,
  },
  changeEmailText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
