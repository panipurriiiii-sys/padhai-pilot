import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '../services/api/teacherService';
import type {
  CreateTimetableSlotPayload,
  PromoteBatchPayload,
  UpdateBatchPayload,
  UpdateEnrollmentCodePayload,
  UpdateTimetableSlotPayload,
} from '../services/api/teacherService';

const MIN = 60 * 1000;

export const teacherKeys = {
  dashboard: ['teacher', 'dashboard'] as const,
  batches: ['teacher', 'batches'] as const,
  roster: (batchId: string) => ['teacher', 'roster', batchId] as const,
  attendance: (batchId: string, date: string) => ['teacher', 'attendance', batchId, date] as const,
  assessments: ['teacher', 'assessments'] as const,
  assignments: ['teacher', 'assignments'] as const,
  submissions: (id: string) => ['teacher', 'submissions', id] as const,
  invitations: ['teacher', 'invitations'] as const,
  tests: ['teacher', 'tests'] as const,
  lessonPlans: ['teacher', 'lessonPlans'] as const,
  timetable: ['teacher', 'timetable'] as const,
  announcements: ['teacher', 'announcements'] as const,
  diaries: ['teacher', 'diaries'] as const,
  materials: ['teacher', 'materials'] as const,
  leaves: ['teacher', 'leaves'] as const,
  salaries: ['teacher', 'salaries'] as const,
};

export const useTeacherDashboard = () =>
  useQuery({ queryKey: teacherKeys.dashboard, queryFn: teacherService.getDashboard, staleTime: 2 * MIN });
export const useBatches = () =>
  useQuery({ queryKey: teacherKeys.batches, queryFn: teacherService.getBatches, staleTime: 10 * MIN });
export const useRoster = (batchId?: string) =>
  useQuery({
    queryKey: teacherKeys.roster(batchId ?? ''),
    queryFn: () => teacherService.getRoster(batchId as string),
    enabled: !!batchId,
    staleTime: 5 * MIN,
  });
export const useAttendanceSession = (batchId?: string, date?: string) =>
  useQuery({
    queryKey: teacherKeys.attendance(batchId ?? '', date ?? ''),
    queryFn: () => teacherService.getAttendance(batchId as string, date as string),
    enabled: !!batchId && !!date,
    staleTime: 0,
  });
export const useAssessments = () =>
  useQuery({ queryKey: teacherKeys.assessments, queryFn: () => teacherService.getAssessments(), staleTime: 2 * MIN });
export const useTeacherAssignments = () =>
  useQuery({ queryKey: teacherKeys.assignments, queryFn: teacherService.getAssignments, staleTime: 2 * MIN });
export const useSubmissions = (assignmentId?: string) =>
  useQuery({
    queryKey: teacherKeys.submissions(assignmentId ?? ''),
    queryFn: () => teacherService.getSubmissions(assignmentId as string),
    enabled: !!assignmentId,
    staleTime: MIN,
  });
export const useInvitations = (batchId?: string) =>
  useQuery({ queryKey: [...teacherKeys.invitations, batchId ?? 'all'], queryFn: () => teacherService.getInvitations(batchId), staleTime: MIN });
export const useTeacherTimetable = (batchId?: string) =>
  useQuery({ queryKey: [...teacherKeys.timetable, batchId ?? 'all'], queryFn: () => teacherService.getTimetable(batchId), staleTime: 5 * MIN });
export const useTeacherAnnouncements = () =>
  useQuery({ queryKey: teacherKeys.announcements, queryFn: () => teacherService.getAnnouncements(), staleTime: 2 * MIN });
export const useDiaries = () =>
  useQuery({ queryKey: teacherKeys.diaries, queryFn: teacherService.getDiaries, staleTime: 2 * MIN });
export const useTeacherMaterials = () =>
  useQuery({ queryKey: teacherKeys.materials, queryFn: teacherService.getMaterials, staleTime: 5 * MIN });
export const useLeaves = () =>
  useQuery({ queryKey: teacherKeys.leaves, queryFn: teacherService.getLeaves, staleTime: 2 * MIN });
export const useSalaries = () =>
  useQuery({ queryKey: teacherKeys.salaries, queryFn: teacherService.getSalaries, staleTime: 10 * MIN });

export const useSaveAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.saveAttendance,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: teacherKeys.attendance(vars.batchId, vars.date) });
      qc.invalidateQueries({ queryKey: teacherKeys.dashboard });
    },
  });
};

export const useSaveMarksDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.saveMarksDraft,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.assessments }),
  });
};

export const usePublishAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.publishAssessment,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.assessments }),
  });
};

export const useCreateAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.createAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.assignments }),
  });
};

export const useGradeSubmission = (assignmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { submissionId: string; marksObtained: number; feedback?: string; resubmit?: boolean }) =>
      teacherService.gradeSubmission(v.submissionId, {
        marksObtained: v.marksObtained,
        feedback: v.feedback,
        resubmit: v.resubmit,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherKeys.submissions(assignmentId) });
      qc.invalidateQueries({ queryKey: teacherKeys.assignments });
    },
  });
};

export const useInvitationMutations = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: teacherKeys.invitations });
  return {
    create: useMutation({ mutationFn: teacherService.createInvitation, onSuccess: refresh }),
    update: useMutation({
      mutationFn: (v: { id: string; data: UpdateEnrollmentCodePayload }) => teacherService.updateInvitation(v.id, v.data),
      onSuccess: refresh,
    }),
    revoke: useMutation({ mutationFn: teacherService.revokeInvitation, onSuccess: refresh }),
    reactivate: useMutation({ mutationFn: teacherService.reactivateInvitation, onSuccess: refresh }),
    regenerate: useMutation({ mutationFn: teacherService.regenerateInvitation, onSuccess: refresh }),
  };
};

export const useBatchMutations = () => {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: teacherKeys.batches });
    qc.invalidateQueries({ queryKey: ['teacher', 'roster'] });
  };
  return {
    update: useMutation({
      mutationFn: (v: { batchId: string; data: UpdateBatchPayload }) => teacherService.updateBatch(v.batchId, v.data),
      onSuccess: refresh,
    }),
    promote: useMutation({
      mutationFn: (v: { batchId: string; data: PromoteBatchPayload }) => teacherService.promoteBatch(v.batchId, v.data),
      onSuccess: refresh,
    }),
  };
};

export const useTimetableMutations = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: teacherKeys.timetable });
  return {
    create: useMutation({
      mutationFn: (v: { batchId: string; data: CreateTimetableSlotPayload }) => teacherService.createSlot(v.batchId, v.data),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: (v: { slotId: string; data: UpdateTimetableSlotPayload }) => teacherService.updateSlot(v.slotId, v.data),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: teacherService.deleteSlot, onSuccess: refresh }),
  };
};

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.createAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.announcements }),
  });
};

export const useCreateDiary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.createDiary,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.diaries }),
  });
};

export const useCreateMaterial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.createMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.materials }),
  });
};

export const useApplyLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.applyLeave,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.leaves }),
  });
};

export const useTeacherTests = () =>
  useQuery({ queryKey: teacherKeys.tests, queryFn: teacherService.getTests, staleTime: 2 * MIN });
export const useLessonPlans = () =>
  useQuery({ queryKey: teacherKeys.lessonPlans, queryFn: teacherService.getLessonPlans, staleTime: 5 * MIN });

export const useToggleTestResults = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherService.toggleTestResults,
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.tests }),
  });
};

export const useLessonPlanMutations = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: teacherKeys.lessonPlans });
  return {
    create: useMutation({ mutationFn: teacherService.createLessonPlan, onSuccess: refresh }),
    toggle: useMutation({ mutationFn: teacherService.toggleLessonPlan, onSuccess: refresh }),
  };
};
