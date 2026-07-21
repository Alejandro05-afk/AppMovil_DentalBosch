import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/entities/auth/api/auth.service';
import { UserProfile } from '@/entities/user/model/user.types';
import { ProfileHeader } from '@/widgets/profile-header/ProfileHeader';
import { ProfileView, EditProfileForm, EditProfileFormData } from '@/features/profile';
import { Button, colors, spacing } from '@/shared/ui';

export function ProfilePage() {
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getFullProfile();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'No se pudo cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (formData: EditProfileFormData) => {
    setIsLoading(true);
    try {
      await authService.actualizarPerfil(formData);
      const refreshed = await authService.getFullProfile();
      setProfile(refreshed);
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error: any) {
      const mensaje = error.response?.data?.mensaje || 'No se pudo actualizar el perfil';
      Alert.alert('Error', mensaje);
      console.error('Update profile error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {router.canGoBack() || isEditing ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (isEditing) {
              setIsEditing(false);
            } else {
              router.back();
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.headerTitle}>{isEditing ? 'Editar Perfil' : 'Mi Perfil'}</Text>
        <View style={{ width: 44 }} />
      </View>

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
          {!isEditing && <ProfileHeader profile={profile} />}
          
          <View style={styles.content}>
            {isEditing ? (
              <EditProfileForm 
                initialData={profile} 
                onSave={handleSaveProfile} 
                isLoading={isLoading} 
              />
            ) : (
              <>
                <ProfileView 
                  profile={profile} 
                  onEdit={() => setIsEditing(true)} 
                  onChangePassword={() => router.push('/(profile)/change-password')} 
                />
                
                <View style={styles.actionsContainer}>
                  <Button
                    label="Cambiar contraseña"
                    variant="outline"
                    onPress={() => router.push('/(profile)/change-password')}
                    icon="key-outline"
                  />
                </View>
              </>
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
    paddingBottom: spacing['3xl'],
  },
  content: {
    padding: spacing.lg,
  },
  actionsContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
});
