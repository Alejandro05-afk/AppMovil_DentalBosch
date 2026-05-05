import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/ui/theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChangeText = useCallback(
    (text: string, index: number) => {
      const chars = value.split('');
      chars[index] = text;
      const newValue = chars.join('').slice(0, length);
      onChange(newValue);

      if (text && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, onChange, length],
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const chars = value.split('');
        chars[index - 1] = '';
        onChange(chars.join(''));
      }
    },
    [value, onChange],
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  const handleClear = useCallback(() => {
    onChange('');
    inputRefs.current[0]?.focus();
  }, [onChange]);

  return (
    <View style={styles.container}>
      <View style={styles.inputsRow}>
        {Array.from({ length }, (_, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = !!value[index];
          const hasError = !!error;

          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.input,
                isFocused && styles.inputFocused,
                hasError && styles.inputError,
                hasValue && styles.inputFilled,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={value[index] || ''}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              editable={!disabled}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          );
        })}
      </View>

      <View style={styles.actionsRow}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: colors.dark,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '08',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 20,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    flex: 1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    fontSize: 13,
    color: colors.gray[500],
  },
});
