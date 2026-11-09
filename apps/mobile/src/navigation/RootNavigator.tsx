import React, { useEffect, useRef, useState } from 'react';
import { Platform, ToastAndroid, View, StyleSheet, BackHandler } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { FacultyJoinScreen, captureFacultyInvite, usePendingFacultyInvite } from '../features/auth/screens/FacultyJoinScreen';
import { PermissionOnboardingScreen } from '../features/permissions/PermissionOnboardingScreen';
import { permissionManager } from '../features/permissions/permissionManager';

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
import { isStaffRole } from '../lib/format';
import { resolveDeepLinkTab, subscribeDeepLinks } from '../lib/deepLinks';
import { loadPush } from '../services/push';
import { notificationService } from '../services/notification/NotificationService';

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated, session } = useAuthStore();
  const { currentTab, setTab } = useNavigationStore();
  const lastBackPressRef = useRef<number>(0);

  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  const [needsPermissionOnboarding, setNeedsPermissionOnboarding] = useState(false);

  const isTeacher = isStaffRole(session?.user?.role);
  const userId = session?.user?.id;

  // Check role-based permission onboarding directly after login
  useEffect(() => {
    let active = true;
    if (isAuthenticated && userId) {
      permissionManager.hasCompletedOnboarding(userId).then((completed) => {
        if (active) {
          setNeedsPermissionOnboarding(!completed);
          setHasCheckedPermissions(true);
        }
      });
    } else {
      setHasCheckedPermissions(true);
      setNeedsPermissionOnboarding(false);
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated, userId]);

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

  // Faculty invitation links (padhaipilot://join-faculty?token=) work while signed out.
  const pendingInvite = usePendingFacultyInvite((s) => s.token);
  useEffect(() => {
    if (isAuthenticated) return undefined;
    return subscribeDeepLinks((url) => {
      captureFacultyInvite(url);
    });
  }, [isAuthenticated]);

  // Android back button:
  //   • FacultyJoinScreen (unauthenticated with pending invite) → dismiss the invite.
  //   • Non-home main tabs (attendance, classes, diary, results, more) → do nothing (consume event).
  //   • Home/dashboard tab → first press shows "press back again to exit" toast;
  //     second press within 2 s lets the OS exit the app.
  //   Sub-views (TeacherMore/StudentMore panels) register their own handler via
  //   useBackToMenu which sits higher in the LIFO stack and resolves first.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isAuthenticated) {
        if (usePendingFacultyInvite.getState().token) {
          usePendingFacultyInvite.getState().set(null);
          return true;
        }
        return false;
      }
      const home = isTeacher ? 'teacher_dashboard' : 'student_dashboard';
      const cur = useNavigationStore.getState().currentTab;

      // On a non-home main tab: consume the event but stay on the current tab.
      if (cur !== home && cur !== 'dashboard') {
        return true;
      }

      // On home/dashboard tab: require a second back press within 2 s to exit.
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        return false; // let the OS exit the app
      }
      lastBackPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true;
    });
    return () => sub.remove();
  }, [isAuthenticated, isTeacher, setTab]);

  // Deep links (padhaipilot://...) and push-notification taps; ignored until signed in.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const open = (url: string | null) => {
      const tab = resolveDeepLinkTab(url, isTeacher);
      if (tab) setTab(tab);
    };
    const unsubLinks = subscribeDeepLinks(open);
    const unsubPush = loadPush().onMessage(open);
    const unsubNotifee = notificationService.registerPressHandler(open);
    return () => {
      unsubLinks();
      unsubPush();
      unsubNotifee();
    };
  }, [isAuthenticated, isTeacher, setTab]);

  if (!isAuthenticated && pendingInvite) {
    return <FacultyJoinScreen token={pendingInvite} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Once logged in, show dedicated role-specific permission screens if onboarding hasn't been completed yet
  if (needsPermissionOnboarding && userId) {
    return (
      <PermissionOnboardingScreen
        userId={userId}
        role={session?.user?.role}
        onFinished={() => setNeedsPermissionOnboarding(false)}
      />
    );
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
