import { QueryClient } from '@tanstack/react-query';
import { teacherKeys } from '../../hooks/useTeacherData';
import { studentKeys } from '../../hooks/useStudentData';
import { teacherService } from './teacherService';
import { studentService } from './studentService';
import { isStaffRole } from '../../lib/format';

/**
 * Prefetches primary data immediately upon app initialization or tab switch in the background.
 * Guarantees zero-waiting instant screen loads and eliminates loading spinners.
 */
export async function prefetchAppData(queryClient: QueryClient, role?: string): Promise<void> {
  if (!role) return;

  try {
    if (isStaffRole(role)) {
      // Warm up Teacher Dashboard, Batches & Timetable in parallel
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: teacherKeys.dashboard,
          queryFn: teacherService.getDashboard,
          staleTime: 3 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: teacherKeys.batches,
          queryFn: teacherService.getBatches,
          staleTime: 10 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: teacherKeys.timetable,
          queryFn: () => teacherService.getTimetable(),
          staleTime: 15 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: teacherKeys.reports,
          queryFn: teacherService.getReports,
          staleTime: 5 * 60 * 1000,
        }),
      ]);
    } else {
      // Warm up Student Dashboard, Vault/Diary, Timetable & Results in parallel
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: studentKeys.dashboard,
          queryFn: studentService.getDashboard,
          staleTime: 3 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: studentKeys.timetable,
          queryFn: studentService.getTimetable,
          staleTime: 30 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: studentKeys.diary,
          queryFn: () => studentService.getDiary(),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: studentKeys.assignments,
          queryFn: studentService.getAssignments,
          staleTime: 3 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: studentKeys.results,
          queryFn: studentService.getResults,
          staleTime: 5 * 60 * 1000,
        }),
      ]);
    }
  } catch {
    // Non-blocking background prefetch
  }
}

