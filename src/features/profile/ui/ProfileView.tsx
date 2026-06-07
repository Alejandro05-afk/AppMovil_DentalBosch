import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/entities/user/model/user.types';
import { Card, colors, spacing } from '@/shared/ui';

interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
  onChangePassword: () => void;
}

export function ProfileView({ profile, onEdit, onChangePassword }: ProfileViewProps) {
  return (
    <View style={styles.container}>
      {/* Datos Personales */}
      <Card variant="elevated" style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Datos personales</Text>
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Cédula:</Text>
          <View style={styles.lockedValue}>
            <Text style={styles.dataValueLocked}>{profile.cedula}</Text>
            <Ionicons name="lock-closed" size={14} color={colors.gray[400]} />
          </View>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Teléfono:</Text>
          <Text style={styles.dataValue}>{profile.telefono}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Género:</Text>
          <Text style={styles.dataValue}>{profile.genero}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Nacimiento:</Text>
          <Text style={styles.dataValue}>{profile.fechaNacimiento}</Text>
        </View>
      </Card>

      {/* Dirección */}
      <Card variant="elevated" style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Dirección</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Calle:</Text>
          <Text style={styles.dataValue}>{profile.direccion?.calle || '—'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Ciudad:</Text>
          <Text style={styles.dataValue}>{profile.direccion?.ciudad || '—'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Provincia:</Text>
          <Text style={styles.dataValue}>{profile.direccion?.provincia || '—'}</Text>
        </View>
      </Card>

      {/* Contacto Emergencia */}
      <Card variant="elevated" style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Contacto de emergencia</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Nombre:</Text>
          <Text style={styles.dataValue}>{profile.contactoEmergencia?.nombre || '—'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Teléfono:</Text>
          <Text style={styles.dataValue}>{profile.contactoEmergencia?.telefono || '—'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Parentesco:</Text>
          <Text style={styles.dataValue}>{profile.contactoEmergencia?.parentesco || '—'}</Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  editBtn: {
    padding: spacing.xs,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  dataLabel: {
    width: 90,
    fontSize: 14,
    color: colors.gray[500],
  },
  dataValue: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
    fontWeight: '500',
  },
  lockedValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dataValueLocked: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
  },
});
