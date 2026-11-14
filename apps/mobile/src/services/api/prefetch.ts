import { QueryClient } from '@tanstack/react-query';
import { teacherKeys } from '../../hooks/useTeacherData';
import { studentKeys } from '../../hooks/useStudentData';
import { teacherService } from './teacherService';
import { studentService } from './studentService';
import { isStaffRole } from '../../lib/format';

/**
 * Prefetches primary data intelligently: loads the primary dashboard first for instant
 * visual rendering, then lazily warms up secondary screens without network contention.
 */
export async function prefetchAppData(queryClient: QueryClient, role?: string): Promise<void> {
  if (!role) return;

  try {
    if (isStaffRole(role)) {
      // 1. Prioritize the primary dashboard for immediate, unblocked screen rendering
      await queryClient.prefetchQuery({
        queryKey: teacherKeys.dashboard,
        queryFn: teacherService.getDashboard,
        staleTime: 5 * 60 * 1000,
      });

      // 2. Stagger secondary data to eliminate mobile connection congestion and cold-start spikes
      setTimeout(() => {
        void Promise.allSettled([
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
        ]);
      }, 1200);
    } else {
      // 1. Prioritize the student dashboard for immediate, unblocked screen rendering
      await queryClient.prefetchQuery({
        queryKey: studentKeys.dashboard,
        queryFn: studentService.getDashboard,
        staleTime: 5 * 60 * 1000,
      });

      // 2. Stagger secondary screens after the dashboard has cleanly painted
      setTimeout(() => {
        void Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: studentKeys.timetable,
            queryFn: studentService.getTimetable,
            staleTime: 30 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: studentKeys.diary,
            queryFn: () => studentService.getDiary(),
            staleTime: 10 * 60 * 1000,
          }),
        ]);
      }, 1200);
    }
  } catch {
    // Non-blocking background prefetch
  }
}

