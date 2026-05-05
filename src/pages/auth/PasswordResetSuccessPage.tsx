import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, colors, spacing, Card } from '@/shared/ui';

export function PasswordResetSuccessPage() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centerContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>

          <Text style={styles.title}>¡Contraseña restablecida!</Text>

          <Text style={styles.subtitle}>
            Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </Text>

          <Card variant="elevated" style={styles.infoCard}>
            <View style={styles.infoIconRow}>
              <Ionicons name="shield-checkmark" size={20} color={colors.secondary} />
              <Text style={styles.infoText}>
                Recomendamos que no compartas tu contraseña con nadie y que la cambies periódicamente.
              </Text>
            </View>
          </Card>

          <Button
            label="Iniciar sesión"
            variant="primary"
            size="lg"
            onPress={() => router.replace('/(auth)/login')}
            icon="log-in"
            iconPosition="right"
            containerStyle={styles.loginBtn}
          />

          <Button
            label="Volver al inicio"
            variant="ghost"
            size="md"
            onPress={() => router.replace('/')}
            containerStyle={styles.homeBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 20,
    maxWidth: 320,
  },
  infoCard: {
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  loginBtn: {
    width: '100%',
    marginBottom: spacing.md,
  },
  homeBtn: {
    marginTop: spacing.sm,
  },
});
