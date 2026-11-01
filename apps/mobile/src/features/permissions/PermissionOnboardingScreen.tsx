import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Icon, IconName } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import {
  RolePermissionConfig,
  TEACHER_PERMISSIONS,
  STUDENT_PERMISSIONS,
  permissionManager,
} from './permissionManager';

interface PermissionOnboardingScreenProps {
  role?: string;
  userId: string;
  onFinished: () => void;
}

export const PermissionOnboardingScreen: React.FC<PermissionOnboardingScreenProps> = ({
  role,
  userId,
  onFinished,
}) => {
  const { colors, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const isTeacher = role === 'TEACHER' || role === 'FACULTY' || role === 'TUITION_OWNER' || role === 'INSTITUTE_MANAGER';
  const permissions: RolePermissionConfig[] = isTeacher ? TEACHER_PERMISSIONS : STUDENT_PERMISSIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [grantedStates, setGrantedStates] = useState<Record<string, boolean>>({});

  const currentPermission = permissions[currentIndex];
  const isLast = currentIndex === permissions.length - 1;

  const handleNext = async (didGrant: boolean) => {
    setGrantedStates((prev) => ({ ...prev, [currentPermission.key]: didGrant }));
    if (isLast) {
      await permissionManager.markOnboardingCompleted(userId);
      onFinished();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      const granted = await permissionManager.requestPermission(currentPermission.key);
      await handleNext(granted);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = async () => {
    await handleNext(false);
  };

  const handleSkipAll = async () => {
    await permissionManager.markOnboardingCompleted(userId);
    onFinished();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header & Skip Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.badgeRow}>
          <View style={[styles.roleBadge, { backgroundColor: colors.primarySubtle }]}>
            <Text style={[styles.roleBadgeText, { color: colors.primary, fontFamily: typography.fonts.ui }]}>
              {isTeacher ? 'Faculty Setup' : 'Student Setup'}
            </Text>
          </View>
          <Text style={[styles.stepText, { color: colors.textMuted, fontFamily: typography.fonts.ui }]}>
            Step {currentIndex + 1} of {permissions.length}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip permission setup"
          onPress={handleSkipAll}
          hitSlop={10}
          style={styles.skipButton}
        >
          <Text style={[styles.skipButtonText, { color: colors.textMuted, fontFamily: typography.fonts.ui }]}>
            Skip All
          </Text>
        </Pressable>
      </View>

      {/* Progress Indicators */}
      <View style={styles.progressRow}>
        {permissions.map((p, idx) => (
          <View
            key={p.key}
            style={[
              styles.progressBar,
              {
                backgroundColor:
                  idx === currentIndex
                    ? colors.primary
                    : idx < currentIndex
                    ? colors.success
                    : isDark
                    ? '#2C2D31'
                    : '#E5E7EB',
              },
            ]}
          />
        ))}
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Animated Icon Illustration */}
        <View style={[styles.iconContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
            <Icon
              name={currentPermission.icon as IconName}
              size={48}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Title & Editorial Subtitle */}
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.fonts.display }]}>
          {currentPermission.title}
        </Text>

        <Text style={[styles.subtitle, { color: colors.primary, fontFamily: typography.fonts.ui }]}>
          {currentPermission.subtitle}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          {currentPermission.description}
        </Text>

        {/* Highlighted Benefit Box */}
        <View
          style={[
            styles.benefitBox,
            {
              backgroundColor: isDark ? '#1C2230' : '#F0F7FF',
              borderColor: isDark ? '#2D3A54' : '#BAE0FF',
            },
          ]}
        >
          <View style={styles.benefitHeader}>
            <Icon name="check-circle" size={16} color={colors.primary} />
            <Text style={[styles.benefitTitle, { color: colors.primary, fontFamily: typography.fonts.ui }]}>
              Why we need this
            </Text>
          </View>
          <Text style={[styles.benefitText, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}>
            {currentPermission.benefit}
          </Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button
          title={isRequesting ? 'Requesting...' : isLast ? 'Allow & Finish' : 'Allow Access'}
          onPress={handleAllow}
          loading={isRequesting}
          variant="primary"
          size="lg"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not now"
          onPress={handleSkip}
          hitSlop={12}
          style={styles.notNowButton}
        >
          <Text style={[styles.notNowText, { color: colors.textMuted, fontFamily: typography.fonts.ui }]}>
            Not Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  benefitBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  benefitText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: 12,
  },
  notNowButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  notNowText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
