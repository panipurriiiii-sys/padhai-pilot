import React from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Label } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';

export type AuthRole = 'STUDENT' | 'TEACHER';

interface RoleSelectorProps {
  activeRole: AuthRole;
  onSelectRole: (role: AuthRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  activeRole,
  onSelectRole,
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
          padding: 4,
          marginBottom: spacing.lg,
        },
      ]}
      accessibilityRole="radiogroup"
    >
      <Pressable
        onPress={() => onSelectRole('STUDENT')}
        style={[
          styles.option,
          {
            borderRadius: radii.sm,
            backgroundColor:
              activeRole === 'STUDENT' ? colors.surface : 'transparent',
            borderColor:
              activeRole === 'STUDENT' ? colors.borderStrong : 'transparent',
          },
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: activeRole === 'STUDENT' }}
        accessibilityLabel="Student role"
      >
        <Label
          style={{
            color: activeRole === 'STUDENT' ? colors.primary : colors.textMuted,
            fontWeight: activeRole === 'STUDENT' ? '700' : '500',
          }}
        >
          Student
        </Label>
      </Pressable>

      <Pressable
        onPress={() => onSelectRole('TEACHER')}
        style={[
          styles.option,
          {
            borderRadius: radii.sm,
            backgroundColor:
              activeRole === 'TEACHER' ? colors.surface : 'transparent',
            borderColor:
              activeRole === 'TEACHER' ? colors.borderStrong : 'transparent',
          },
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: activeRole === 'TEACHER' }}
        accessibilityLabel="Faculty role"
      >
        <Label
          style={{
            color: activeRole === 'TEACHER' ? colors.primary : colors.textMuted,
            fontWeight: activeRole === 'TEACHER' ? '700' : '500',
          }}
        >
          Faculty / Teacher
        </Label>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

