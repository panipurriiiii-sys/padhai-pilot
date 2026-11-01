import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface AuthBannerProps {
  type: 'error' | 'success';
  message: string | null;
  onDismiss?: () => void;
}

export const AuthBanner: React.FC<AuthBannerProps> = ({ type, message, onDismiss }) => {
  const { colors, radii, typography, isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(0);
      translateYAnim.setValue(-8);
    }
  }, [message]);

  if (!message) return null;

  const isError = type === 'error';
  const bg = isError ? colors.stickyPinkBg : colors.stickyMintBg;
  const border = isError ? colors.stickyPinkBorder : colors.stickyMintBorder;
  const textColor = isError ? colors.stickyPinkText : colors.stickyMintText;
  const tagText = isError ? 'Dhayan dein' : 'Badhai ho!';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radii.md,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.iconTag}>
        <Text style={[styles.tagLabel, { color: textColor, fontFamily: typography.fonts.ui }]}>
          {tagText}
        </Text>
      </View>
      <Text style={[styles.message, { color: textColor, fontFamily: typography.fonts.ui }]}>
        {message}
      </Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismissBtn}>
          <Text style={[styles.dismissText, { color: textColor }]}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.2,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginRight: 8,
  },
  tagLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingLeft: 8,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
