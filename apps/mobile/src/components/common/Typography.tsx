import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface TypographyProps extends TextProps {
  children: React.ReactNode;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export const Title: React.FC<TypographyProps> = ({ children, style, color, align, ...props }) => {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typography.sizes.title,
          lineHeight: typography.lineHeights.title,
          fontWeight: typography.weights.bold,
          color: color || colors.textPrimary,
          textAlign: align,
          letterSpacing: -0.5,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Subtitle: React.FC<TypographyProps> = ({ children, style, color, align, ...props }) => {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typography.sizes.lg,
          lineHeight: typography.lineHeights.lg,
          fontWeight: typography.weights.semibold,
          color: color || colors.textPrimary,
          textAlign: align,
          letterSpacing: -0.2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Body: React.FC<TypographyProps> = ({ children, style, color, align, ...props }) => {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typography.sizes.base,
          lineHeight: typography.lineHeights.base,
          fontWeight: typography.weights.regular,
          color: color || colors.textSecondary,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Caption: React.FC<TypographyProps> = ({ children, style, color, align, ...props }) => {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typography.sizes.xs,
          lineHeight: typography.lineHeights.xs,
          fontWeight: typography.weights.medium,
          color: color || colors.textMuted,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const StatValue: React.FC<TypographyProps> = ({ children, style, color, align, ...props }) => {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typography.sizes.xxl,
          lineHeight: typography.lineHeights.xxl,
          fontWeight: typography.weights.bold,
          color: color || colors.textPrimary,
          textAlign: align,
          letterSpacing: -0.5,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Label: React.FC<TypographyProps> = ({ children, style, color, align, ...props }) => {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typography.sizes.sm,
          lineHeight: typography.lineHeights.sm,
          fontWeight: typography.weights.semibold,
          color: color || colors.textSecondary,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

