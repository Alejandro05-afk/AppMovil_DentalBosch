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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from '@tanstack/react-form';
import { Input, Button, colors, spacing, Card } from '@/shared/ui';
import { resetPasswordSchema, PASSWORD_RULES } from '@/shared/lib/formSchemas';
import { authService } from '@/entities/auth/api/auth.service';

export function ResetPasswordPage() {
  const params = useLocalSearchParams();
  const code = (params.code as string) || '';
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(false);

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
        await authService.restablecerPassword(code, value.newPassword);
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
          <View style={styles.pageContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}>
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

              <form.Subscribe
                selector={(state) => state.values.newPassword}
                children={(pw) => {
                  const passed = PASSWORD_RULES.filter((rule) => rule.test(pw)).length;
                  const strength = (passed / PASSWORD_RULES.length) * 100;
                  const sColor = strength <= 25 ? colors.danger : strength <= 50 ? colors.warning : strength <= 75 ? colors.secondary : colors.success;
                  const sLabel = strength <= 25 ? 'Débil' : strength <= 50 ? 'Regular' : strength <= 75 ? 'Buena' : 'Fuerte';
                  return (
                    <>
                      {pw.length > 0 && (
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthBarBg}>
                            <View
                              style={[
                                styles.strengthBarFill,
                                { width: `${strength}%`, backgroundColor: sColor },
                              ]}
                            />
                          </View>
                          <Text style={[styles.strengthLabel, { color: sColor }]}>
                            {sLabel}
                          </Text>
                        </View>
                      )}
                      <Card variant="outlined" style={styles.rulesCard}>
                        {pw.length === 0 && (
                          <Text style={styles.rulesTitle}>Requisitos de seguridad:</Text>
                        )}
                        {PASSWORD_RULES.map((rule, index) => {
                          const rulePassed = pw.length > 0 ? rule.test(pw) : false;
                          return (
                            <View key={index} style={styles.ruleRow}>
                              <Ionicons
                                name={pw.length > 0 ? (rulePassed ? 'checkmark-circle' : 'close-circle') : 'ellipse-outline'}
                                size={pw.length > 0 ? 16 : 10}
                                color={pw.length > 0 ? (rulePassed ? colors.success : colors.gray[300]) : colors.gray[400]}
                                style={styles.ruleDot}
                              />
                              <Text style={[styles.ruleText, rulePassed && styles.rulePassed]}>
                                {rule.label}
                              </Text>
                            </View>
                          );
                        })}
                      </Card>
                    </>
                  );
                }}
              />

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
});
