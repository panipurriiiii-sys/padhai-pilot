import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  StatusBar,
  Text,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { OnboardingPagination } from '../components/OnboardingPagination';
import { OnboardingImages } from '../components/onboardingImages';

export interface OnboardingSlideInfo {
  id: string;
  badge: string;
  title: string;
  description: string;
}

const ONBOARDING_SLIDES: OnboardingSlideInfo[] = [
  {
    id: 'study',
    badge: 'LEARN & GROW',
    title: 'Your Study Space',
    description: 'Track your batches, class timings, and homework all in one place with real-time updates.',
  },
  {
    id: 'attendance',
    badge: 'STAY CONSISTENT',
    title: 'Daily Attendance',
    description: 'Mark attendance smoothly and stay updated with live faculty announcements.',
  },
  {
    id: 'milestones',
    badge: 'REACH YOUR GOAL',
    title: 'Track Your Progress',
    description: 'Check test scores, fee receipts, and overall performance report cards anytime.',
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
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const totalSlides = ONBOARDING_SLIDES.length;
  const isLast = activeIndex === totalSlides - 1;
  const currentSlide = ONBOARDING_SLIDES[activeIndex] || ONBOARDING_SLIDES[0];
  const currentBgImage = OnboardingImages[activeIndex] || OnboardingImages[0];

  const handleNext = () => {
    if (activeIndex < totalSlides - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const topInset = Math.max(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 24);
  const horizontalPad = windowWidth > 480 ? 32 : 20;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Fullscreen Wallpaper Background Layer */}
      <Image
        source={currentBgImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* 2. Top-to-Bottom Readability Tint */}
      <View style={styles.overlayTint} />

      {/* 3. Foreground Interactive Layer (Absolute fill with high elevation to GUARANTEE visibility on Android) */}
      <View
        style={[
          styles.foregroundContainer,
          {
            paddingTop: topInset,
            paddingBottom: bottomInset,
            paddingHorizontal: horizontalPad,
          },
        ]}
      >
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.sessionBadge}>
            <View style={styles.sessionDot} />
            <Text style={[styles.sessionText, { fontFamily: typography.fonts.ui }]}>
              Session 2026–27
            </Text>
          </View>

          <Pressable
            onPress={onFinish}
            hitSlop={12}
            style={styles.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={[styles.skipText, { fontFamily: typography.fonts.ui }]}>
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Center / Lower Content Area */}
        <View style={styles.bottomArea}>
          {/* Frosted Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.badgeWrap}>
              <Text style={[styles.badgeText, { fontFamily: typography.fonts.ui }]}>
                {currentSlide.badge}
              </Text>
            </View>

            <Text style={[styles.titleText, { fontFamily: typography.fonts.display }]}>
              {currentSlide.title}
            </Text>

            <Text style={[styles.descText, { fontFamily: typography.fonts.ui }]}>
              {currentSlide.description}
            </Text>
          </View>

          {/* Dots Indicator */}
          <View style={styles.paginationWrap}>
            <OnboardingPagination
              total={totalSlides}
              activeIndex={activeIndex}
              onSelectIndex={setActiveIndex}
            />
          </View>

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

          {/* Secondary Sign In Navigation */}
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
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 8, 0.4)',
  },
  foregroundContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    elevation: 50,
  },
  topBar: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 13, 18, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  sessionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 13, 18, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomArea: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(10, 13, 18, 0.82)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeWrap: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 119, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(22, 119, 255, 0.5)',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  descText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.82)',
    textAlign: 'center',
  },
  paginationWrap: {
    marginBottom: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#1677FF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
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
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  loginLinkBold: {
    fontWeight: '800',
    textDecorationLine: 'underline',
    color: '#FFFFFF',
  },
});
