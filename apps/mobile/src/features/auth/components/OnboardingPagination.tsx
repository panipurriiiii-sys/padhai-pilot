import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface OnboardingPaginationProps {
  total: number;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export const OnboardingPagination: React.FC<OnboardingPaginationProps> = ({
  total,
  activeIndex,
  onSelectIndex,
}) => {
  const { radii } = useTheme();

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <Pressable
            key={index}
            onPress={() => onSelectIndex(index)}
            style={[
              styles.dot,
              {
                borderRadius: radii.full,
                width: isActive ? 28 : 8,
                backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
              },
            ]}
            hitSlop={10}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Slide ${index + 1}`}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 30,
  },
  dot: {
    height: 8,
    marginHorizontal: 4,
  },
});
