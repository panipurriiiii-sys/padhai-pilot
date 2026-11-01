import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { paperShadow } from '../../../theme/shadows';
import { HeroHubArt, RosterBatchArt, FinanceLedgerArt } from './LuxuryAuthArt';

export interface OnboardingSlideData {
  id: string;
  artType: 'hub' | 'roster' | 'finance';
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
  const floatAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(floatAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      floatAnim.setValue(8);
    }
  }, [isActive]);

  const renderArt = () => {
    switch (slide.artType) {
      case 'roster':
        return <RosterBatchArt size={230} />;
      case 'finance':
        return <FinanceLedgerArt size={230} />;
      case 'hub':
      default:
        return <HeroHubArt size={230} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Illustrated Canvas */}
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
        {!isDark && <View style={[styles.tapeStrip, { borderColor: colors.border }]} />}
        <View style={styles.illustrationWrap}>{renderArt()}</View>
      </Animated.View>

      {/* Slide Text */}
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
    width: 270,
    height: 195,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
    marginTop: 6,
  },
  tapeStrip: {
    position: 'absolute',
    top: -9,
    width: 72,
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
    marginTop: 22,
  },
  badgeWrap: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 25,
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
