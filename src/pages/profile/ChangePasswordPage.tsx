import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChangePasswordForm, ChangePasswordFormData } from '@/features/profile';
import { authService } from '@/entities/auth/api/auth.service';
import { colors, spacing } from '@/shared/ui';

export function ChangePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.actualizarPassword(data.currentPassword, data.newPassword);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente ✅', [
        {
          text: 'Aceptar',
          onPress: () => router.back(),
        }
      ]);
    } catch (error: any) {
      const mensaje = error.response?.data?.mensaje || 'No se pudo actualizar la contraseña';
      Alert.alert('Error', mensaje);
      console.error('Change password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguridad</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <ChangePasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
  },
});
