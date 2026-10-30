import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentService } from './student.service.js';
import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types.js';

describe('StudentService Comprehensive Workflows', () => {
  let service: StudentService;
  let mockPrisma: any;
  let mockAssessmentService: any;
  let mockTuitionService: any;

  const mockStudent: AuthenticatedUser = {
    id: 'usr_student_aarav',
    email: 'aarav@example.com',
    fullName: 'Aarav Patel',
    role: 'STUDENT',
    instituteId: 'inst_apex_academy',
    instituteName: 'Apex IIT-JEE & Medical Academy',
  };

  beforeEach(() => {
    mockPrisma = {
      isConnected: false,
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      invitationCode: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      instituteMembership: {
        upsert: vi.fn(),
      },
      enrollment: {
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      attendanceRecord: {
        findMany: vi.fn(),
      },
      dailyTeachingDiary: {
        findMany: vi.fn(),
      },
      studentFeeRecord: {
        findMany: vi.fn(),
      },
    };

    mockAssessmentService = {
      getStudentPublishedResults: vi.fn().mockResolvedValue([
        {
          assessmentId: 'asm_01',
          title: 'Calculus Advanced Test',
          subject: 'Mathematics',
          maxMarks: 100,
          obtainedMarks: 94,
          percentage: 94,
          grade: 'A+',
          resultStatus: 'SCORED',
          isPublished: true,
        },
      ]),
      getStudentStudyMaterials: vi.fn().mockResolvedValue([
        {
          id: 'mat_01',
          title: 'Definite Integrals Notes',
          subject: 'Mathematics',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
        },
      ]),
    };

    mockTuitionService = {};

    service = new StudentService(
      mockPrisma as any,
      mockAssessmentService as any,
      mockTuitionService as any,
    );
  });

  // 1. Dashboard Overview
  describe('Student Dashboard', () => {
    it('should aggregate student profile, metrics, timetable, and announcements', async () => {
      const dashboard = await service.getDashboard(mockStudent);

      expect(dashboard.student.fullName).toBe('Aarav Patel');
      expect(dashboard.stats.totalTests).toBe(1);
      expect(dashboard.stats.avgPercentage).toBe(94);
      expect(dashboard.timetable.length).toBeGreaterThan(0);
      expect(dashboard.recentMaterials.length).toBeGreaterThan(0);
    });
  });

  // 2. Invitation & Batch Enrollment
  describe('Invitation & Enrollment', () => {
    it('should validate active invitation code', async () => {
      const result = await service.validateInvitation('APEX-INV-2026');
      expect(result.valid).toBe(true);
      expect(result.instituteName).toContain('Apex');
    });

    it('should reject empty invitation code', async () => {
      await expect(service.validateInvitation('')).rejects.toThrow(BadRequestException);
    });

    it('should successfully enroll student into the batch', async () => {
      const result = await service.joinInstitute(mockStudent, 'APEX-INV-2026');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully enrolled');
    });
  });

  // 3. Daily Teaching Diary
  describe('Daily Teaching Diary', () => {
    it('should return published teaching diary entries for student batches', async () => {
      const diaries = await service.getTeachingDiaries(mockStudent);
      expect(diaries.length).toBeGreaterThan(0);
      expect(diaries[0].chapterTitle).toContain('Definite Integration');
      expect(diaries[0].conceptsTaught).toBeDefined();
    });

    it('should filter teaching diaries by subject', async () => {
      const diaries = await service.getTeachingDiaries(mockStudent, { subject: 'Physics' });
      expect(diaries.every((d) => d.subject === 'Physics')).toBe(true);
    });
  });

  // 4. Attendance & Correction Requests
  describe('Attendance Workflows', () => {
    it('should calculate attendance percentage and present records', async () => {
      const attendance = await service.getAttendance(mockStudent);
      expect(attendance.totalClasses).toBeGreaterThan(0);
      expect(attendance.percentage).toBeGreaterThan(0);
      expect(attendance.records.length).toBeGreaterThan(0);
    });

    it('should submit attendance correction request', async () => {
      const result = await service.submitAttendanceCorrection(mockStudent, {
        date: '2026-10-23',
        reason: 'Attended session via online stream due to fever.',
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe('PENDING');
    });

    it('should reject correction request with empty reason', async () => {
      await expect(
        service.submitAttendanceCorrection(mockStudent, {
          date: '2026-10-23',
          reason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // 5. Homework & Assignment Management
  describe('Assignment Submissions', () => {
    it('should list published assignments with deadline and max marks', async () => {
      const assignments = await service.getAssignments(mockStudent);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments[0].maxMarks).toBeGreaterThan(0);
    });

    it('should allow student to submit an assignment', async () => {
      const result = await service.submitAssignment(mockStudent, 'asg_01', {
        content: 'Solved all 25 integrals with detailed substitution steps.',
        attachmentUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe('SUBMITTED');

      // Verify assignment list reflects updated status
      const updated = await service.getAssignments(mockStudent);
      const asg1 = updated.find((a) => a.id === 'asg_01');
      expect(asg1?.status).toBe('SUBMITTED');
    });
  });

  // 6. Online Tests & Server-Side Scoring
  describe('Assessment & Tests', () => {
    it('should provide test details without revealing answers', async () => {
      const test = await service.getTestDetails(mockStudent, 'tst_01');
      expect(test.questions.length).toBeGreaterThan(0);
      // Ensure questions don't leak correct answers
      expect((test.questions[0] as any).correctOptionIndex).toBeUndefined();
    });

    it('should score test attempt server-side and calculate marks', async () => {
      const attempt = await service.submitTestAttempt(mockStudent, 'tst_01', [
        { questionId: 'q1', selectedOptionIndex: 0 }, // Correct (+4)
        { questionId: 'q2', selectedOptionIndex: 0 }, // Correct (+4)
        { questionId: 'q3', selectedOptionIndex: 0 }, // Correct (+4)
        { questionId: 'q4', selectedOptionIndex: 0 }, // Correct (+4)
      ]);

      expect(attempt.success).toBe(true);
      expect(attempt.score).toBe(16);
      expect(attempt.percentage).toBe(40);
    });
  });

  // 7. Study Planner & Tasks
  describe('Personal Study Planner', () => {
    it('should manage study tasks lifecycle (create, toggle, delete)', async () => {
      const initial = await service.getStudyTasks(mockStudent);
      const initialCount = initial.length;

      const created = await service.createStudyTask(mockStudent, {
        title: 'Revise Integration by Parts',
        subject: 'Mathematics',
        priority: 'HIGH',
      });
      expect(created.title).toBe('Revise Integration by Parts');

      const toggled = await service.updateStudyTask(mockStudent, created.id, {
        isCompleted: true,
      });
      expect(toggled.isCompleted).toBe(true);

      await service.deleteStudyTask(mockStudent, created.id);
      const afterDelete = await service.getStudyTasks(mockStudent);
      expect(afterDelete.length).toBe(initialCount);
    });
  });

  // 8. Documents & PDF Center
  describe('Document Center', () => {
    it('should return verified official student documents and reports', async () => {
      const docs = await service.getDocuments(mockStudent);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.some((d) => d.category === 'REPORT_CARD')).toBe(true);
      expect(docs.some((d) => d.category === 'FEE_RECEIPT')).toBe(true);
    });
  });

  // 9. Academic Doubts & Queries
  describe('Student-to-Faculty Communication', () => {
    it('should allow student to submit an academic question', async () => {
      const result = await service.submitAcademicQuery(mockStudent, {
        subject: 'Mathematics',
        topic: 'Definite Integrals',
        questionText: 'How to handle non-symmetric limits in King property?',
      });
      expect(result.success).toBe(true);
      expect(result.query.status).toBe('PENDING');
    });
  });
});
