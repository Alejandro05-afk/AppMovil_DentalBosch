import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/shared/ui/theme';
import { Button } from '@/shared/ui/Button';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Algo saliÃ³ mal',
  message = 'No pudimos cargar la informaciÃ³n. IntÃ©ntalo de nuevo.',
  onRetry,
  fullScreen = false,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      {icon || (
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={40} color={colors.danger} />
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <Button
          label="Reintentar"
          variant="primary"
          onPress={onRetry}
          icon="refresh"
          iconPosition="left"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fullScreen: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.danger}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
});
