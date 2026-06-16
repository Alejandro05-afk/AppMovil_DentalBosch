import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/ui/theme';

interface DividerProps {
  vertical?: boolean;
  label?: string;
  style?: object;
}

export const Divider: React.FC<DividerProps> = ({ vertical = false, label, style }) => {
  if (!label) {
    return (
      <View
        style={[
          vertical ? styles.vertical : styles.horizontal,
          style,
        ]}
      />
    );
  }

  return (
    <View style={[styles.horizontalWithLabel, style]}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray[200],
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  horizontalWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  label: {
    color: colors.gray[500],
    fontSize: 13,
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
});
