import React, { memo } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { paperShadow } from '../../theme/shadows';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** flat = clean card, elevated = recessed surface, outlined = border only, selected = active card */
  variant?: 'flat' | 'elevated' | 'outlined' | 'selected';
}

/** Clean luxury surface card with soft ambient shadow and refined micro-border. Memoized for high performance. */
export const Card: React.FC<CardProps> = memo(({ children, style, onPress, variant = 'flat' }) => {
  const { colors, spacing, radii, isDark } = useTheme();

  const base: ViewStyle = {
    backgroundColor:
      variant === 'elevated'
        ? colors.surfaceElevated
        : variant === 'selected'
        ? colors.primarySubtle
        : colors.surface,
    borderColor:
      variant === 'selected'
        ? colors.primary
        : variant === 'outlined'
        ? colors.border
        : colors.borderSubtle,
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
        style={({ pressed }) => [
          base,
          pressed && { transform: [{ scale: 0.985 }], opacity: 0.92, borderColor: colors.borderStrong },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
});

Card.displayName = 'Card';
