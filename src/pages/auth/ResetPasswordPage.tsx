import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useForm } from '@tanstack/react-form';
import { Input, Button, colors, spacing, Card } from '@/shared/ui';
import { resetPasswordSchema, PASSWORD_RULES } from '@/shared/lib/formSchemas';
import { authService } from '@/entities/auth/api/auth.service';
import { supabase } from '@/shared/api/supabaseClient';

const AUTH_PROVIDER = process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'backend';

function getParamFromUrl(url: string, param: string): string | null {
  const cleanUrl = url.replace('#', '?');
  const match = RegExp('[?&]' + param + '=([^&]*)').exec(cleanUrl);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

export function ResetPasswordPage() {
  const params = useLocalSearchParams();
  const code = (params.code as string) || '';

  const [isLoading, setIsLoading] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [sessionReady, setSessionReady] = useState(!(AUTH_PROVIDER === 'supabase'));
  const [sessionError, setSessionError] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    if (AUTH_PROVIDER !== 'supabase') return;

    const initSession = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const access_token = getParamFromUrl(initialUrl, 'access_token');
          const refresh_token = getParamFromUrl(initialUrl, 'refresh_token');
          const type = getParamFromUrl(initialUrl, 'type');
          if (type === 'recovery' && access_token && refresh_token && supabase) {
            await supabase.auth.setSession({ access_token, refresh_token });
            setSessionReady(true);
            return;
          }
        }
        // Si no se detectó la URL, ver si ya hay sesión activa
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setSessionReady(true);
            return;
          }
        }
        // No se pudo restaurar la sesión
        setSessionError(true);
      } catch {
        setSessionError(true);
      }
      setSessionReady(true);
    };

    initSession();
  }, []);

  const handleManualLink = async () => {
    if (!manualUrl.trim()) return;
    const access_token = getParamFromUrl(manualUrl, 'access_token');
    const refresh_token = getParamFromUrl(manualUrl, 'refresh_token');
    const type = getParamFromUrl(manualUrl, 'type');
    if (type === 'recovery' && access_token && refresh_token && supabase) {
      await supabase.auth.setSession({ access_token, refresh_token });
      setSessionError(false);
    } else {
      Alert.alert('Error', 'El enlace no contiene datos de recuperación válidos. Copiá el enlace completo del correo.');
    }
  };

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onChange: ({ value }) => {
        const result = resetPasswordSchema.safeParse(value);
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
        if (AUTH_PROVIDER === 'supabase') {
          if (!supabase) throw new Error('Supabase no está configurado');
          const { error } = await supabase.auth.updateUser({ password: value.newPassword });
          if (error) throw error;
        } else {
          await authService.restablecerPassword(code, value.newPassword);
        }
        Alert.alert(
          'Contraseña actualizada',
          'Tu contraseña ha sido restablecida exitosamente.',
          [
            {
              text: 'Iniciar sesión',
              onPress: () => {
                router.replace('/(auth)/password-reset-success');
              },
            },
          ],
        );
      } catch (error: any) {
        console.error('Reset password error:', error);
        Alert.alert('Error', error.message || error.response?.data?.mensaje || 'No se pudo restablecer la contraseña.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const newPassword = form.getFieldValue('newPassword');

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    const passed = PASSWORD_RULES.filter((rule) => rule.test(newPassword)).length;
    return (passed / PASSWORD_RULES.length) * 100;
  }, [newPassword]);

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

  if (!sessionReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Verificando enlace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionError && AUTH_PROVIDER === 'supabase') {
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
              <View style={styles.headerIcon}>
                <Ionicons name="link-outline" size={32} color={colors.primary} />
              </View>

              <Text style={styles.pageTitle}>Pegá el enlace del correo</Text>

              <Text style={styles.pageSubtitle}>
                El enlace mágico no pudo abrir la app automáticamente. Copiá el enlace completo del correo que recibiste y pegalo abajo.
              </Text>

              <Card variant="elevated">
                <Input
                  label="Enlace de recuperación"
                  value={manualUrl}
                  onChangeText={setManualUrl}
                  placeholder="https://<project>.supabase.co/auth/v1/verify?token=..."
                  leftIcon="link-outline"
                  multiline
                />
                <Button
                  label="Verificar enlace"
                  variant="primary"
                  size="lg"
                  onPress={handleManualLink}
                  disabled={!manualUrl.trim()}
                  containerStyle={styles.submitBtn}
                />
              </Card>

              <TouchableOpacity
                style={styles.rulesToggle}
                onPress={() => router.replace('/(auth)/forgot-password')}
              >
                <Text style={styles.rulesToggleText}>Solicitar otro enlace</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
              <Ionicons name="lock-closed" size={32} color={colors.primary} />
            </View>

            <Text style={styles.pageTitle}>Nueva contraseña</Text>

            <Text style={styles.pageSubtitle}>
              Crea una contraseña segura para proteger tu cuenta.
            </Text>

            <Card variant="elevated">
              <form.Field
                name="newPassword"
                children={(field) => (
                  <Input
                    label="Nueva contraseña"
                    placeholder="Ingresa tu nueva contraseña"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry
                    leftIcon="lock-closed-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              />

              {newPassword.length > 0 && showRules && (
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
                    placeholder="Repite tu nueva contraseña"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry
                    leftIcon="shield-checkmark-outline"
                    error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              />

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit]) => (
                  <Button
                    label="Restablecer contraseña"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    disabled={!canSubmit}
                    onPress={() => form.handleSubmit()}
                    icon={isLoading ? undefined : 'checkmark-done'}
                    iconPosition="right"
                    containerStyle={styles.submitBtn}
                  />
                )}
              />
            </Card>

            <TouchableOpacity
              style={styles.rulesToggle}
              onPress={() => setShowRules((prev) => !prev)}
            >
              <Ionicons
                name={showRules ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={colors.gray[500]}
              />
              <Text style={styles.rulesToggleText}>
                {showRules ? 'Ocultar' : 'Ver'} requisitos de contraseña
              </Text>
            </TouchableOpacity>

            {showRules && newPassword.length === 0 && (
              <Card variant="outlined" style={styles.rulesCard}>
                <Text style={styles.rulesTitle}>Requisitos de seguridad:</Text>
                {PASSWORD_RULES.map((rule, index) => (
                  <View key={index} style={styles.ruleRow}>
                    <Ionicons
                      name="ellipse-outline"
                      size={10}
                      color={colors.gray[400]}
                      style={styles.ruleDot}
                    />
                    <Text style={styles.ruleText}>{rule.label}</Text>
                  </View>
                ))}
              </Card>
            )}

            {showRules && newPassword.length > 0 && (
              <Card variant="outlined" style={styles.rulesCard}>
                {PASSWORD_RULES.map((rule, index) => {
                  const passed = rule.test(newPassword);
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
              </Card>
            )}
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
    marginTop: spacing.lg,
    gap: 4,
  },
  rulesToggleText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  rulesCard: {
    marginTop: spacing.md,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.md,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[500],
  },
});
