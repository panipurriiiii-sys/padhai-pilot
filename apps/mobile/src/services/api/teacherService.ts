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

export interface TeacherAssignment {
  id: string;
  title: string;
  batchId: string;
  batchName?: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  instructions: string;
  fileUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EVALUATED';
  submissionsCount: number;
  evaluatedCount: number;
  createdAt: string;
}

export interface TeacherSubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: string;
  content?: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  status: 'PENDING' | 'EVALUATED' | 'RESUBMISSION_REQUESTED';
}

export interface TeacherTimetableSlot {
  id: string;
  dayOfWeek: string;
  timeSlot: string;
  batchName: string;
  subject: string;
  room: string;
  status: 'ACTIVE' | 'RESCHEDULED' | 'CANCELLED';
}

export interface FacultyLeaveRecord {
  id: string;
  facultyId: string;
  leaveType: 'CASUAL' | 'MEDICAL' | 'ACADEMIC' | 'EMERGENCY';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminRemarks?: string;
  appliedAt: string;
}

export interface FacultySalarySlip {
  id: string;
  payPeriod: string;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  deductions: number;
  netPayable: number;
  status: 'PAID' | 'PROCESSING';
  paidOn?: string;
  transactionRef?: string;
}

export interface TeacherInvitationItem {
  id: string;
  code: string;
  batchId: string;
  batchName: string;
  role: 'STUDENT';
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
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

  // 4. Attendance
  async saveAttendance(data: {
    batchId: string;
    date: string;
    records: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; remarks?: string }>;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/teacher/attendance', data);
  },

  async getAttendanceHistory(batchId: string, date?: string): Promise<any> {
    const q = date ? `?date=${date}` : '';
    return apiClient.get(`/teacher/attendance/${batchId}${q}`).catch(() => null);
  },

  // 5. Assessments & Bulk Marks
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

  async saveDraftMarks(dto: BulkSaveDraftDto): Promise<any> {
    return apiClient.post('/assessment/bulk-save-draft', dto);
  },

  async publishAssessment(assessmentId: string): Promise<any> {
    return apiClient.post(`/assessment/assessments/${assessmentId}/publish`, {});
  },

  // 6. Assignments & Grading
  async getAssignments(batchId?: string): Promise<TeacherAssignment[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      const res = await apiClient.get<TeacherAssignment[]>(`/teacher/assignments${q}`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'asg_01',
          title: 'Integration by Parts — Problem Set 4',
          batchId: 'btc_jee_math_adv',
          batchName: 'JEE Advanced — Mathematics Alpha',
          subject: 'Mathematics',
          dueDate: '2026-11-02',
          maxMarks: 50,
          instructions: 'Solve problems 1 to 20 from DPP #14 with step-by-step substitution.',
          status: 'PUBLISHED',
          submissionsCount: 32,
          evaluatedCount: 28,
          createdAt: '2026-10-28T10:00:00Z',
        },
      ];
    }
  },

  async createAssignment(data: {
    title: string;
    batchId: string;
    subject: string;
    dueDate: string;
    maxMarks: number;
    instructions: string;
    fileUrl?: string;
  }): Promise<TeacherAssignment> {
    return apiClient.post<TeacherAssignment>('/teacher/assignments', data);
  },

  async getAssignmentSubmissions(assignmentId: string): Promise<TeacherSubmissionItem[]> {
    try {
      const res = await apiClient.get<TeacherSubmissionItem[]>(`/teacher/assignments/${assignmentId}/submissions`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'sub_01',
          studentId: 'std_01',
          studentName: 'Aarav Patel',
          rollNumber: 'APX-2026-001',
          submittedAt: '2026-10-29T14:30:00Z',
          content: 'Attached handwritten solutions for questions 1-20.',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
          score: 48,
          feedback: 'Outstanding rigor in proof questions!',
          status: 'EVALUATED',
        },
        {
          id: 'sub_02',
          studentId: 'std_02',
          studentName: 'Diya Sen',
          rollNumber: 'APX-2026-002',
          submittedAt: '2026-10-29T16:00:00Z',
          content: 'Completed all steps.',
          status: 'PENDING',
        },
      ];
    }
  },

  async gradeSubmission(data: {
    submissionId: string;
    score: number;
    feedback?: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/teacher/assignments/grade', data);
  },

  // 7. Study Materials
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

  async uploadMediaProxy(
    base64: string,
    fileName: string,
    mimeType?: string,
  ): Promise<{
    url: string;
    data: string;
    fileName: string;
    fileSize: string;
    rawSize: number;
    mediaType: string;
  }> {
    return apiClient.post('/tuition/media/upload-proxy', { base64, fileName, mimeType });
  },

  // 8. Teaching Diary
  async getDailyDiary(): Promise<DailyTeachingDiaryItem[]> {
    try {
      return await apiClient.get<DailyTeachingDiaryItem[]>('/tuition/diaries');
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
    return apiClient.post<DailyTeachingDiaryItem>('/tuition/diaries', dto);
  },

  // 9. Timetable
  async getTimetable(): Promise<TeacherTimetableSlot[]> {
    try {
      const res = await apiClient.get<TeacherTimetableSlot[]>('/teacher/timetable');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        { id: '1', dayOfWeek: 'Monday', timeSlot: '09:00 - 10:30 AM', batchName: 'JEE Advanced — Math Alpha', subject: 'Mathematics', room: 'Room 302', status: 'ACTIVE' },
        { id: '2', dayOfWeek: 'Monday', timeSlot: '11:00 - 12:30 PM', batchName: 'Class 11 — Physics Core', subject: 'Physics', room: 'Hall 1', status: 'ACTIVE' },
        { id: '3', dayOfWeek: 'Tuesday', timeSlot: '09:00 - 10:30 AM', batchName: 'JEE Advanced — Math Alpha', subject: 'Mathematics', room: 'Room 302', status: 'ACTIVE' },
        { id: '4', dayOfWeek: 'Wednesday', timeSlot: '10:00 - 11:30 AM', batchName: 'Class 12 — Revision Super 30', subject: 'Mathematics', room: 'Lab 2', status: 'ACTIVE' },
      ];
    }
  },

  // 10. Faculty Leave Self-Service
  async getLeaves(): Promise<FacultyLeaveRecord[]> {
    try {
      const res = await apiClient.get<FacultyLeaveRecord[]>('/tuition/leaves');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'lv_01',
          facultyId: 'usr_teacher_sharma',
          leaveType: 'CASUAL',
          startDate: '2026-11-05',
          endDate: '2026-11-06',
          totalDays: 2,
          reason: 'Attending regional mathematics pedagogy conference.',
          status: 'APPROVED',
          adminRemarks: 'Approved. Sub-faculty Prof. Joshi assigned for Class 11.',
          appliedAt: '2026-10-25T09:00:00Z',
        },
      ];
    }
  },

  async applyLeave(data: {
    startDate: string;
    endDate: string;
    leaveType: 'CASUAL' | 'MEDICAL' | 'ACADEMIC' | 'EMERGENCY';
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/tuition/leaves/apply', data);
  },

  // 11. Faculty Salary
  async getSalaries(): Promise<FacultySalarySlip[]> {
    try {
      const res = await apiClient.get<FacultySalarySlip[]>('/tuition/salaries');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'sal_oct_2026',
          payPeriod: 'October 2026',
          basicSalary: 65000,
          hra: 15000,
          specialAllowance: 10000,
          deductions: 5000,
          netPayable: 85000,
          status: 'PAID',
          paidOn: '2026-10-28',
          transactionRef: 'NEFT-8899201948',
        },
        {
          id: 'sal_sep_2026',
          payPeriod: 'September 2026',
          basicSalary: 65000,
          hra: 15000,
          specialAllowance: 10000,
          deductions: 5000,
          netPayable: 85000,
          status: 'PAID',
          paidOn: '2026-09-28',
          transactionRef: 'NEFT-7744119933',
        },
      ];
    }
  },

  // 12. Student Invitations
  async getInvitations(): Promise<TeacherInvitationItem[]> {
    try {
      const res = await apiClient.get<TeacherInvitationItem[]>('/teacher/invitations');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'inv_01',
          code: 'APEX-JEE-2026',
          batchId: 'btc_jee_math_adv',
          batchName: 'JEE Advanced — Mathematics Alpha',
          role: 'STUDENT',
          maxUses: 40,
          usedCount: 38,
          expiresAt: '2026-12-31',
          status: 'ACTIVE',
        },
      ];
    }
  },

  async createInvitation(data: {
    batchId: string;
    maxUses?: number;
    expiresInDays?: number;
  }): Promise<TeacherInvitationItem> {
    return apiClient.post<TeacherInvitationItem>('/teacher/invitations', data);
  },

  async revokeInvitation(code: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/teacher/invitations/revoke', { code });
  },

  // 13. Announcements
  async getAnnouncements(): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>('/teacher/announcements');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'anc_01',
          title: 'Special Sunday Problem Solving Session',
          content: 'Doubt clearance in Room 302 for Calculus & Vectors.',
          priority: 'URGENT',
          createdAt: '2026-10-29T10:00:00Z',
        },
      ];
    }
  },
};
