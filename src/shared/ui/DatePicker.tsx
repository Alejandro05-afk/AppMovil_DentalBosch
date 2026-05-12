import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/ui/theme';
import { formatToDbDate, parseDbDate } from '@/shared/lib/formSchemas';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

function formatDateDisplay(value: string): string {
  if (!value) return '';
  const date = parseDbDate(value);
  if (!date) return value;
  const day = date.getDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Seleccionar fecha',
  maximumDate,
  minimumDate,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowModal(false);
    }
    if (selectedDate) {
      onChange(formatToDbDate(selectedDate));
    }
  };

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDbDate(value) || new Date(),
        onChange: handleDateChange,
        mode: 'date',
        maximumDate,
        minimumDate,
        display: 'spinner',
      });
    } else {
      setShowModal(true);
    }
  };

  const handleConfirm = () => {
    setShowModal(false);
  };

  const hasValue = !!value;
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.inputContainer,
          hasError && styles.inputError,
          !hasError && hasValue && styles.inputFilled,
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={20} color={hasError ? colors.danger : colors.gray[400]} />
        <Text style={[styles.inputText, !hasValue && styles.placeholderText]}>
          {hasValue ? formatDateDisplay(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <Modal visible={showModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Seleccionar fecha</Text>
                <TouchableOpacity onPress={handleConfirm} style={styles.modalBtn}>
                  <Text style={[styles.modalBtnText, styles.confirmText]}>Hecho</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={parseDbDate(value) || new Date()}
                  onChange={handleDateChange}
                  mode="date"
                  display="spinner"
                  maximumDate={maximumDate}
                  minimumDate={minimumDate}
                  themeVariant="light"
                  textColor={colors.dark}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

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
    color: colors.dark,
  },
  labelError: {
    color: colors.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 52,
    borderColor: colors.gray[300],
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '08',
  },
  inputFilled: {
    borderColor: colors.primary,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    marginLeft: 10,
  },
  placeholderText: {
    color: colors.gray[400],
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  modalBtn: {
    padding: 8,
  },
  modalBtnText: {
    fontSize: 15,
    color: colors.gray[500],
  },
  confirmText: {
    color: colors.primary,
    fontWeight: '600',
  },
  pickerWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
