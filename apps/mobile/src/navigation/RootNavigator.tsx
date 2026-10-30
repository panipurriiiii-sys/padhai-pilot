import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { LoginScreen } from '../features/auth/screens/LoginScreen';

// Teacher Screens
import { TeacherDashboardScreen } from '../features/teacher/TeacherDashboardScreen';
import { TeacherClassesScreen } from '../features/teacher/TeacherClassesScreen';
import { TeacherAttendanceScreen } from '../features/teacher/TeacherAttendanceScreen';
import { BulkMarksEntryScreen } from '../features/teacher/BulkMarksEntryScreen';
import { TeachingDiaryScreen } from '../features/teacher/TeachingDiaryScreen';
import { TeacherMoreScreen } from '../features/teacher/TeacherMoreScreen';

// Student Screens
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { StudentDiaryScreen } from '../features/student/StudentDiaryScreen';
import { StudentAcademicsScreen } from '../features/student/StudentAcademicsScreen';
import { ResultsScreen } from '../features/results/screens/ResultsScreen';
import { StudentMoreScreen } from '../features/student/StudentMoreScreen';

import { BottomTabBar } from './BottomTabBar';
import { useTheme } from '../theme/ThemeContext';

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated, session } = useAuthStore();
  const { currentTab, setTab } = useNavigationStore();

  const isTeacher =
    session?.user?.role === 'TEACHER' ||
    session?.user?.role === 'TUITION_OWNER' ||
    session?.user?.role === 'FACULTY' ||
    session?.user?.role === 'INSTITUTE_MANAGER';

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
    // ------------------------------------------------------------------------
    // TEACHER / FACULTY MOBILE EXPERIENCE
    // ------------------------------------------------------------------------
    if (isTeacher) {
      switch (currentTab) {
        case 'teacher_dashboard':
          return <TeacherDashboardScreen />;
        case 'teacher_classes':
          return <TeacherClassesScreen />;
        case 'teacher_attendance':
          return <TeacherAttendanceScreen />;
        case 'teacher_marks':
          return <BulkMarksEntryScreen />;
        case 'teacher_learning':
        case 'teacher_diary':
        case 'teacher_materials':
          return <TeachingDiaryScreen />;
        case 'teacher_more':
        case 'teacher_profile':
          return <TeacherMoreScreen />;
        default:
          return <TeacherDashboardScreen />;
      }
    }

    // ------------------------------------------------------------------------
    // STUDENT MOBILE EXPERIENCE
    // ------------------------------------------------------------------------
    switch (currentTab) {
      case 'student_dashboard':
      case 'dashboard':
        return <DashboardScreen />;
      case 'student_diary':
      case 'student_materials':
        return <StudentDiaryScreen />;
      case 'student_academics':
        return <StudentAcademicsScreen />;
      case 'student_results':
      case 'results':
      case 'student_attendance':
      case 'attendance':
        return <ResultsScreen />;
      case 'student_more':
      case 'student_fees':
      case 'student_profile':
      case 'profile':
        return <StudentMoreScreen />;
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
