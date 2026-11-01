import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  StatusBar,
  Text,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { OnboardingSlide, OnboardingSlideData } from '../components/OnboardingSlide';
import { OnboardingPagination } from '../components/OnboardingPagination';
import { OnboardingImages } from '../components/onboardingImages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const topInset = Math.max(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 24);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Fullscreen Background Image Layer */}
      <Image
        source={currentBgImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* 2. Top-to-Bottom Readability Tint */}
      <View style={styles.overlayTint} />

      {/* 3. Absolute Top Bar */}
      <View style={[styles.topBar, { top: topInset }]}>
        <View style={styles.sessionBadge}>
          <Text style={[styles.sessionText, { fontFamily: typography.fonts.ui }]}>
            Session 2026–27
          </Text>
        </View>
      </View>

      {/* 4. Center Slide Content (Text directly over image) */}
      <View style={styles.centerContent}>
        <OnboardingSlide slide={activeSlide} isActive />
      </View>

      {/* 5. Absolute Fixed Bottom Dock (Directly Overlapping Background) */}
      <View style={[styles.bottomDock, { bottom: bottomInset }]}>
        <OnboardingPagination
          total={ONBOARDING_SLIDES.length}
          activeIndex={activeIndex}
          onSelectIndex={setActiveIndex}
        />

        <TouchableOpacity
          activeOpacity={0.85}
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
  );
};

const styles = StyleSheet.create({
  root: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: '#050608',
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayTint: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  topBar: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
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
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 180, // leaves room above bottom dock
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  bottomDock: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#1677FF', // Teacher Portal Brand Electric Blue
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
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
    paddingVertical: 12,
    marginTop: 2,
  },
  loginLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  loginLinkBold: {
    fontWeight: '800',
    textDecorationLine: 'underline',
    color: '#FFFFFF',
  },
});
