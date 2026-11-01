import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

export interface OnboardingSlideData {
  id: string;
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
  const { radii, typography } = useTheme();
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
          friction: 8,
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
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: floatAnim }],
        },
      ]}
    >
      <View style={[styles.badgeWrap, { borderRadius: radii.full }]}>
        <Text style={[styles.badgeText, { fontFamily: typography.fonts.ui }]}>
          {slide.badge}
        </Text>
      </View>

      <Text style={[styles.title, { fontFamily: typography.fonts.display }]}>
        {slide.title}
      </Text>

      <Text style={[styles.description, { fontFamily: typography.fonts.ui }]}>
        {slide.description}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  badgeWrap: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
