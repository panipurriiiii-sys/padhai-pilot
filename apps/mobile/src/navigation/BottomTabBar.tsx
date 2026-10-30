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
  { key: 'teacher_classes', label: 'Classes', iconSymbol: '👥' },
  { key: 'teacher_attendance', label: 'Attendance', iconSymbol: '✓' },
  { key: 'teacher_marks', label: 'Marks', iconSymbol: '📊' },
  { key: 'teacher_learning', label: 'Vault', iconSymbol: '📓' },
  { key: 'teacher_more', label: 'More', iconSymbol: '⚙' },
];

const STUDENT_TABS: TabItem[] = [
  { key: 'student_dashboard', label: 'Home', iconSymbol: '⌂' },
  { key: 'student_diary', label: 'Vault', iconSymbol: '📓' },
  { key: 'student_academics', label: 'Tests', iconSymbol: '📝' },
  { key: 'student_results', label: 'Results', iconSymbol: '★' },
  { key: 'student_more', label: 'More', iconSymbol: '⚙' },
];

export const BottomTabBar: React.FC = () => {
  const { colors, typography, hitSlop } = useTheme();
  const { currentTab, setTab } = useNavigationStore();
  const { session } = useAuthStore();
  const insets = useSafeAreaInsets();

  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'TUITION_OWNER' || session?.user?.role === 'FACULTY';
  const tabs = isTeacher ? TEACHER_TABS : STUDENT_TABS;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive =
          currentTab === tab.key ||
          (tab.key === 'teacher_learning' && (currentTab === 'teacher_diary' || currentTab === 'teacher_materials')) ||
          (tab.key === 'teacher_more' && currentTab === 'teacher_profile') ||
          (tab.key === 'student_dashboard' && currentTab === 'dashboard') ||
          (tab.key === 'student_diary' && currentTab === 'student_materials') ||
          (tab.key === 'student_results' && (currentTab === 'results' || currentTab === 'student_attendance' || currentTab === 'attendance')) ||
          (tab.key === 'student_more' && (currentTab === 'student_fees' || currentTab === 'student_profile' || currentTab === 'profile'));

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
            <View
              style={[
                styles.iconContainer,
                isActive && {
                  backgroundColor: colors.primarySubtle,
                  borderRadius: 12,
                },
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  {
                    color,
                    fontSize: 16,
                  },
                ]}
              >
                {tab.iconSymbol}
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontSize: 10,
                  fontWeight: isActive ? '700' : '500',
                  fontFamily: typography.fonts.ui,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
