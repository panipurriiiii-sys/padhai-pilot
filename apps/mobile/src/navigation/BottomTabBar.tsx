import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationStore, MainTabKey } from '../store/useNavigationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../theme/ThemeContext';
import { isStaffRole } from '../lib/format';
import { Icon, IconName } from '../components/common/Icon';
import { paperShadow } from '../theme/shadows';

interface TabItem {
  key: MainTabKey;
  label: string;
  icon: IconName;
  /** Other tab keys that should highlight this tab (legacy aliases and screens opened from More). */
  also?: MainTabKey[];
}

// Same destinations and icons as the Teacher Portal sidebar, condensed to five thumb-reachable tabs.
const TEACHER_TABS: TabItem[] = [
  { key: 'teacher_dashboard', label: 'Overview', icon: 'layout-dashboard' },
  { key: 'teacher_learning', label: 'Diary', icon: 'notebook-pen', also: ['teacher_diary', 'teacher_materials'] },
  { key: 'teacher_attendance', label: 'Attendance', icon: 'calendar-check' },
  { key: 'teacher_marks', label: 'Marks', icon: 'file-spreadsheet' },
  { key: 'teacher_more', label: 'More', icon: 'layers', also: ['teacher_profile', 'teacher_classes'] },
];

const STUDENT_TABS: TabItem[] = [
  { key: 'student_dashboard', label: 'Home', icon: 'layout-dashboard', also: ['dashboard'] },
  { key: 'student_diary', label: 'Vault', icon: 'notebook-pen', also: ['student_materials'] },
  { key: 'student_academics', label: 'Tests', icon: 'file-check-2' },
  { key: 'student_results', label: 'Results', icon: 'award', also: ['results', 'student_attendance', 'attendance'] },
  { key: 'student_more', label: 'More', icon: 'layers', also: ['student_fees', 'student_profile', 'profile'] },
];

export const BottomTabBar: React.FC = () => {
  const { colors, typography, hitSlop, isDark } = useTheme();
  const { currentTab, setTab } = useNavigationStore();
  const role = useAuthStore((s) => s.session?.user?.role);
  const insets = useSafeAreaInsets();
  const tabs = isStaffRole(role) ? TEACHER_TABS : STUDENT_TABS;

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingTop: 8,
        paddingHorizontal: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: colors.tabBarBackground,
        borderTopWidth: 1,
        borderTopColor: colors.tabBarBorder,
      }}
    >
      {tabs.map((tab) => {
        const active = currentTab === tab.key || !!tab.also?.includes(currentTab);
        return (
          <Pressable
            key={tab.key}
            onPress={() => setTab(tab.key)}
            hitSlop={hitSlop.medium}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${tab.label} tab`}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={[
                {
                  minWidth: 62,
                  alignItems: 'center',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'transparent',
                },
                active && { backgroundColor: colors.surface, borderColor: colors.border, ...paperShadow(isDark) },
              ]}
            >
              <Icon name={tab.icon} size={18} color={active ? colors.primary : colors.textFaint} />
              <Text
                style={{
                  marginTop: 3,
                  fontFamily: typography.fonts.ui,
                  fontSize: 10,
                  fontWeight: active ? '700' : '500',
                  color: active ? colors.textPrimary : colors.textMuted,
                }}
              >
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
