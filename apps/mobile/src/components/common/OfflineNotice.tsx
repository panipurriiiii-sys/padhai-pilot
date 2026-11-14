import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from './Icon';

export const OfflineNotice: React.FC<{ message?: string }> = ({
  message = 'Offline mode · Showing cached data',
}) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.warningSubtle || '#FFFBEB',
          borderColor: colors.warning || '#F59E0B',
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <Icon name="alert-triangle" size={14} color={colors.warning || '#D97706'} />
      <Text
        style={[
          styles.text,
          {
            color: colors.textPrimary,
            fontFamily: typography.fonts.ui,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
