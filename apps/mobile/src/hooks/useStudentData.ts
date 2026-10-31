import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/api/studentService';

const MIN = 60 * 1000;

export const studentKeys = {
  dashboard: ['student', 'dashboard'] as const,
  profile: ['student', 'profile'] as const,
  diary: ['student', 'diary'] as const,
  timetable: ['student', 'timetable'] as const,
  attendance: ['student', 'attendance'] as const,
  assignments: ['student', 'assignments'] as const,
  tests: ['student', 'tests'] as const,
  results: ['student', 'results'] as const,
  materials: ['student', 'materials'] as const,
  fees: ['student', 'fees'] as const,
  announcements: ['student', 'announcements'] as const,
  queries: ['student', 'queries'] as const,
  tasks: ['student', 'tasks'] as const,
  documents: ['student', 'documents'] as const,
  notifications: ['student', 'notifications'] as const,
};

export const useDashboardData = () =>
  useQuery({ queryKey: studentKeys.dashboard, queryFn: studentService.getDashboard, staleTime: 2 * MIN });
export const useProfileData = () =>
  useQuery({ queryKey: studentKeys.profile, queryFn: studentService.getProfile, staleTime: 10 * MIN });
export const useDiaryData = () =>
  useQuery({ queryKey: studentKeys.diary, queryFn: () => studentService.getDiary(), staleTime: 5 * MIN });
export const useTimetableData = () =>
  useQuery({ queryKey: studentKeys.timetable, queryFn: studentService.getTimetable, staleTime: 30 * MIN });
export const useAttendanceData = () =>
  useQuery({ queryKey: studentKeys.attendance, queryFn: studentService.getAttendance, staleTime: 5 * MIN });
export const useAssignmentsData = () =>
  useQuery({ queryKey: studentKeys.assignments, queryFn: studentService.getAssignments, staleTime: 2 * MIN });
export const useTestsData = () =>
  useQuery({ queryKey: studentKeys.tests, queryFn: studentService.getTests, staleTime: 2 * MIN });
export const useResultsData = () =>
  useQuery({ queryKey: studentKeys.results, queryFn: studentService.getResults, staleTime: 5 * MIN });
export const useMaterialsData = () =>
  useQuery({ queryKey: studentKeys.materials, queryFn: studentService.getMaterials, staleTime: 5 * MIN });
export const useFeesData = () =>
  useQuery({ queryKey: studentKeys.fees, queryFn: studentService.getFees, staleTime: 5 * MIN });
export const useAnnouncementsData = () =>
  useQuery({ queryKey: studentKeys.announcements, queryFn: studentService.getAnnouncements, staleTime: 2 * MIN });
export const useQueriesData = () =>
  useQuery({ queryKey: studentKeys.queries, queryFn: studentService.getQueries, staleTime: 2 * MIN });
export const useStudyTasksData = () =>
  useQuery({ queryKey: studentKeys.tasks, queryFn: studentService.getStudyTasks, staleTime: 2 * MIN });
export const useDocumentsData = () =>
  useQuery({ queryKey: studentKeys.documents, queryFn: studentService.getDocuments, staleTime: 10 * MIN });
export const useNotificationsData = () =>
  useQuery({ queryKey: studentKeys.notifications, queryFn: studentService.getNotifications, staleTime: MIN });

export const useSubmitAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; content?: string; attachmentUrl?: string; isDraft?: boolean }) =>
      studentService.submitAssignment(v.id, {
        content: v.content,
        attachmentUrl: v.attachmentUrl,
        isDraft: v.isDraft,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.assignments });
      qc.invalidateQueries({ queryKey: studentKeys.dashboard });
    },
  });
};

export const useSubmitTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; answers: Array<{ questionId: string; selectedOptionIndex?: number }> }) =>
      studentService.submitTest(v.id, v.answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.tests });
      qc.invalidateQueries({ queryKey: studentKeys.results });
    },
  });
};

export const useAskQuery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentService.askQuery,
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.queries }),
  });
};

export const useCorrectionRequest = () =>
  useMutation({ mutationFn: studentService.requestAttendanceCorrection });

export const useTaskMutations = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: studentKeys.tasks });
  return {
    create: useMutation({ mutationFn: studentService.createStudyTask, onSuccess: refresh }),
    toggle: useMutation({
      mutationFn: (v: { id: string; isCompleted: boolean }) =>
        studentService.updateStudyTask(v.id, { isCompleted: v.isCompleted }),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: studentService.deleteStudyTask, onSuccess: refresh }),
  };
};

export const useJoinBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentService.joinBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student'] }),
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentService.markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.notifications }),
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentService.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.profile }),
  });
};

export const useSupportRequest = () => useMutation({ mutationFn: studentService.submitSupportRequest });
