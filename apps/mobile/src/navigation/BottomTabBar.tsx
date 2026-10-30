import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationStore, MainTabKey } from '../store/useNavigationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../theme/ThemeContext';

interface TabItem {
  key: MainTabKey;
  label: string;
  iconSymbol: string;
}

const TEACHER_TABS: TabItem[] = [
  { key: 'teacher_dashboard', label: 'Home', iconSymbol: '⌂' },
  { key: 'teacher_marks', label: 'Marks', iconSymbol: '✎' },
  { key: 'teacher_materials', label: 'Vault', iconSymbol: '▤' },
  { key: 'teacher_diary', label: 'Diary', iconSymbol: '📓' },
  { key: 'teacher_profile', label: 'Profile', iconSymbol: '●' },
];

const STUDENT_TABS: TabItem[] = [
  { key: 'student_dashboard', label: 'Home', iconSymbol: '⌂' },
  { key: 'student_results', label: 'Results', iconSymbol: '★' },
  { key: 'student_materials', label: 'Vault', iconSymbol: '▤' },
  { key: 'student_attendance', label: 'Attendance', iconSymbol: '✓' },
  { key: 'student_fees', label: 'Fees', iconSymbol: '₹' },
  { key: 'student_profile', label: 'Profile', iconSymbol: '●' },
];

export const BottomTabBar: React.FC = () => {
  const { colors, typography, hitSlop } = useTheme();
  const { currentTab, setTab } = useNavigationStore();
  const { session } = useAuthStore();
  const insets = useSafeAreaInsets();

  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'TUITION_OWNER';
  const tabs = isTeacher ? TEACHER_TABS : STUDENT_TABS;

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
      {tabs.map((tab) => {
        const isActive =
          currentTab === tab.key ||
          (tab.key === 'student_dashboard' && currentTab === 'dashboard') ||
          (tab.key === 'student_results' && currentTab === 'results') ||
          (tab.key === 'student_attendance' && currentTab === 'attendance') ||
          (tab.key === 'student_profile' && currentTab === 'profile');

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
                  fontSize: 16,
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
                  fontSize: 10,
                  fontWeight: isActive ? '700' : '500',
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
