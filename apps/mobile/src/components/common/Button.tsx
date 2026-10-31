import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { electricGlow, paperShadow } from '../../theme/shadows';
import { Icon, IconName } from './Icon';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  /** primary = .btn-primary, secondary = .btn-secondary, subtle = .btn-subtle */
  variant?: 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'outline';
  size?: 'md' | 'lg' | 'sm' | 'small';
  icon?: IconName;
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
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const { colors, radii, typography, isDark } = useTheme();
  const small = size === 'sm' || size === 'small';

  const palette = {
    primary: { bg: colors.primary, fg: '#FFFFFF', border: colors.primary, shadow: electricGlow() },
    secondary: { bg: colors.surface, fg: colors.textPrimary, border: colors.border, shadow: paperShadow(isDark) },
    subtle: {
      bg: isDark ? colors.primarySubtle : '#EFF6FF',
      fg: colors.primary,
      border: isDark ? colors.primarySubtle : '#BFDBFE',
      shadow: {} as ViewStyle,
    },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent', shadow: {} as ViewStyle },
    outline: { bg: 'transparent', fg: colors.textPrimary, border: colors.borderStrong, shadow: {} as ViewStyle },
    danger: { bg: colors.error, fg: '#FFFFFF', border: colors.error, shadow: {} as ViewStyle },
  }[variant];

  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: small ? 36 : 44,
          paddingHorizontal: small ? 14 : 18,
          paddingVertical: small ? 6 : 10,
          borderRadius: radii.md,
          borderWidth: 1,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: inactive ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        inactive ? {} : palette.shadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Icon name={icon} size={small ? 14 : 16} color={palette.fg} /> : null}
          <Text
            numberOfLines={1}
            style={[
              { fontFamily: typography.fonts.ui, fontWeight: '700', fontSize: small ? 12 : 13, color: palette.fg },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};
