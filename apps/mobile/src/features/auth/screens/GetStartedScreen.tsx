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
    id: 'welcome',
    artType: 'hub',
    badge: 'PADHAI PILOT SUITE',
    title: 'Precision Academic Hub',
    subtitle: 'Streamlined tuition & batch tracking',
    description:
      'Manage student rosters, real-time attendance, lesson plans, and results with calm, fluid clarity.',
  },
  {
    id: 'batches',
    artType: 'roster',
    badge: 'BATCHES & CURRICULUM',
    title: 'Effortless Roster Sync',
    subtitle: 'Shared codes and instant access',
    description:
      'Quick student enrollment via batch codes, homework attachments, and interactive student diaries.',
  },
  {
    id: 'finance',
    artType: 'finance',
    badge: 'FEE LEDGER & AUDIT',
    title: 'Transparent Records',
    subtitle: 'Receipts & automated balance alerts',
    description:
      'Verified payment receipts, faculty salary tracking, and real-time fee balance notifications.',
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
            title={activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started →' : 'Continue →'}
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
