import React, { useRef, useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Caption } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';

interface AuthBannerProps {
  type: 'error' | 'success';
  message: string | null;
}

export const AuthBanner: React.FC<AuthBannerProps> = ({ type, message }) => {
  const { colors, radii, spacing } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(0);
      translateYAnim.setValue(-6);
    }
  }, [message]);

  if (!message) return null;

  const isError = type === 'error';
  // Use exact global status tokens from shared theme: stickyPink vs stickyMint
  const bg = isError ? colors.errorSubtle : colors.successSubtle;
  const border = isError ? colors.stickyPinkBorder : colors.stickyMintBorder;
  const textColor = isError ? colors.error : colors.success;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radii.sm,
          padding: spacing.sm,
          marginBottom: spacing.md,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      accessibilityRole="alert"
    >
      <Caption style={{ color: textColor, fontWeight: '600', lineHeight: 18 }}>
        {message}
      </Caption>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    width: '100%',
  },
});
