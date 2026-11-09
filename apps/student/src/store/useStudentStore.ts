'use client';

import { create } from 'zustand';
import type { UserSession, InAppNotification } from '@padhai-pilot/shared';

export type PortalTab =
  | 'OVERVIEW'
  | 'DIARY'
  | 'MATERIALS'
  | 'LIBRARY'
  | 'TIMETABLE'
  | 'ATTENDANCE'
  | 'ASSIGNMENTS'
  | 'TESTS'
  | 'RESULTS'
  | 'FEES'
  | 'LEAVES'
  | 'QUERIES'
  | 'PLANNER'
  | 'DOCUMENTS'
  | 'PROFILE';

interface StudentStoreState {
  student: UserSession | null;
  activeTab: PortalTab;
  notifications: InAppNotification[];
  isOnline: boolean;
  searchQuery: string;
  selectedSubject: string;

  // Actions
  setStudent: (student: UserSession | null) => void;
  setActiveTab: (tab: PortalTab) => void;
  setNotifications: (notifications: InAppNotification[]) => void;
  markNotificationRead: (id: string) => void;
  setIsOnline: (online: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedSubject: (subject: string) => void;
}

export const useStudentStore = create<StudentStoreState>((set) => ({
  student: null,
  activeTab: 'OVERVIEW',
  notifications: [],
  isOnline: true,
  searchQuery: '',
  selectedSubject: 'ALL',

  setStudent: (student) => set({ student }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    })),
  setIsOnline: (isOnline) => set({ isOnline }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedSubject: (selectedSubject) => set({ selectedSubject }),
}));

