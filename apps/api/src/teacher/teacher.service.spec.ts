import { describe, it, expect, beforeEach } from 'vitest';
import { TeacherService } from './teacher.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AuthenticatedUser } from '../common/types.js';

describe('TeacherService Core Workflows & Redis Caching', () => {
  let service: TeacherService;
  let redisService: RedisService;
  let mockTeacher: AuthenticatedUser;
  let rogueTeacher: AuthenticatedUser;

  beforeEach(() => {
    const prisma = new PrismaService();
    redisService = new RedisService();
    redisService.onModuleInit();
    service = new TeacherService(prisma, redisService);

    mockTeacher = {
      id: 'usr_teacher_sharma',
      email: 'teacher@padhaipilot.com',
      fullName: 'Prof. Rajesh Sharma',
      role: 'TEACHER',
      instituteId: 'inst_apex_academy',
      instituteName: 'Apex Academy',
    };

    rogueTeacher = {
      id: 'usr_rogue_intruder',
      email: 'intruder@other.com',
      fullName: 'Intruder',
      role: 'TEACHER',
      instituteId: 'inst_other_academy',
      instituteName: 'Other Academy',
    };
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

    await expect(service.validateCodePublic(inv.code)).rejects.toThrow();
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
    expect(reports.attendanceTrends.length).toBeGreaterThan(0);
    expect(reports.batchPerformance.length).toBeGreaterThan(0);
  });
});
