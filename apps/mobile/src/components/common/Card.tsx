import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { paperShadow } from '../../theme/shadows';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** flat = .paper-card, elevated = recessed surface, outlined = border only, selected = .paper-card-selected */
  variant?: 'flat' | 'elevated' | 'outlined' | 'selected';
}

/** The Teacher Portal's `.paper-card`: white sheet, warm 1px border, 16px radius, soft warm shadow. */
export const Card: React.FC<CardProps> = ({ children, style, onPress, variant = 'flat' }) => {
  const { colors, spacing, radii, isDark } = useTheme();

  const base: ViewStyle = {
    backgroundColor: variant === 'elevated' ? colors.surfaceElevated : variant === 'selected' ? colors.primarySubtle : colors.surface,
    borderColor: variant === 'selected' ? colors.primary : colors.border,
    borderWidth: variant === 'selected' ? 1.5 : 1,
    borderRadius: variant === 'elevated' ? radii.md : radii.lg,
    padding: spacing.lg,
    ...(variant === 'elevated' || variant === 'outlined' ? {} : paperShadow(isDark)),
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { transform: [{ scale: 0.985 }], borderColor: colors.borderStrong }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
};
