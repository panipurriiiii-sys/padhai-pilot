import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { paperShadow } from '../../../theme/shadows';

export interface LuxuryCardProps {
  children: React.ReactNode;
  showTape?: boolean;
}

/** Luxury modern card container with smooth radius and subtle elevation. */
export const LuxuryCard: React.FC<LuxuryCardProps> = ({ children }) => {
  const { colors, radii, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
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
  card: {
    width: '100%',
    borderWidth: 1,
    padding: 22,
  },
});
