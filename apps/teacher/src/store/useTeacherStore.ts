'use client';

import { create } from 'zustand';
import type { InAppNotification, UserSession } from '@padhai-pilot/shared';

export type TeacherTab =
  | 'dashboard'
  | 'bulkMarks'
  | 'batches'
  | 'attendance'
  | 'assignments'
  | 'tests'
  | 'studyMaterial'
  | 'dailyDiary'
  | 'lessonPlans'
  | 'timetable'
  | 'invitations'
  | 'batchFees'
  | 'studentLeaves'
  | 'faculty'
  | 'facultySalary'
  | 'facultyLeaves'
  | 'branding'
  | 'subscription'
  | 'announcements'
  | 'reports'
  | 'library'
  | 'settings';

interface TeacherStoreState {
  user: UserSession | null;
  currentTab: TeacherTab;
  selectedBatchId: string | null;
  notifications: InAppNotification[];
  isOnline: boolean;
  mobileMenuOpen: boolean;

  // Actions
  setUser: (user: UserSession | null) => void;
  setCurrentTab: (tab: TeacherTab) => void;
  setSelectedBatchId: (id: string | null) => void;
  setNotifications: (notifications: InAppNotification[]) => void;
  markNotificationRead: (id: string) => void;
  setIsOnline: (online: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useTeacherStore = create<TeacherStoreState>((set) => ({
  user: null,
  currentTab: 'dashboard',
  selectedBatchId: null,
  notifications: [],
  isOnline: true,
  mobileMenuOpen: false,

  setUser: (user) => set({ user }),
  setCurrentTab: (currentTab) => set({ currentTab }),
  setSelectedBatchId: (selectedBatchId) => set({ selectedBatchId }),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    })),
  setIsOnline: (isOnline) => set({ isOnline }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
}));

