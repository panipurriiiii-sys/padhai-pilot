import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'primary' | 'default' | 'outline';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

/**
 * Portal badges: primary/neutral = `.badge-code` (Inter, uppercase, electric), success = `.badge-session` (mint),
 * error = `.badge-urgent` (pink pill), warning = yellow sticky.
 */
export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const { colors, typography, isDark } = useTheme();

  const look = (() => {
    switch (variant) {
      case 'success':
        return { bg: colors.stickyMintBg, fg: colors.stickyMintText, border: colors.stickyMintBorder, radius: 6, upper: false, data: true };
      case 'warning':
        return { bg: colors.stickyYellowBg, fg: colors.stickyYellowText, border: colors.stickyYellowBorder, radius: 6, upper: false, data: true };
      case 'error':
        return { bg: colors.stickyPinkBg, fg: colors.stickyPinkText, border: colors.stickyPinkBorder, radius: 999, upper: true, data: false };
      case 'outline':
        return { bg: 'transparent', fg: colors.textSecondary, border: colors.borderStrong, radius: 8, upper: true, data: true };
      case 'primary':
      case 'default':
      case 'neutral':
      default:
        return {
          bg: variant === 'neutral' ? colors.surfaceElevated : isDark ? colors.primarySubtle : colors.surfaceElevated,
          fg: variant === 'neutral' ? colors.textSecondary : colors.primary,
          border: variant === 'neutral' ? colors.border : 'rgba(22,119,255,0.2)',
          radius: 8,
          upper: true,
          data: true,
        };
    }
  })();

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: look.radius,
          borderWidth: 1,
          backgroundColor: look.bg,
          borderColor: look.border,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: look.data ? typography.fonts.data : typography.fonts.ui,
          fontSize: 10.5,
          fontWeight: look.data && !look.upper ? '600' : '700',
          letterSpacing: look.upper ? 0.5 : 0,
          textTransform: look.upper ? 'uppercase' : 'none',
          color: look.fg,
        }}
      >
        {label}
      </Text>
    </View>
  );
};
