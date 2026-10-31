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
    : colors.borderStrong;

  return (
    <View style={[styles.container, { marginBottom: spacing.md }, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              fontFamily: typography.fonts.ui,
              fontSize: 11,
              fontWeight: typography.weights.bold,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: colors.textMuted,
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
            minHeight: props.multiline ? 92 : 46,
            paddingHorizontal: 14,
            paddingVertical: props.multiline ? 12 : 8,
            textAlignVertical: props.multiline ? 'top' : 'center',
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            borderColor,
            borderWidth: 1,
            color: colors.textPrimary,
            fontSize: 14,
            ...(isFocused
              ? { shadowColor: '#1677FF', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 1 }
              : {}),
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

