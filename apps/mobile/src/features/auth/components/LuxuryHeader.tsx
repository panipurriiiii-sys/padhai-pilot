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
            style={[styles.backPill, { borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backText, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}>
              ← Back
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.sessionBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
        <View style={styles.activeDot} />
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
    paddingVertical: 14,
    marginBottom: 14,
  },
  leftContainer: {
    minHeight: 32,
    justifyContent: 'center',
  },
  backPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  sessionText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
