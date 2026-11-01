import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions } from 'react-native';
import { Illustration } from '@padhai-pilot/assets/native';
import { useTheme } from '../../../theme/ThemeContext';
import { paperShadow } from '../../../theme/shadows';

export interface OnboardingSlideData {
  id: string;
  illustrationName:
    | 'brand/logo-mark'
    | 'onboarding/get-started'
    | 'education/classroom'
    | 'dashboard/fees-payments';
  badge: string;
  title: string;
  subtitle: string;
  description: string;
}

interface OnboardingSlideProps {
  slide: OnboardingSlideData;
  isActive: boolean;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ slide, isActive }) => {
  const { colors, radii, typography, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(floatAnim, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      floatAnim.setValue(10);
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      {/* Visual Canvas Card */}
      <Animated.View
        style={[
          styles.artworkCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.xl,
            opacity: fadeAnim,
            transform: [{ translateY: floatAnim }],
          },
          paperShadow(isDark, 'lift'),
        ]}
      >
        {!isDark && (
          <View
            style={[
              styles.tapeStrip,
              {
                borderColor: colors.border,
              },
            ]}
          />
        )}
        <View style={styles.illustrationWrap}>
          <Illustration name={slide.illustrationName} size={150} animate="draw" />
        </View>
      </Animated.View>

      {/* Slide Text Content */}
      <View style={styles.textContainer}>
        <View
          style={[
            styles.badgeWrap,
            {
              backgroundColor: colors.stickyBlueBg,
              borderColor: colors.stickyBlueBorder,
              borderRadius: radii.full,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: colors.stickyBlueText,
                fontFamily: typography.fonts.ui,
              },
            ]}
          >
            {slide.badge}
          </Text>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              fontFamily: typography.fonts.display,
            },
          ]}
        >
          {slide.title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontFamily: typography.fonts.ui,
            },
          ]}
        >
          {slide.description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  artworkCard: {
    width: 260,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
    marginTop: 8,
  },
  tapeStrip: {
    position: 'absolute',
    top: -9,
    width: 70,
    height: 18,
    backgroundColor: 'rgba(238, 233, 226, 0.75)',
    borderRadius: 2,
    borderWidth: 1,
    transform: [{ rotate: '-1.5deg' }],
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  badgeWrap: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
