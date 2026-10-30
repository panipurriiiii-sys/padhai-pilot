import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Text,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors, spacing, radii, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  return (
    <View style={[styles.container, { marginBottom: spacing.md }, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              fontFamily: typography.fonts.ui,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.medium,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            fontFamily: typography.fonts.ui,
            minHeight: 48,
            paddingHorizontal: spacing.lg,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceSubtle,
            borderColor,
            borderWidth: isFocused ? 1.5 : 1,
            color: colors.textPrimary,
            fontSize: typography.sizes.base,
          },
          style,
        ]}
        placeholderTextColor={colors.textFaint || colors.textMuted}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <Text
          style={[
            styles.errorText,
            {
              fontFamily: typography.fonts.ui,
              fontSize: typography.sizes.xs,
              color: colors.error,
              marginTop: spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={[
            styles.hintText,
            {
              fontFamily: typography.fonts.ui,
              fontSize: typography.sizes.xs,
              color: colors.textMuted,
              marginTop: spacing.xs,
            },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {},
  input: {},
  errorText: {},
  hintText: {},
});

