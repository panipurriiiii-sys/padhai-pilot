import React, { useState } from 'react';
import { View, StyleSheet, Image, StatusBar, Text, Pressable } from 'react-native';
import { Button } from '../../../components/common/Button';
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
  const { spacing, typography } = useTheme();
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fullscreen background image with absolute positioning (modern React Native pattern) */}
      <Image
        source={currentBgImage}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Soft gradient/vignette overlay for crisp readability */}
      <View style={styles.scrimOverlay}>
        {/* Top Session Pill */}
        <View style={[styles.topBar, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.sessionBadge}>
            <Text style={[styles.sessionText, { fontFamily: typography.fonts.ui }]}>
              Session 2026–27
            </Text>
          </View>
        </View>

        {/* Clean Typography (No bulky box/card behind text) */}
        <View style={styles.slideContainer}>
          <OnboardingSlide slide={activeSlide} isActive />
        </View>

        {/* Bottom Pagination & Clean Primary Button */}
        <View style={[styles.bottomContainer, { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }]}>
          <OnboardingPagination
            total={ONBOARDING_SLIDES.length}
            activeIndex={activeIndex}
            onSelectIndex={setActiveIndex}
          />

          <View style={[styles.actionRow, { marginTop: spacing.md }]}>
            <Button
              title={activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
              variant="primary"
              size="lg"
              onPress={handleNext}
              style={styles.actionBtn}
            />

            <Pressable
              onPress={onLoginPress}
              hitSlop={12}
              style={styles.loginLinkWrap}
            >
              <Text style={[styles.loginLinkText, { fontFamily: typography.fonts.ui }]}>
                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'space-between',
    paddingTop: 48,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sessionBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  sessionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  bottomContainer: {
    width: '100%',
  },
  actionRow: {
    width: '100%',
    alignItems: 'center',
  },
  actionBtn: {
    width: '100%',
  },
  loginLinkWrap: {
    paddingVertical: 12,
    marginTop: 4,
  },
  loginLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loginLinkBold: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
