import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/shared/ui/theme';

interface DividerProps {
  vertical?: boolean;
  style?: object;
}

export const Divider: React.FC<DividerProps> = ({ vertical = false, style }) => {
  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        style,
      ]}
    />
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
});
