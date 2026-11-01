import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/common/Button';
import { useTheme } from '../../../theme/ThemeContext';
import { OnboardingSlide, OnboardingSlideData } from '../components/OnboardingSlide';
import { OnboardingPagination } from '../components/OnboardingPagination';

const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 'welcome',
    illustrationName: 'brand/logo-mark',
    badge: 'PADHAI PILOT SUITE',
    title: 'Precision Academic Hub',
    subtitle: 'Streamlined tuition & batch tracking',
    description:
      'Manage rosters, daily attendance, fees, schedules, and leaves with seamless zero-friction clarity.',
  },
  {
    id: 'batches',
    illustrationName: 'education/classroom',
    badge: 'BATCHES & CURRICULUM',
    title: 'Effortless Roster Sync',
    subtitle: 'Shared codes and instant access',
    description:
      'Enroll with 6-character batch codes, inspect lesson diaries, access attachments, and monitor homework.',
  },
  {
    id: 'finance',
    illustrationName: 'dashboard/fees-payments',
    badge: 'FEE LEDGER & AUDIT',
    title: 'Transparent Records',
    subtitle: 'Receipts & automated balance alerts',
    description:
      'Detailed receipt breakdowns, salary tracking for faculty, and real-time payment status.',
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

  const handleSkip = () => {
    onFinish();
  };

  const activeSlide = ONBOARDING_SLIDES[activeIndex];

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.topBar, { paddingHorizontal: spacing.lg }]}>
        <Button
          title="Skip"
          variant="ghost"
          size="sm"
          onPress={handleSkip}
          style={styles.skipButton}
        />
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
            title={activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  skipButton: {
    alignSelf: 'flex-end',
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

