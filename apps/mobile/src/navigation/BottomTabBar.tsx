import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationStore, MainTabKey } from '../store/useNavigationStore';
import { useTheme } from '../theme/ThemeContext';

interface TabItem {
  key: MainTabKey;
  label: string;
  iconSymbol: string;
}

const TABS: TabItem[] = [
  { key: 'dashboard', label: 'Home', iconSymbol: '⌂' },
  { key: 'attendance', label: 'Attendance', iconSymbol: '✓' },
  { key: 'results', label: 'Results', iconSymbol: '★' },
  { key: 'profile', label: 'Profile', iconSymbol: '●' },
];

export const BottomTabBar: React.FC = () => {
  const { colors, typography, hitSlop } = useTheme();
  const { currentTab, setTab } = useNavigationStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = currentTab === tab.key;
        const color = isActive ? colors.primary : colors.textMuted;

        return (
          <Pressable
            key={tab.key}
            onPress={() => setTab(tab.key)}
            hitSlop={hitSlop.medium}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            style={({ pressed }) => [
              styles.tabButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[
                styles.icon,
                {
                  color,
                  fontSize: 18,
                  fontWeight: isActive ? '700' : '400',
                },
              ]}
            >
              {tab.iconSymbol}
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontSize: typography.sizes.xs,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
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
    borderTopWidth: 1,
    paddingTop: 8,
    minHeight: 56,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
