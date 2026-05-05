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
import { Input, Button, colors, spacing, Card } from '@/shared/ui';
import { authService } from '@/entities/auth/api/auth.service';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendRecovery = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.recuperarPassword(email);
      setEmailSent(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ocurrió un error al intentar enviar el correo de recuperación.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centerContent}>
            <Card variant="elevated" style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-check" size={40} color={colors.secondary} />
              </View>

              <Text style={styles.successTitle}>Correo enviado</Text>

              <Text style={styles.successMessage}>
                Hemos enviado un enlace de recuperación a{' '}
                <Text style={styles.emailHighlight}>{email}</Text>. Revisa tu bandeja de
                entrada.
              </Text>

              <Button
                label="Entendido"
                variant="primary"
                size="lg"
                onPress={() => router.replace('/(auth)/login')}
              />

              <Button
                label="Reenviar correo"
                variant="ghost"
                size="md"
                onPress={() => setEmailSent(false)}
                containerStyle={styles.resendBtn}
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
              <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
            </View>

            <Text style={styles.pageTitle}>Recuperar contraseña</Text>

            <Text style={styles.pageSubtitle}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu
              contraseña.
            </Text>

            <Card variant="elevated">
              <Input
                label="Correo electrónico"
                placeholder="doctor@consultorio.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <Button
                label="Enviar enlace"
                variant="primary"
                size="lg"
                loading={isLoading}
                onPress={handleSendRecovery}
                icon={isLoading ? undefined : 'send'}
                iconPosition="right"
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
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
  successCard: {
    alignItems: 'center',
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
  emailHighlight: {
    color: colors.dark,
    fontWeight: '500',
  },
  resendBtn: {
    marginTop: spacing.sm,
  },
});
