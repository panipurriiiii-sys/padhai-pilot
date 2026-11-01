import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/common/Button';
import { useTheme } from '../../../theme/ThemeContext';
import { OnboardingSlide, OnboardingSlideData } from '../components/OnboardingSlide';
import { OnboardingPagination } from '../components/OnboardingPagination';
import { LuxuryHeader } from '../components/LuxuryHeader';

const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 'study',
    artType: 'study',
    badge: 'STUDY ZONE',
    title: 'Focus & Master Your Goals',
    subtitle: 'Lofi academic sanctuary',
    description:
      'Stay in the zone with organized batch notes, homework trackers, and interactive study routines.',
  },
  {
    id: 'classroom',
    artType: 'classroom',
    badge: 'TEAM & FACULTY',
    title: 'Learn Alongside Your Batch',
    subtitle: 'Direct mentorship & live updates',
    description:
      'Seamless attendance marking, lecture timetables, and instant faculty announcements in real time.',
  },
  {
    id: 'milestone',
    artType: 'milestone',
    badge: 'LEVEL UP',
    title: 'Celebrate Every Milestone',
    subtitle: 'Report cards & progress streaks',
    description:
      'Track your test scores, fee receipts, and performance streaks as you conquer every examination.',
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
  const { colors, spacing } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const activeSlide = ONBOARDING_SLIDES[activeIndex];

  return (
    <ScreenContainer style={styles.container}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <LuxuryHeader />
      </View>

      <View style={styles.sliderContainer}>
        <OnboardingSlide slide={activeSlide} isActive />
      </View>

      <View style={[styles.bottomContainer, { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }]}>
        <OnboardingPagination
          total={ONBOARDING_SLIDES.length}
          activeIndex={activeIndex}
          onSelectIndex={setActiveIndex}
        />

        <View style={[styles.actionRow, { marginTop: spacing.md }]}>
          <Button
            title={activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Start Journey →' : 'Continue →'}
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={styles.actionBtn}
          />

          <Button
            title="Already have an account? Sign In"
            variant="ghost"
            size="md"
            onPress={onLoginPress}
            style={{ marginTop: spacing.xs }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  sliderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    width: '100%',
  },
  actionRow: {
    width: '100%',
  },
  actionBtn: {
    width: '100%',
  },
});
