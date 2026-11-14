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
      // Per-batch attendance is aggregated by PostgreSQL in a single statement:
      // 20 of 25 records present over 1 session for btc_1.
      $queryRaw: vi.fn().mockResolvedValue([
        { batchId: 'btc_1', present: 20n, total: 25n, sessions: 1n },
      ]),
      attendanceRecord: {
        groupBy: vi.fn().mockResolvedValue([
          { sessionId: 'ses_1', status: 'PRESENT', _count: { _all: 20 } },
          { sessionId: 'ses_1', status: 'ABSENT', _count: { _all: 5 } },
        ]),
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
        // The service now aggregates in PostgreSQL, so the mock answers per `by` clause:
        //  - ['grade']        -> grade distribution
        //  - ['assessmentId'] -> class average (student) and the subject sums (teacher)
        groupBy: vi.fn().mockImplementation(async (args: any) => {
          const by: string[] = args?.by ?? [];
          if (by.includes('grade')) {
            return [
              { grade: 'A+', _count: { _all: 3 } },
              { grade: 'B', _count: { _all: 1 } },
            ];
          }
          return [
            {
              assessmentId: 'asm_1',
              _avg: { percentage: 72.4 },
              _sum: { percentage: 85 },
              _count: { percentage: 1 },
            },
          ];
        }),
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
            batchId: 'btc_1',
            _count: { submissions: 20 },
          },
        ]),
      },
      // Active head count per batch, read once instead of a nested _count on every row.
      enrollment: {
        groupBy: vi.fn().mockResolvedValue([{ batchId: 'btc_1', _count: { _all: 25 } }]),
      },
      assignmentSubmission: {
        groupBy: vi.fn().mockResolvedValue([
          { status: 'GRADED', _count: { _all: 1 } },
          { status: 'SUBMITTED', _count: { _all: 1 } },
        ]),
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
      // Sessions are now fetched for every batch in one query, ids only.
      attendanceSession: {
        findMany: vi.fn().mockResolvedValue([{ id: 'ses_1', batchId: 'btc_1' }]),
      },
      classroomAssessment: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'asm_1', subject: 'Mathematics', batchId: 'btc_1' },
        ]),
        count: vi.fn().mockResolvedValue(42),
      },
      // Syllabus coverage is counted in PostgreSQL, grouped by batch + subject + completion.
      lessonPlan: {
        groupBy: vi.fn().mockResolvedValue([
          { batchId: 'btc_1', subject: 'Mathematics', isCompleted: true, _count: { _all: 1 } },
          { batchId: 'btc_1', subject: 'Mathematics', isCompleted: false, _count: { _all: 1 } },
        ]),
      },
      institute: {
        count: vi.fn().mockResolvedValue(12),
        groupBy: vi.fn().mockResolvedValue([
          { plan: 'STARTER', _count: { _all: 7 } },
          { plan: 'PRO', _count: { _all: 4 } },
          { plan: 'ENTERPRISE', _count: { _all: 1 } },
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
      // 20 PRESENT of 25 records for the batch's one session.
      expect(summary.batchAttendanceTrends[0].averageAttendancePercentage).toBe(80);
      expect(summary.batchAttendanceTrends[0].sessionsCount).toBe(1);
      expect(summary.gradeDistribution.length).toBeGreaterThan(0);
      expect(summary.subjectComparison.length).toBe(1);
      expect(summary.subjectComparison[0].totalStudents).toBe(25);
      expect(summary.assignmentSubmissions.length).toBe(1);
      expect(summary.assignmentSubmissions[0].totalStudents).toBe(25);
      expect(summary.syllabusCoverage.length).toBe(1);
      expect(summary.syllabusCoverage[0].batchName).toBe('JEE Math Alpha');
      expect(summary.syllabusCoverage[0].coveragePercentage).toBe(50);
    });

    it('aggregates in the database: no per-batch query loop and no row-by-row counting', async () => {
      await service.getTeacherAnalytics(mockTeacher);
      // Attendance for every batch comes back in one statement, not one query per batch.
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(mockPrisma.attendanceRecord.groupBy).not.toHaveBeenCalled();
      // Grades and syllabus coverage are counted by PostgreSQL, never loaded as rows.
      expect(mockPrisma.lessonPlan.groupBy).toHaveBeenCalledTimes(1);
      const byClauses = mockPrisma.assessmentMark.groupBy.mock.calls.map((c: any[]) => c[0].by);
      expect(byClauses).toEqual(expect.arrayContaining([['grade']]));
    });

    it('serves a repeat call from cache instead of querying again', async () => {
      const cache = new Map<string, unknown>();
      const redis = {
        get: vi.fn(async (k: string) => cache.get(k) ?? null),
        set: vi.fn(async (k: string, v: unknown) => void cache.set(k, v)),
      } as any;
      const cached = new AnalyticsService(mockPrisma, mockAccess, redis);

      const first = await cached.getTeacherAnalytics(mockTeacher);
      const callsAfterFirst = mockPrisma.batch.findMany.mock.calls.length;
      const second = await cached.getTeacherAnalytics(mockTeacher);

      expect(second).toEqual(first);
      expect(mockPrisma.batch.findMany.mock.calls.length).toBe(callsAfterFirst);
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
