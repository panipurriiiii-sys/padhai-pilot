import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'primary';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const { colors, spacing, radii, typography } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successSubtle, text: colors.success };
      case 'warning':
        return { bg: colors.warningSubtle, text: colors.warning };
      case 'error':
        return { bg: colors.errorSubtle, text: colors.error };
      case 'primary':
        return { bg: colors.primarySubtle, text: colors.primary };
      case 'neutral':
      default:
        return { bg: colors.surfaceSubtle, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radii.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.semibold,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    letterSpacing: 0.2,
  },
});

