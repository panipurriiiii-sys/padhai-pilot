import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface SegmentedToggleProps {
  options: { key: string; label: string }[];
  activeKey: string;
  onSelect: (key: any) => void;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  options,
  activeKey,
  onSelect,
}) => {
  const { colors, radii, typography, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceSubtle,
          borderColor: colors.border,
          borderRadius: radii.lg,
        },
      ]}
    >
      {options.map((opt) => {
        const isActive = opt.key === activeKey;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[
              styles.segment,
              {
                borderRadius: radii.md,
                backgroundColor: isActive ? colors.surface : 'transparent',
                borderColor: isActive ? colors.border : 'transparent',
                shadowColor: isActive && !isDark ? '#3C3428' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isActive && !isDark ? 0.08 : 0,
                shadowRadius: 3,
                elevation: isActive && !isDark ? 1 : 0,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.textPrimary : colors.textMuted,
                  fontFamily: typography.fonts.ui,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
  },
});
