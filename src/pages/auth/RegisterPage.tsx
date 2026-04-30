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
import { authStorage } from '@/shared/api/authStorage';
import { RegisterRequest } from '@/entities/auth/model/auth.types';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');

  // Direccion
  const [calle, setCalle] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');

  // Contacto emergencia
  const [emerNombre, setEmerNombre] = useState('');
  const [emerTelefono, setEmerTelefono] = useState('');
  const [emerParentesco, setEmerParentesco] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterRequest = {
        nombre: name,
        apellido,
        email,
        password,
        rol: 'paciente',
        cedula,
        telefono: phone,
        fechaNacimiento,
        genero,
        direccion: {
          calle,
          ciudad,
          provincia,
        },
        contactoEmergencia: {
          nombre: emerNombre,
          telefono: emerTelefono,
          parentesco: emerParentesco,
        },
      };

      const response = await authService.register(payload);
      if (response.token) {
        await authStorage.setToken(response.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Éxito', response.mensaje || 'Registro exitoso');
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert('Error', error.response?.data?.mensaje || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

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

            <Text style={styles.pageTitle}>Crear cuenta</Text>
            <Text style={styles.pageSubtitle}>
              Completa tus datos para comenzar a gestionar tu consultorio.
            </Text>

            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Datos Personales</Text>
              <Input
                label="Nombre"
                placeholder="Juan"
                value={name}
                onChangeText={setName}
                leftIcon="person-outline"
              />
              <Input
                label="Apellido"
                placeholder="Pérez"
                value={apellido}
                onChangeText={setApellido}
                leftIcon="person-outline"
              />
              <Input
                label="Cédula"
                placeholder="1720106663"
                value={cedula}
                onChangeText={setCedula}
                keyboardType="numeric"
                leftIcon="card-outline"
              />
              <Input
                label="Fecha de Nacimiento"
                placeholder="YYYY-MM-DD"
                value={fechaNacimiento}
                onChangeText={setFechaNacimiento}
                leftIcon="calendar-outline"
              />
              <Input
                label="Género"
                placeholder="masculino / femenino"
                value={genero}
                onChangeText={setGenero}
                leftIcon="male-female-outline"
              />
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Contacto y Acceso</Text>
              <Input
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />
              <Input
                label="Teléfono"
                placeholder="0991234145"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />
              <Input
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />
              <Input
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                leftIcon="shield-checkmark-outline"
              />
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Dirección</Text>
              <Input
                label="Calle"
                placeholder="Calle Principal 123"
                value={calle}
                onChangeText={setCalle}
                leftIcon="home-outline"
              />
              <Input
                label="Ciudad"
                placeholder="Quito"
                value={ciudad}
                onChangeText={setCiudad}
                leftIcon="business-outline"
              />
              <Input
                label="Provincia"
                placeholder="Pichincha"
                value={provincia}
                onChangeText={setProvincia}
                leftIcon="map-outline"
              />
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
              <Input
                label="Nombre"
                placeholder="María García"
                value={emerNombre}
                onChangeText={setEmerNombre}
                leftIcon="person-outline"
              />
              <Input
                label="Teléfono"
                placeholder="0998765432"
                value={emerTelefono}
                onChangeText={setEmerTelefono}
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />
              <Input
                label="Parentesco"
                placeholder="Esposa / Hermano"
                value={emerParentesco}
                onChangeText={setEmerParentesco}
                leftIcon="people-outline"
              />
            </Card>

            <Button
              label="Crear cuenta"
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleRegister}
              icon={isLoading ? undefined : 'checkmark-circle'}
              iconPosition="right"
              containerStyle={styles.submitBtn}
            />

            <View style={styles.loginLinkSection}>
              <Text style={styles.loginLinkText}>
                ¿Ya tienes cuenta?{' '}
                <Text
                  style={styles.loginLink}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  Inicia sesión
                </Text>
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
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  loginLinkSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
