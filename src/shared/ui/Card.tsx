import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, spacing, borderRadius } from '@/shared/ui/theme';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  variant = 'default',
}) => {
  return (
    <View style={[variantStyles[variant], style]}>
      {title && (
        <Text style={[styles.title, subtitle && styles.titleWithSubtitle]}>{title}</Text>
      )}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
};

const variantStyles: Record<Required<CardProps['variant']>, ViewStyle> = {
  default: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  elevated: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  outlined: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
  },
  titleWithSubtitle: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 12,
  },
});
