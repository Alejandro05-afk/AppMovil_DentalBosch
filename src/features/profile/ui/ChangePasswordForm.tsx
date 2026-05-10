import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, Card, colors, spacing } from '@/shared/ui';
import { PASSWORD_RULES } from '@/shared/lib/formSchemas';
import { changePasswordSchema, ChangePasswordFormData } from '../model/passwordSchema';

interface ChangePasswordFormProps {
  onSubmit: (data: ChangePasswordFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ChangePasswordForm({ onSubmit, isLoading }: ChangePasswordFormProps) {
  const [showRules, setShowRules] = useState(true);

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onChange: ({ value }) => {
        const result = changePasswordSchema.safeParse(value);
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
      await onSubmit(value);
    },
  });

  const newPassword = form.getFieldValue('newPassword');

  const strengthColor = useMemo(() => {
    if (!newPassword) return colors.gray[300];
    const passed = PASSWORD_RULES.filter((r) => r.test(newPassword)).length;
    const ratio = passed / PASSWORD_RULES.length;
    if (ratio <= 0.25) return colors.danger;
    if (ratio <= 0.5) return colors.warning;
    if (ratio <= 0.75) return colors.secondary;
    return colors.success;
  }, [newPassword]);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return 'Sin contraseña';
    const passed = PASSWORD_RULES.filter((r) => r.test(newPassword)).length;
    const ratio = passed / PASSWORD_RULES.length;
    if (ratio <= 0.25) return 'Débil';
    if (ratio <= 0.5) return 'Regular';
    if (ratio <= 0.75) return 'Buena';
    return 'Fuerte';
  }, [newPassword]);

  return (
    <View style={styles.container}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={20} color={colors.primary} />
          <Text style={styles.title}>Cambiar Contraseña</Text>
        </View>

        <form.Field
          name="currentPassword"
          children={(field) => (
            <Input
              label="Contraseña actual"
              placeholder="••••••••"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              secureTextEntry
              leftIcon="key-outline"
              error={field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : undefined}
            />
          )}
        />

        <form.Field
          name="newPassword"
          children={(field) => (
            <Input
              label="Nueva contraseña"
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

        {newPassword.length > 0 && showRules && (
          <View style={styles.strengthContainer}>
            <Text style={[styles.strengthLabel, { color: strengthColor }]}>
              Seguridad: {strengthLabel}
            </Text>
          </View>
        )}

        <form.Field
          name="confirmPassword"
          children={(field) => (
            <Input
              label="Confirmar nueva contraseña"
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
            {showRules ? 'Ocultar' : 'Ver'} requisitos
          </Text>
        </TouchableOpacity>

        {showRules && newPassword.length > 0 && (
          <View style={styles.rulesList}>
            {PASSWORD_RULES.map((rule, index) => {
              const passed = rule.test(newPassword);
              return (
                <View key={index} style={styles.ruleRow}>
                  <Ionicons
                    name={passed ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={passed ? colors.success : colors.gray[300]}
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

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            label="Actualizar contraseña"
            variant="primary"
            size="lg"
            loading={isLoading || isSubmitting}
            disabled={!canSubmit || isLoading || isSubmitting}
            onPress={() => form.handleSubmit()}
            icon={isLoading || isSubmitting ? undefined : 'checkmark-circle'}
            containerStyle={styles.submitBtn}
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
  card: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  strengthContainer: {
    marginBottom: spacing.md,
    marginTop: -8,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  rulesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 4,
  },
  rulesToggleText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  rulesList: {
    gap: 8,
    marginBottom: spacing.md,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  rulePassed: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
