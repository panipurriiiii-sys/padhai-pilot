import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { useBatches } from '../../hooks/useTeacherData';
import { QueryBoundary } from './QueryBoundary';
import { useTheme } from '../../theme/ThemeContext';

interface BatchPickerProps {
  value?: string;
  onChange: (batchId: string) => void;
}

/** Horizontal chip list of the batches this faculty member is assigned to (server-filtered). */
export const BatchPicker: React.FC<BatchPickerProps> = ({ value, onChange }) => {
  const { colors, spacing, radii, typography } = useTheme();
  const query = useBatches();
  return (
    <QueryBoundary
      query={query}
      isEmpty={(b) => b.length === 0}
      emptyTitle="No batches assigned"
      emptyDescription="Ask your tuition owner to assign you to a batch."
    >
      {(batches) => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {batches.map((b) => {
            const active = b.id === value;
            return (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onChange(b.id)}
                style={{
                  marginRight: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySubtle : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.ui,
                    fontSize: 12,
                    fontWeight: '700',
                    color: active ? colors.primary : colors.textSecondary,
                  }}
                >
                  {`${b.name} · ${b.subject}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </QueryBoundary>
  );
};
