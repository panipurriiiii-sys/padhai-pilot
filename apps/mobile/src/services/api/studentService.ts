import { apiClient } from './client';

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subjectName?: string;
  remarks?: string;
}

export interface AttendanceSummary {
  totalClasses: number;
  attended: number;
  percentage: number;
  records: AttendanceRecord[];
}

export interface AssessmentResultItem {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade?: string;
  rank?: number;
  totalStudents?: number;
  remarks?: string;
}

export interface StudentAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'NORMAL' | 'URGENT';
  authorName?: string;
}

export interface FeeReceiptItem {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidDate?: string;
  receiptNumber?: string;
}

export const studentService = {
  async getAttendance(): Promise<AttendanceSummary> {
    try {
      const res = await apiClient.get<AttendanceSummary>('/student/attendance');
      return res || { totalClasses: 0, attended: 0, percentage: 0, records: [] };
    } catch {
      // Return safe fallback for new student with no records yet
      return { totalClasses: 0, attended: 0, percentage: 0, records: [] };
    }
  },

  async getResults(): Promise<AssessmentResultItem[]> {
    try {
      const res = await apiClient.get<AssessmentResultItem[]>('/student/results');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getAnnouncements(): Promise<StudentAnnouncement[]> {
    try {
      const res = await apiClient.get<StudentAnnouncement[]>('/student/announcements');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getFees(): Promise<FeeReceiptItem[]> {
    try {
      const res = await apiClient.get<FeeReceiptItem[]>('/student/fees');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
};
