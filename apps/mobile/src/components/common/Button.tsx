import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Text,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const { colors, spacing, radii, typography } = useTheme();

  const minHeight = size === 'lg' ? 52 : 46;
  const paddingHorizontal = size === 'lg' ? spacing.xl : spacing.lg;

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.surfaceSubtle;
    switch (variant) {
      case 'primary':
        return pressed ? colors.textPrimary : colors.primary;
      case 'secondary':
        return pressed ? colors.borderStrong : colors.surfaceSubtle;
      case 'danger':
        return pressed ? '#B91C1C' : colors.error;
      case 'ghost':
        return pressed ? colors.surfaceSubtle : 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.primaryContrast;
      case 'secondary':
        return colors.textPrimary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.primaryContrast;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight,
          paddingHorizontal,
          borderRadius: radii.md,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.primaryContrast : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize: typography.sizes.base,
              fontWeight: typography.weights.semibold,
              color: getTextColor(),
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
});

