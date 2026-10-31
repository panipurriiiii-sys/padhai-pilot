import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from './analytics.service.js';
import type { AuthenticatedUser } from '../common/types.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPrisma: any;
  let mockAccess: any;

  const mockStudent: AuthenticatedUser = {
    id: 'usr_student_1',
    email: 'student@example.com',
    fullName: 'Aarav Patel',
    role: 'STUDENT',
    instituteId: 'inst_apex',
    instituteName: 'Apex Academy',
  };

  const mockTeacher: AuthenticatedUser = {
    id: 'usr_teacher_1',
    email: 'teacher@example.com',
    fullName: 'Prof. Sharma',
    role: 'TEACHER',
    instituteId: 'inst_apex',
    instituteName: 'Apex Academy',
  };

  beforeEach(() => {
    mockPrisma = {
      isConnected: true,
      attendanceRecord: {
        findMany: vi.fn().mockResolvedValue([
          {
            status: 'PRESENT',
            session: {
              date: new Date('2026-10-25'),
              batch: { subject: 'Mathematics' },
            },
          },
          {
            status: 'ABSENT',
            session: {
              date: new Date('2026-10-26'),
              batch: { subject: 'Mathematics' },
            },
          },
        ]),
        count: vi.fn().mockResolvedValue(150),
      },
      assessmentMark: {
        groupBy: vi.fn().mockResolvedValue([{ assessmentId: 'asm_1', _avg: { percentage: 72.4 } }]),
        findMany: vi.fn().mockResolvedValue([
          {
            assessmentId: 'asm_1',
            obtainedMarks: 45,
            percentage: 90,
            grade: 'A+',
            resultStatus: 'SCORED',
            assessment: {
              id: 'asm_1',
              title: 'Calculus Quiz',
              subject: 'Mathematics',
              assessmentDate: new Date('2026-10-20'),
              maxMarks: 50,
            },
          },
        ]),
      },
      assignment: {
        count: vi.fn().mockResolvedValue(10),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'asg_1',
            title: 'Vectors Sheet',
            dueDate: new Date('2026-11-01'),
            batch: { _count: { enrollments: 25 } },
            _count: { submissions: 20 },
          },
        ]),
      },
      assignmentSubmission: {
        findMany: vi.fn().mockResolvedValue([
          { status: 'GRADED' },
          { status: 'SUBMITTED' },
        ]),
      },
      batch: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'btc_1', name: 'JEE Math Alpha', subject: 'Mathematics' },
        ]),
      },
      attendanceSession: {
        findMany: vi.fn().mockResolvedValue([
          {
            records: [{ status: 'PRESENT' }, { status: 'PRESENT' }],
          },
        ]),
      },
      classroomAssessment: {
        findMany: vi.fn().mockResolvedValue([
          {
            subject: 'Mathematics',
            marks: [{ percentage: 85 }],
            batch: { _count: { enrollments: 25 } },
          },
        ]),
        count: vi.fn().mockResolvedValue(42),
      },
      lessonPlan: {
        findMany: vi.fn().mockResolvedValue([
          {
            batchId: 'btc_1',
            subject: 'Mathematics',
            isCompleted: true,
            batch: { name: 'JEE Math Alpha' },
          },
          {
            batchId: 'btc_1',
            subject: 'Mathematics',
            isCompleted: false,
            batch: { name: 'JEE Math Alpha' },
          },
        ]),
      },
      institute: {
        count: vi.fn().mockResolvedValue(12),
        findMany: vi.fn().mockResolvedValue([
          { plan: 'STARTER' },
          { plan: 'PRO' },
          { plan: 'ENTERPRISE' },
        ]),
      },
      user: {
        count: vi.fn().mockResolvedValue(350),
      },
    };

    mockAccess = {
      studentBatchIds: vi.fn().mockResolvedValue(['btc_1']),
      staffBatchIds: vi.fn().mockResolvedValue(['btc_1']),
      assertBatchAccess: vi.fn().mockResolvedValue({ id: 'btc_1', name: 'JEE Math Alpha' }),
    };

    service = new AnalyticsService(mockPrisma, mockAccess);
  });

  describe('Student Analytics', () => {
    it('should aggregate student attendance, exam score trend, and homework summary', async () => {
      const summary = await service.getStudentAnalytics(mockStudent);
      expect(summary.studentId).toBe(mockStudent.id);
      expect(summary.attendanceRate).toBe(50); // 1 present out of 2 records
      expect(summary.attendanceTrend.length).toBe(2);
      expect(summary.subjectPerformance.length).toBe(1);
      expect(summary.subjectPerformance[0].subject).toBe('Mathematics');
      expect(summary.examScoreTrend.length).toBe(1);
      expect(summary.homeworkSummary.totalAssigned).toBe(10);
      expect(summary.homeworkSummary.submitted).toBe(2);
      expect(summary.homeworkSummary.graded).toBe(1);
    });
  });

  describe('Teacher Analytics', () => {
    it('should aggregate batch attendance trends, grade distribution, and syllabus coverage', async () => {
      const summary = await service.getTeacherAnalytics(mockTeacher);
      expect(summary.instituteId).toBe(mockTeacher.instituteId);
      expect(summary.batchAttendanceTrends.length).toBe(1);
      expect(summary.batchAttendanceTrends[0].averageAttendancePercentage).toBe(100);
      expect(summary.gradeDistribution.length).toBeGreaterThan(0);
      expect(summary.subjectComparison.length).toBe(1);
      expect(summary.assignmentSubmissions.length).toBe(1);
      expect(summary.syllabusCoverage.length).toBe(1);
      expect(summary.syllabusCoverage[0].coveragePercentage).toBe(50);
    });
  });

  describe('Admin Analytics', () => {
    it('should calculate platform-wide metrics and activity counts', async () => {
      const summary = await service.getAdminAnalytics();
      expect(summary.totalInstitutes).toBe(12);
      expect(summary.institutesByPlan).toBeDefined();
      expect(summary.recentActivityCounts.assessmentsCreated).toBe(42);
      expect(summary.recentActivityCounts.attendanceRecorded).toBe(150);
    });
  });
});
