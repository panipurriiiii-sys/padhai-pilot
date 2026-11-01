import React from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { paperShadow, electricGlow } from '../../../theme/shadows';

export interface LuxuryCardProps {
  children: React.ReactNode;
  showTape?: boolean;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({ children, showTape = true }) => {
  const { colors, radii, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {showTape && !isDark && <View style={[styles.scotchTape, { borderColor: colors.border }]} />}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.xl,
          },
          paperShadow(isDark, 'lift'),
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  scotchTape: {
    width: 64,
    height: 18,
    backgroundColor: 'rgba(238, 233, 226, 0.75)',
    borderRadius: 2,
    borderWidth: 1,
    marginBottom: -9,
    zIndex: 10,
    transform: [{ rotate: '-1.5deg' }],
  },
  card: {
    width: '100%',
    borderWidth: 1,
    padding: 24,
  },
});
