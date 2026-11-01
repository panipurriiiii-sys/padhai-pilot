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

      {/* 2. Soft Reading Tint (Ensures text pops directly over artwork without any boxed containers) */}
      <View style={styles.overlayTint} />

      {/* 3. Foreground Safe Content Layer */}
      <View
        style={[
          styles.safeContainer,
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
            <Text style={styles.sessionText}>
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
            <Text style={styles.skipText}>
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Center Content: Direct Typography, Zero Boxes */}
        <View style={styles.textContainer}>
          <Text style={styles.badgeText}>
            {currentSlide.badge}
          </Text>

          <Text style={styles.titleText}>
            {currentSlide.title}
          </Text>

          <Text style={styles.descText}>
            {currentSlide.description}
          </Text>
        </View>

        {/* Bottom Actions Dock */}
        <View style={styles.bottomArea}>
          <View style={styles.paginationWrap}>
            <OnboardingPagination
              total={totalSlides}
              activeIndex={activeIndex}
              onSelectIndex={setActiveIndex}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get Started' : 'Next slide'}
          >
            <Text style={styles.primaryBtnText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>

          <Pressable
            onPress={onLoginPress}
            hitSlop={14}
            style={styles.loginLinkWrap}
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account"
          >
            <Text style={styles.loginLinkText}>
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
    width: '100%',
    height: '100%',
    backgroundColor: '#050608',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlayTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(5, 6, 8, 0.42)',
  },
  safeContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
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
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 13, 18, 0.65)',
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
    paddingVertical: 5,
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
  textContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  descText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  bottomArea: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  paginationWrap: {
    marginBottom: 12,
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
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#FFFFFF',
  },
});
