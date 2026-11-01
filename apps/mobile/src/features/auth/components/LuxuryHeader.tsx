import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

export interface LuxuryHeaderProps {
  onBack?: () => void;
  showBack?: boolean;
}

export const LuxuryHeader: React.FC<LuxuryHeaderProps> = ({ onBack, showBack }) => {
  const { colors, typography, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoLetter, { fontFamily: typography.fonts.display }]}>P</Text>
        </View>
        <Text style={[styles.brandTitle, { color: colors.textPrimary, fontFamily: typography.fonts.display }]}>
          PadhaiPilot
        </Text>
      </View>

      <View style={styles.rightAction}>
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
        ) : (
          <View style={[styles.sessionBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <Text style={[styles.sessionText, { color: colors.textMuted, fontFamily: typography.fonts.ui }]}>
              2026–27
            </Text>
          </View>
        )}
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
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
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
