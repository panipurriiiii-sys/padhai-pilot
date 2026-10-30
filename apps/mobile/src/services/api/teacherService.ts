import { apiClient } from './client';
import type {
  BatchSummary,
  BatchStudentRoster,
  AssessmentItem,
  CreateAssessmentDto,
  BulkSaveDraftDto,
  StudyMaterialItem,
  CreateStudyMaterialDto,
  DailyTeachingDiaryItem,
  CreateTeachingDiaryDto,
} from '@padhai-pilot/shared';

export interface TeacherDashboardMetrics {
  todayClassesCount: number;
  assignedBatchesCount: number;
  totalStudentsCount: number;
  pendingAttendanceCount: number;
  pendingReviewsCount: number;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    content: string;
    priority: string;
    createdAt: string;
  }>;
  todaySchedule: Array<{
    id: string;
    batchName: string;
    subject: string;
    room: string;
    timeSlot: string;
  }>;
  activeBatches: BatchSummary[];
}

export const teacherService = {
  // 1. Dashboard
  async getDashboard(): Promise<TeacherDashboardMetrics> {
    try {
      const data = await apiClient.get<TeacherDashboardMetrics>('/teacher/dashboard');
      if (data) return data;
      throw new Error('Empty');
    } catch {
      return {
        todayClassesCount: 2,
        assignedBatchesCount: 3,
        totalStudentsCount: 84,
        pendingAttendanceCount: 1,
        pendingReviewsCount: 5,
        recentAnnouncements: [
          {
            id: 'anc_01',
            title: 'Special Sunday Problem Solving Session',
            content: 'Doubt clearance in Room 302 for Calculus & Vectors.',
            priority: 'URGENT',
            createdAt: '2026-10-29T10:00:00Z',
          },
        ],
        todaySchedule: [
          {
            id: 'tt_1',
            batchName: 'JEE Advanced — Mathematics Alpha',
            subject: 'Mathematics',
            room: 'Room 302',
            timeSlot: '09:00 AM - 10:30 AM',
          },
          {
            id: 'tt_2',
            batchName: 'Class 11 — Physics Core Batch',
            subject: 'Physics',
            room: 'Hall 1',
            timeSlot: '11:00 AM - 12:30 PM',
          },
        ],
        activeBatches: [
          {
            id: 'btc_jee_math_adv',
            name: 'JEE Advanced — Mathematics Alpha',
            code: 'JEE-MTH-ADV',
            subject: 'Mathematics',
            gradeLevel: 'Class 12',
            studentCount: 38,
            room: 'Room 302',
            todayStatus: 'COMPLETED',
          },
          {
            id: 'btc_neet_physics_core',
            name: 'Class 11 — Physics Core Batch',
            code: 'PHY-11-CORE',
            subject: 'Physics',
            gradeLevel: 'Class 11',
            studentCount: 32,
            room: 'Hall 1',
            todayStatus: 'SCHEDULED',
          },
        ],
      };
    }
  },

  // 2. Batches
  async getBatches(): Promise<BatchSummary[]> {
    try {
      const res = await apiClient.get<BatchSummary[]>('/teacher/batches');
      return Array.isArray(res) && res.length > 0 ? res : (await this.getDashboard()).activeBatches;
    } catch {
      return (await this.getDashboard()).activeBatches;
    }
  },

  // 3. Batch Students
  async getBatchStudents(batchId: string): Promise<BatchStudentRoster> {
    try {
      return await apiClient.get<BatchStudentRoster>(`/teacher/batches/${batchId}/students`);
    } catch {
      return {
        batch: {
          id: batchId,
          name: 'JEE Advanced — Mathematics Alpha',
          code: 'JEE-MTH-ADV',
          subject: 'Mathematics',
          gradeLevel: 'Class 12',
          studentCount: 5,
        },
        students: [
          { id: 'std_01', fullName: 'Aarav Patel', rollNumber: 'APX-2026-001', email: 'aarav@student.com', attendanceRate: 96 },
          { id: 'std_02', fullName: 'Diya Sen', rollNumber: 'APX-2026-002', email: 'diya@student.com', attendanceRate: 92 },
          { id: 'std_03', fullName: 'Rohan Deshmukh', rollNumber: 'APX-2026-003', email: 'rohan@student.com', attendanceRate: 88 },
          { id: 'std_04', fullName: 'Ananya Iyer', rollNumber: 'APX-2026-004', email: 'ananya@student.com', attendanceRate: 100 },
          { id: 'std_05', fullName: 'Vikram Malhotra', rollNumber: 'APX-2026-005', email: 'vikram@student.com', attendanceRate: 84 },
        ],
      };
    }
  },

  // 4. Assessments & Tests
  async getAssessments(batchId?: string): Promise<AssessmentItem[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      return await apiClient.get<AssessmentItem[]>(`/assessment/assessments${q}`);
    } catch {
      return [
        {
          id: 'asm_01',
          instituteId: 'inst_apex_academy',
          teacherId: 'usr_teacher_sharma',
          batchId: 'btc_jee_math_adv',
          batchName: 'JEE Advanced — Mathematics Alpha',
          title: 'Definite Integration & Vector Calculus Mock #1',
          category: 'WEEKLY_TEST',
          subject: 'Mathematics',
          assessmentDate: '2026-10-28',
          maxMarks: 100,
          passingMarks: 40,
          status: 'PUBLISHED',
          totalStudents: 38,
          evaluatedCount: 38,
          avgPercentage: 81,
          createdAt: '2026-10-28T00:00:00Z',
          updatedAt: '2026-10-28T00:00:00Z',
        },
      ];
    }
  },

  async createAssessment(dto: CreateAssessmentDto): Promise<AssessmentItem> {
    return apiClient.post<AssessmentItem>('/assessment/assessments', dto);
  },

  // 5. Bulk Attendance & Marks Submission
  async saveDraftMarks(dto: BulkSaveDraftDto): Promise<any> {
    return apiClient.post('/assessment/bulk-save-draft', dto);
  },

  async publishAssessment(assessmentId: string): Promise<any> {
    return apiClient.post(`/assessment/assessments/${assessmentId}/publish`, {});
  },

  // 6. Study Materials
  async getStudyMaterials(batchId?: string): Promise<StudyMaterialItem[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      return await apiClient.get<StudyMaterialItem[]>(`/tuition/materials${q}`);
    } catch {
      return [
        {
          id: 'mat_01',
          instituteId: 'inst_apex_academy',
          batchId: 'btc_jee_math_adv',
          batchName: 'JEE Advanced — Mathematics Alpha',
          facultyId: 'usr_teacher_sharma',
          facultyName: 'Prof. Rajesh Sharma',
          title: 'Definite Integrals — Theory & Solved Models',
          category: 'CHAPTER_NOTES',
          subject: 'Mathematics',
          chapter: 'Definite Integration',
          content: 'Covering King property, Leibniz rule, and Walli formula.',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
          fileName: 'Definite_Integrals_Notes.pdf',
          fileSize: '3.8 MB',
          status: 'PUBLISHED',
          isStudentVisible: true,
          downloadCount: 68,
          createdAt: '2026-10-28T10:00:00Z',
          updatedAt: '2026-10-28T10:00:00Z',
        },
      ];
    }
  },

  async createStudyMaterial(dto: CreateStudyMaterialDto): Promise<StudyMaterialItem> {
    return apiClient.post<StudyMaterialItem>('/tuition/materials', dto);
  },

  // 7. Teaching Diary
  async getDailyDiary(): Promise<DailyTeachingDiaryItem[]> {
    try {
      return await apiClient.get<DailyTeachingDiaryItem[]>('/tuition/diary');
    } catch {
      return [
        {
          id: 'diary_01',
          instituteId: 'inst_apex_academy',
          facultyId: 'usr_teacher_sharma',
          facultyName: 'Prof. Rajesh Sharma',
          batchId: 'btc_jee_math_adv',
          batchName: 'JEE Advanced — Mathematics Alpha',
          entryDate: '2026-10-29',
          subject: 'Mathematics',
          topicsCovered: 'Definite Integration — King property application',
          homeworkAssigned: 'DPP #14 Problems 1 to 25',
          batchPaceStatus: 'ON_TRACK',
          createdAt: '2026-10-29T11:00:00Z',
          updatedAt: '2026-10-29T11:00:00Z',
        },
      ];
    }
  },

  async createDailyDiary(dto: CreateTeachingDiaryDto): Promise<DailyTeachingDiaryItem> {
    return apiClient.post<DailyTeachingDiaryItem>('/tuition/diary', dto);
  },
};
