import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/ui/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
};

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; icon: number }> = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13, icon: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15, icon: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 16, icon: 20 },
};

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.white,
  outline: colors.primary,
  ghost: colors.primary,
  danger: colors.white,
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  icon,
  iconPosition = 'left',
  containerStyle,
  labelStyle,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        variantStyles[variant],
        {
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
        },
        isDisabled && styles.disabled,
        containerStyle,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColors[variant]} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={s.icon}
              color={labelColors[variant]}
              style={styles.iconLeft}
            />
          )}

          <Text
            style={[
              { fontSize: s.fontSize, fontWeight: '600', color: labelColors[variant] },
              labelStyle,
            ]}
          >
            {label}
          </Text>

          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={s.icon}
              color={labelColors[variant]}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
