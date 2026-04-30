import React, { useState, useCallback } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/ui/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  secureTextEntry,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;
  const showEyeIcon = isPassword && !rightIcon;
  const hasError = !!error;

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const iconColor = hasError ? colors.danger : colors.gray[400];
  const labelColor = hasError ? colors.danger : colors.dark;
  const borderColor = hasError
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.gray[300];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      )}

      <View style={[styles.inputContainer, { borderColor }]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.gray[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />

        {showEyeIcon ? (
          <TouchableOpacity onPress={handleTogglePassword} hitSlop={10}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={10}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={20} color={iconColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export const TextArea: React.FC<
  TextInputProps & {
    label?: string;
    error?: string;
    disabled?: boolean;
  }
> = ({ label, error, disabled = false, ...rest }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;

  const borderColor = hasError
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.gray[300];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: hasError ? colors.danger : colors.dark }]}>
          {label}
        </Text>
      )}

      <View style={[styles.textAreaContainer, { borderColor }]}>
        <TextInput
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.textArea}
          placeholderTextColor={colors.gray[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          {...rest}
        />
      </View>

      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 52,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
  },
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 14,
  },
  textArea: {
    fontSize: 15,
    color: colors.dark,
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});
