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
          borderRadius: radii.xl,
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
                borderRadius: radii.lg,
                backgroundColor: isActive ? colors.surface : 'transparent',
                shadowColor: isActive && !isDark ? '#000000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isActive && !isDark ? 0.06 : 0,
                shadowRadius: 2,
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
    padding: 4,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
  },
});
