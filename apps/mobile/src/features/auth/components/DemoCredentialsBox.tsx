import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button } from '../../../components/common/Button';
import { Caption } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';
import { AuthRole } from './RoleSelector';

interface DemoCredentialsProps {
  activeRole: AuthRole;
  onDemoStudent: () => void;
  onDemoTeacher: () => void;
  isLoading?: boolean;
}

export const DemoCredentialsBox: React.FC<DemoCredentialsProps> = ({
  activeRole,
  onDemoStudent,
  onDemoTeacher,
  isLoading = false,
}) => {
  const { colors, radii, spacing, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceSubtle,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.md,
          marginTop: spacing.xl,
        },
      ]}
    >
      <Caption
        style={[
          styles.badgeTitle,
          {
            color: colors.textSecondary,
            marginBottom: spacing.xs,
          },
        ]}
      >
        QUICK EVALUATION LOGIN
      </Caption>
      <Caption style={{ color: colors.textMuted, marginBottom: spacing.sm }}>
        Use one-tap pre-seeded credentials for local and staging testing.
      </Caption>

      <View style={styles.buttonRow}>
        <Button
          title="Student Demo"
          variant={activeRole === 'STUDENT' ? 'subtle' : 'outline'}
          size="sm"
          onPress={onDemoStudent}
          loading={isLoading}
          style={styles.flexBtn}
        />
        <View style={{ width: 8 }} />
        <Button
          title="Teacher Demo"
          variant={activeRole === 'TEACHER' ? 'subtle' : 'outline'}
          size="sm"
          onPress={onDemoTeacher}
          loading={isLoading}
          style={styles.flexBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  badgeTitle: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  flexBtn: {
    flex: 1,
  },
});

