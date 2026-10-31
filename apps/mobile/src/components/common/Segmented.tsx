import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SegmentedProps<K extends string> {
  options: ReadonlyArray<{ key: K; label: string }>;
  value: K;
  onChange: (key: K) => void;
}

export function Segmented<K extends string>({ options, value, onChange }: SegmentedProps<K>) {
  const { colors, radii, spacing, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: radii.lg,
        padding: spacing.xs,
        marginBottom: spacing.md,
      }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              backgroundColor: active ? colors.surface : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: typography.fonts.ui,
                fontSize: 12,
                fontWeight: '700',
                color: active ? colors.primary : colors.textMuted,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
