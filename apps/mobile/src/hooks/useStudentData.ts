import { useQuery } from '@tanstack/react-query';
import { studentService, AttendanceSummary, AssessmentResultItem, StudentAnnouncement, FeeReceiptItem } from '../services/api/studentService';

export const useAttendanceData = () => {
  return useQuery<AttendanceSummary>({
    queryKey: ['student', 'attendance'],
    queryFn: () => studentService.getAttendance(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useResultsData = () => {
  return useQuery<AssessmentResultItem[]>({
    queryKey: ['student', 'results'],
    queryFn: () => studentService.getResults(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useAnnouncementsData = () => {
  return useQuery<StudentAnnouncement[]>({
    queryKey: ['student', 'announcements'],
    queryFn: () => studentService.getAnnouncements(),
    staleTime: 1000 * 60 * 2,
  });
};

export const useFeesData = () => {
  return useQuery<FeeReceiptItem[]>({
    queryKey: ['student', 'fees'],
    queryFn: () => studentService.getFees(),
    staleTime: 1000 * 60 * 10,
  });
};

