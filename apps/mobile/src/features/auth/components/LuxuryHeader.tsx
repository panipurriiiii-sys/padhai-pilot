import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

export interface LuxuryHeaderProps {
  onBack?: () => void;
  showBack?: boolean;
}

export const LuxuryHeader: React.FC<LuxuryHeaderProps> = ({ onBack, showBack }) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={[styles.backPill, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backText, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
              ← Back
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.sessionBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
        <Text style={[styles.sessionText, { color: colors.textMuted, fontFamily: typography.fonts.ui }]}>
          Session 2026–27
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  leftContainer: {
    minHeight: 32,
    justifyContent: 'center',
  },
  backPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  backText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
