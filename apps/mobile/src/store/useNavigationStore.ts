import { create } from 'zustand';

export type TeacherTabKey =
  | 'teacher_dashboard'
  | 'teacher_classes'
  | 'teacher_attendance'
  | 'teacher_marks'
  | 'teacher_learning'
  | 'teacher_more'
  // Legacy aliases
  | 'teacher_materials'
  | 'teacher_diary'
  | 'teacher_profile';

export type StudentTabKey =
  | 'student_dashboard'
  | 'student_diary'
  | 'student_academics'
  | 'student_results'
  | 'student_more'
  // Legacy aliases
  | 'student_materials'
  | 'student_attendance'
  | 'student_fees'
  | 'student_profile'
  | 'dashboard'
  | 'results'
  | 'attendance'
  | 'profile';

export type MainTabKey = TeacherTabKey | StudentTabKey;

interface NavigationState {
  currentTab: MainTabKey;
  setTab: (tab: MainTabKey) => void;
  selectedBatchId?: string;
  setSelectedBatchId: (id: string) => void;
  teacherSubView?: 'batches' | 'invitations' | 'attendance' | 'marks' | 'assignments' | 'diary' | 'materials' | 'leave' | 'salary' | 'timetable';
  setTeacherSubView: (view: 'batches' | 'invitations' | 'attendance' | 'marks' | 'assignments' | 'diary' | 'materials' | 'leave' | 'salary' | 'timetable') => void;
  studentSubView?: 'diary' | 'materials' | 'assignments' | 'cbt' | 'results' | 'attendance' | 'fees' | 'timetable' | 'planner' | 'documents' | 'doubts';
  setStudentSubView: (view: 'diary' | 'materials' | 'assignments' | 'cbt' | 'results' | 'attendance' | 'fees' | 'timetable' | 'planner' | 'documents' | 'doubts') => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentTab: 'student_dashboard',
  setTab: (tab: MainTabKey) => set({ currentTab: tab }),
  selectedBatchId: undefined,
  setSelectedBatchId: (id: string) => set({ selectedBatchId: id }),
  teacherSubView: undefined,
  setTeacherSubView: (view) => set({ teacherSubView: view }),
  studentSubView: undefined,
  setStudentSubView: (view) => set({ studentSubView: view }),
}));
