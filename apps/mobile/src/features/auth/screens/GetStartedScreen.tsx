import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  StatusBar,
  Text,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { OnboardingSlide, OnboardingSlideData } from '../components/OnboardingSlide';
import { OnboardingPagination } from '../components/OnboardingPagination';
import { OnboardingImages } from '../components/onboardingImages';

const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 'campus',
    badge: 'LEARN & GROW',
    title: 'Your Study Space',
    subtitle: 'Daily routine',
    description: 'Track your batches, class timings, and homework all in one place.',
  },
  {
    id: 'golden_hour',
    badge: 'STAY CONSISTENT',
    title: 'Daily Attendance',
    subtitle: 'Never miss a class',
    description: 'Mark attendance smoothly and stay updated with teacher announcements.',
  },
  {
    id: 'twilight_vista',
    badge: 'REACH YOUR GOAL',
    title: 'Track Your Progress',
    subtitle: 'Results & milestones',
    description: 'Check test scores, fee receipts, and overall performance anytime.',
  },
];

interface GetStartedScreenProps {
  onFinish: () => void;
  onLoginPress: () => void;
}

export const GetStartedScreen: React.FC<GetStartedScreenProps> = ({
  onFinish,
  onLoginPress,
}) => {
  const { typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const activeSlide = ONBOARDING_SLIDES[activeIndex];
  const currentBgImage = OnboardingImages[activeIndex] || OnboardingImages[0];
  const isLast = activeIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Fullscreen Background Image */}
      <Image
        source={currentBgImage}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* 2. Top-to-Bottom Contrast Scrim */}
      <View style={styles.scrimOverlay} />

      {/* 3. Safe Foreground Content */}
      <View
        style={[
          styles.safeContainer,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Top Session Pill */}
        <View style={styles.topBar}>
          <View style={styles.sessionBadge}>
            <Text style={[styles.sessionText, { fontFamily: typography.fonts.ui }]}>
              Session 2026–27
            </Text>
          </View>
        </View>

        {/* Center Text Presentation */}
        <View style={styles.slideContainer}>
          <OnboardingSlide slide={activeSlide} isActive />
        </View>

        {/* Bottom Interactive Dock (Prominent & High-Contrast) */}
        <View style={styles.bottomDock}>
          <OnboardingPagination
            total={ONBOARDING_SLIDES.length}
            activeIndex={activeIndex}
            onSelectIndex={setActiveIndex}
          />

          {/* Primary High-Contrast Action Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleNext}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get Started' : 'Next slide'}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: typography.fonts.ui }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>

          {/* Secondary Sign In Link */}
          <Pressable
            onPress={onLoginPress}
            hitSlop={14}
            style={styles.loginLinkWrap}
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account"
          >
            <Text style={[styles.loginLinkText, { fontFamily: typography.fonts.ui }]}>
              Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050608',
  },
  scrimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)', // increased opacity for text & button pop
  },
  safeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 20,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  sessionBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  sessionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomDock: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#1677FF', // Teacher Portal Brand Electric Blue
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  loginLinkWrap: {
    paddingVertical: 14,
    marginTop: 4,
  },
  loginLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loginLinkBold: {
    fontWeight: '800',
    textDecorationLine: 'underline',
    color: '#FFFFFF',
  },
});
