import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { AttendanceScreen } from '../features/attendance/screens/AttendanceScreen';
import { ResultsScreen } from '../features/results/screens/ResultsScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { BottomTabBar } from './BottomTabBar';
import { useTheme } from '../theme/ThemeContext';

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { currentTab } = useNavigationStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'attendance':
        return <AttendanceScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>
      <BottomTabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
