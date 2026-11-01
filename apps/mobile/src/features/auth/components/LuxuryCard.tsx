import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { paperShadow } from '../../../theme/shadows';

export interface LuxuryCardProps {
  children: React.ReactNode;
  showTape?: boolean;
  maxWidth?: number;
}

/** Luxury modern card container with smooth radius and subtle elevation. Fully responsive across phone and tablet screens. */
export const LuxuryCard: React.FC<LuxuryCardProps> = ({ children, maxWidth = 440 }) => {
  const { colors, radii, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive padding: compact for small phones, spacious for standard/tablets
  const cardPadding = windowWidth < 360 ? 14 : windowWidth < 400 ? 18 : 22;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            maxWidth,
            padding: cardPadding,
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
  },
});
