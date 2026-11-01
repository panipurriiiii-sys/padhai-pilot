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

const TOTAL_SLIDES = OnboardingImages.length || 3;

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

  const handleNext = () => {
    if (activeIndex < TOTAL_SLIDES - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const currentBgImage = OnboardingImages[activeIndex] || OnboardingImages[0];
  const isLast = activeIndex === TOTAL_SLIDES - 1;

  // Responsive safe insets
  const bottomInset = Math.max(insets.bottom, 24);
  const horizontalPadding = windowWidth > 480 ? 32 : 20;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Fullscreen Background Image Layer (Unobstructed Artwork) */}
      <Image
        source={currentBgImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* 2. Subtle Bottom Gradient/Tint so buttons pop crisply against any artwork */}
      <View style={styles.bottomScrim} />

      {/* 3. Bottom Dock: Responsive, centered, and safely positioned */}
      <View
        style={[
          styles.contentContainer,
          {
            paddingBottom: bottomInset,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.bottomDock}>
          <OnboardingPagination
            total={TOTAL_SLIDES}
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
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
    backgroundColor: 'rgba(5, 6, 8, 0.45)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomDock: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#1677FF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
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
