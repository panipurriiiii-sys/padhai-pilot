import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface AuthBannerProps {
  type: 'error' | 'success';
  message: string | null;
  onDismiss?: () => void;
}

export const AuthBanner: React.FC<AuthBannerProps> = ({ type, message, onDismiss }) => {
  const { colors, radii, typography } = useTheme();

  if (!message) return null;

  const isError = type === 'error';
  const bg = isError ? colors.stickyPinkBg : colors.stickyMintBg;
  const border = isError ? colors.stickyPinkBorder : colors.stickyMintBorder;
  const textColor = isError ? colors.stickyPinkText : colors.stickyMintText;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radii.md,
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={[styles.dot, { backgroundColor: isError ? colors.error : colors.success }]} />
      <Text style={[styles.message, { color: textColor, fontFamily: typography.fonts.ui }]}>
        {message}
      </Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={10} style={styles.dismissBtn}>
          <Text style={[styles.dismissText, { color: textColor }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingLeft: 8,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
