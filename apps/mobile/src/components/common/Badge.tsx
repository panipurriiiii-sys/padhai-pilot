import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'primary' | 'default' | 'outline';

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
        return {
          bg: colors.stickyMintBg,
          text: colors.stickyMintText,
          border: colors.stickyMintBorder,
        };
      case 'warning':
        return {
          bg: colors.stickyYellowBg,
          text: colors.stickyYellowText,
          border: colors.stickyYellowBorder,
        };
      case 'error':
        return {
          bg: colors.stickyPinkBg,
          text: colors.stickyPinkText,
          border: colors.stickyPinkBorder,
        };
      case 'primary':
        return {
          bg: colors.stickyBlueBg,
          text: colors.primary,
          border: colors.stickyBlueBorder,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceElevated,
          text: colors.textSecondary,
          border: colors.border,
        };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
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
            fontFamily: typography.fonts.ui,
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

