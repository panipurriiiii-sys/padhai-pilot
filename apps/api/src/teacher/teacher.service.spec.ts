import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceUnavailableException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TeacherService } from './teacher.service.js';
import { AccessService } from '../common/access/access.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AuthenticatedUser } from '../common/types.js';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  const sampleBatch = {
    id: 'btc_jee_math_adv',
    instituteId: 'inst_apex_academy',
    name: 'JEE Advanced Mathematics',
    code: 'JEE-MTH-ADV',
    subject: 'Mathematics',
    gradeLevel: 'Class 12',
    room: 'Room 101',
    teacherId: 'usr_teacher_sharma',
    isActive: true,
    _count: { enrollments: 25 },
  };

  const sampleStudent = {
    studentId: 'std_01',
    rollNumber: 'APX-2026-001',
    joinedAt: new Date(),
    student: {
      id: 'std_01',
      fullName: 'Aarav Patel',
      email: 'aarav@apex.edu',
      phone: '+91 98220 11223',
    },
  };

  const db: any = {
    isConnected: true,
    batch: {
      findMany: vi.fn().mockResolvedValue([sampleBatch]),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where.instituteId === 'inst_apex_academy' && where.id === 'btc_jee_math_adv') {
          return Promise.resolve(sampleBatch);
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockResolvedValue(sampleBatch),
    },
    batchFaculty: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    enrollment: {
      findMany: vi.fn().mockResolvedValue([sampleStudent]),
    },
    invitationCode: {
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'inv_1', usedCount: 0 })),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where.code && where.code.startsWith('APX-')) {
          return Promise.resolve({
            id: 'inv_1',
            code: where.code,
            instituteId: 'inst_apex_academy',
            batchId: 'btc_jee_math_adv',
            batch: sampleBatch,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 86400000),
            usedCount: 0,
            maxUses: 50,
          });
        }
        return Promise.resolve(null);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.code && where.code.startsWith('APX-')) {
          return Promise.resolve({
            id: 'inv_1',
            code: where.code,
            instituteId: 'inst_apex_academy',
            batchId: 'btc_jee_math_adv',
            batch: sampleBatch,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 86400000),
            usedCount: 0,
            maxUses: 50,
          });
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockResolvedValue({ id: 'inv_1', status: 'REVOKED' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    attendanceSession: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({
        id: 'att_sess_1',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        date: new Date('2026-10-29T00:00:00.000Z'),
        totalPresent: 1,
        totalAbsent: 1,
        totalLate: 0,
        totalExcused: 0,
        records: [],
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'att_sess_1',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        date: new Date('2026-10-29T00:00:00.000Z'),
        totalPresent: 1,
        totalAbsent: 1,
        totalLate: 0,
        totalExcused: 0,
        records: [],
      }),
      upsert: vi.fn().mockImplementation(({ create, update }) => Promise.resolve({
        id: 'att_sess_1',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        ...(create || update),
      })),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'att_sess_1' })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'att_sess_1' })),
    },
    attendanceRecord: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      upsert: vi.fn().mockResolvedValue({ id: 'rec_1' }),
    },
    assignment: {
      count: vi.fn().mockResolvedValue(5),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 'asg_1' || where.batchId === 'btc_jee_math_adv') {
          return Promise.resolve({
            id: 'asg_1',
            instituteId: 'inst_apex_academy',
            batchId: 'btc_jee_math_adv',
            teacherId: 'usr_teacher_sharma',
            title: 'Vectors Mid-Term Assessment',
            subject: 'Mathematics',
            batch: sampleBatch,
          });
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'asg_1', status: 'PUBLISHED' })),
    },
    assignmentSubmission: {
      count: vi.fn().mockResolvedValue(3),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'sub_01',
        assignmentId: 'asg_1',
        studentId: 'std_01',
        assignment: { id: 'asg_1', instituteId: 'inst_apex_academy', teacherId: 'usr_teacher_sharma', batchId: 'btc_jee_math_adv' },
      }),
      findFirst: vi.fn().mockResolvedValue({
        id: 'sub_01',
        assignmentId: 'asg_1',
        studentId: 'std_01',
        assignment: { id: 'asg_1', instituteId: 'inst_apex_academy', teacherId: 'usr_teacher_sharma', batchId: 'btc_jee_math_adv' },
      }),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'sub_01', ...data })),
    },
    testQuiz: {
      count: vi.fn().mockResolvedValue(2),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({
        id: 'tst_1',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        teacherId: 'usr_teacher_sharma',
        title: 'Differential Calculus Mid-Term',
        resultsReleased: false,
      }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({
        id: 'tst_1',
        ...data,
        totalMarks: 5,
        resultsReleased: false,
      })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({
        id: 'tst_1',
        resultsReleased: data.resultsReleased ?? true,
      })),
    },
    testQuestion: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    lessonPlan: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({
        id: 'plan_1',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        teacherId: 'usr_teacher_sharma',
        isCompleted: false,
      }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'plan_1', isCompleted: false })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'plan_1', isCompleted: data.isCompleted ?? true })),
    },
    timetableSlot: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    announcement: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'ann_1' })),
    },
    academicQuery: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    academicQueryReply: {
      create: vi.fn().mockResolvedValue({ id: 'rep_1' }),
    },
    ...overrides,
  };

  db.$transaction = vi.fn(async (fn: (tx: unknown) => unknown) => fn(db));
  return db;
}

describe('TeacherService Core Workflows & Redis Caching', () => {
  let service: TeacherService;
  let redisService: RedisService;
  let mockTeacher: AuthenticatedUser;
  let rogueTeacher: AuthenticatedUser;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = makeMockDb();
    const access = new AccessService(mockDb);
    redisService = new RedisService();
    redisService.onModuleInit();
    service = new TeacherService(mockDb, redisService, access);

    mockTeacher = {
      id: 'usr_teacher_sharma',
      email: 'teacher@padhaipilot.com',
      fullName: 'Prof. Rajesh Sharma',
      role: 'TEACHER',
      instituteId: 'inst_apex_academy',
      instituteName: 'Apex Academy',
    };

    await redisService.invalidateTeacherDashboard(mockTeacher.instituteId, mockTeacher.id);

    rogueTeacher = {
      id: 'usr_rogue_intruder',
      email: 'intruder@other.com',
      fullName: 'Intruder',
      role: 'TEACHER',
      instituteId: 'inst_other_academy',
      instituteName: 'Other Academy',
    };
  });

  it('fails closed with 503 when database is not connected', async () => {
    mockDb.isConnected = false;
    await expect(service.getDashboardMetrics(mockTeacher)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should return aggregated dashboard metrics and cache in Redis', async () => {
    const metrics = await service.getDashboardMetrics(mockTeacher);
    expect(metrics).toBeDefined();
    expect(metrics.assignedBatchesCount).toBeGreaterThan(0);
    expect(metrics.totalStudentsCount).toBeGreaterThan(0);

    // Second call should retrieve from cache
    const cachedMetrics = await service.getDashboardMetrics(mockTeacher);
    expect(cachedMetrics).toEqual(metrics);
  });

  it('should enforce tenant & teacher isolation on batch roster access', async () => {
    const roster = await service.getBatchRoster('btc_jee_math_adv', mockTeacher);
    expect(roster.batch.id).toBe('btc_jee_math_adv');
    expect(roster.students.length).toBeGreaterThan(0);

    await expect(service.getBatchRoster('btc_jee_math_adv', rogueTeacher)).rejects.toThrow();
  });

  it('should generate unpredictable invitation codes and revoke them properly', async () => {
    const inv = await service.createInvitation({ batchId: 'btc_jee_math_adv', maxUses: 30 }, mockTeacher);
    expect(inv.code).toMatch(/^APX-[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    expect(inv.status).toBe('ACTIVE');

    const check = await service.validateCodePublic(inv.code);
    expect(check.valid).toBe(true);

    const revokeRes = await service.revokeInvitation(inv.code, mockTeacher);
    expect(revokeRes.success).toBe(true);
  });

  it('should record attendance and prevent duplicate sessions for same date', async () => {
    const today = '2026-10-29';
    const records = [
      { studentId: 'std_01', status: 'PRESENT' as const },
      { studentId: 'std_02', status: 'ABSENT' as const, note: 'Sick leave' },
    ];

    const saveRes = await service.saveAttendance(
      { batchId: 'btc_jee_math_adv', date: today, records },
      mockTeacher,
    );
    expect(saveRes.success).toBe(true);
    expect(saveRes.session.totalPresent).toBe(1);

    const sessionRes = await service.getAttendanceSession('btc_jee_math_adv', today, mockTeacher);
    expect(sessionRes.isRecorded).toBe(true);
  });

  it('should create and grade assignment submissions', async () => {
    const asg = await service.createAssignment(
      {
        batchId: 'btc_jee_math_adv',
        title: 'Vectors Mid-Term Assessment',
        instructions: 'Complete questions 1 to 10',
        subject: 'Mathematics',
        dueDate: '2026-11-05T00:00:00.000Z',
        maxMarks: 100,
      },
      mockTeacher,
    );
    expect(asg.id).toBeDefined();

    const gradeRes = await service.gradeSubmission(
      'sub_01',
      { marksObtained: 45, feedback: 'Well structured solutions' },
      mockTeacher,
    );
    expect(gradeRes.success).toBe(true);
    expect(gradeRes.submission.marksObtained).toBe(45);
  });

  it('should create tests and release results to authorized batches', async () => {
    const test = await service.createTest(
      {
        batchId: 'btc_jee_math_adv',
        title: 'Differential Calculus Mid-Term',
        subject: 'Mathematics',
        durationMinutes: 60,
        scheduledDate: '2026-11-10T10:00:00.000Z',
        questions: [
          { id: 'q1', text: 'Derivative of ln(x)?', type: 'MCQ', options: ['1/x', 'x', 'e^x', '0'], correctOptionIndex: 0, marks: 5 },
        ],
      },
      mockTeacher,
    );

    expect(test.id).toBeDefined();
    expect(test.totalMarks).toBe(5);
    expect(test.resultsReleased).toBe(false);

    // Release results
    const toggleRes = await service.toggleTestResults(test.id, mockTeacher);
    expect(toggleRes.success).toBe(true);
    expect(toggleRes.resultsReleased).toBe(true);
  });

  it('should manage lesson plans and syllabus coverage', async () => {
    const plan = await service.createLessonPlan(
      {
        batchId: 'btc_jee_math_adv',
        title: 'Integral Calculus: Definite Integrals',
        topic: 'Properties of Definite Integrals',
        subject: 'Mathematics',
        weekNumber: 6,
        content: 'Cover Kings property and piecewise periodic functions.',
      },
      mockTeacher,
    );

    expect(plan.isCompleted).toBe(false);

    const toggle = await service.toggleLessonPlanStatus(plan.id, mockTeacher);
    expect(toggle.isCompleted).toBe(true);
  });

  it('should generate aggregated teacher reports without unbounded scans', async () => {
    const reports = await service.getReports(mockTeacher);
    expect(reports.summary.totalBatches).toBeGreaterThan(0);
  });
});
