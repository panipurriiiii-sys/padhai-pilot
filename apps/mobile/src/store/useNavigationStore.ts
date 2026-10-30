import { create } from 'zustand';

export type TeacherTabKey =
  | 'teacher_dashboard'
  | 'teacher_marks'
  | 'teacher_materials'
  | 'teacher_diary'
  | 'teacher_profile';

export type StudentTabKey =
  | 'student_dashboard'
  | 'student_results'
  | 'student_materials'
  | 'student_attendance'
  | 'student_fees'
  | 'student_profile';

export type MainTabKey = TeacherTabKey | StudentTabKey | 'dashboard' | 'attendance' | 'results' | 'profile';

interface NavigationState {
  currentTab: MainTabKey;
  setTab: (tab: MainTabKey) => void;
  selectedBatchId?: string;
  setSelectedBatchId: (id: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentTab: 'student_dashboard',
  setTab: (tab: MainTabKey) => set({ currentTab: tab }),
  selectedBatchId: undefined,
  setSelectedBatchId: (id: string) => set({ selectedBatchId: id }),
}));
