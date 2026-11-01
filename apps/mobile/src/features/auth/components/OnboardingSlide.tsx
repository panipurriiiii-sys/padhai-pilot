import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Illustration } from '@padhai-pilot/assets/native';
import { Title, Body, Caption } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';

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
  const { colors, spacing, radii, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.artworkBox,
          {
            backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceSubtle,
            borderColor: colors.border,
            borderRadius: radii.xl,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Illustration
          name={slide.illustrationName}
          size={160}
          animate="draw"
        />
      </Animated.View>

      <View style={[styles.content, { marginTop: spacing.lg }]}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark ? colors.primarySubtle : '#EFF6FF',
              borderColor: isDark ? colors.primarySubtle : '#BFDBFE',
              borderRadius: radii.full,
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
            },
          ]}
        >
          <Caption style={{ color: colors.primary, fontWeight: '700', letterSpacing: 0.6 }}>
            {slide.badge}
          </Caption>
        </View>

        <Title
          style={[
            styles.title,
            { color: colors.textPrimary, marginTop: spacing.sm, marginBottom: spacing.xs },
          ]}
        >
          {slide.title}
        </Title>

        <Body
          style={[
            styles.description,
            { color: colors.textSecondary, lineHeight: 22 },
          ]}
        >
          {slide.description}
        </Body>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  artworkBox: {
    width: 220,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    borderWidth: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
