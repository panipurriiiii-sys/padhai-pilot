import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { AttendanceScreen } from '../features/attendance/screens/AttendanceScreen';
import { ResultsScreen } from '../features/results/screens/ResultsScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { StudyMaterialScreen } from '../features/student/StudyMaterialScreen';
import { FeesScreen } from '../features/student/FeesScreen';

import { TeacherDashboardScreen } from '../features/teacher/TeacherDashboardScreen';
import { BulkMarksEntryScreen } from '../features/teacher/BulkMarksEntryScreen';
import { TeacherStudyMaterialScreen } from '../features/teacher/TeacherStudyMaterialScreen';
import { TeachingDiaryScreen } from '../features/teacher/TeachingDiaryScreen';
import { TeacherProfileScreen } from '../features/teacher/TeacherProfileScreen';

import { BottomTabBar } from './BottomTabBar';
import { useTheme } from '../theme/ThemeContext';

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated, session } = useAuthStore();
  const { currentTab, setTab } = useNavigationStore();

  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'TUITION_OWNER';

  // Automatically ensure initial tab aligns with user role
  useEffect(() => {
    if (isAuthenticated) {
      if (isTeacher && !currentTab.startsWith('teacher_')) {
        setTab('teacher_dashboard');
      } else if (!isTeacher && currentTab.startsWith('teacher_')) {
        setTab('student_dashboard');
      }
    }
  }, [isAuthenticated, isTeacher]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    if (isTeacher) {
      switch (currentTab) {
        case 'teacher_dashboard':
          return <TeacherDashboardScreen />;
        case 'teacher_marks':
          return <BulkMarksEntryScreen />;
        case 'teacher_materials':
          return <TeacherStudyMaterialScreen />;
        case 'teacher_diary':
          return <TeachingDiaryScreen />;
        case 'teacher_profile':
          return <TeacherProfileScreen />;
        default:
          return <TeacherDashboardScreen />;
      }
    }

    // Student Portal
    switch (currentTab) {
      case 'student_dashboard':
      case 'dashboard':
        return <DashboardScreen />;
      case 'student_results':
      case 'results':
        return <ResultsScreen />;
      case 'student_materials':
        return <StudyMaterialScreen />;
      case 'student_attendance':
      case 'attendance':
        return <AttendanceScreen />;
      case 'student_fees':
        return <FeesScreen />;
      case 'student_profile':
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
