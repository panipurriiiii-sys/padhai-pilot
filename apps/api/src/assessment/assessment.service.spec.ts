import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentService } from './assessment.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AuthenticatedUser } from '../common/types.js';

describe('AssessmentService — Bulk Attendance, Marks Entry & Result Publishing', () => {
  let service: AssessmentService;
  let teacherUser: AuthenticatedUser;
  let unauthorizedTeacher: AuthenticatedUser;
  let studentUser: AuthenticatedUser;
  let otherStudentUser: AuthenticatedUser;

  beforeEach(() => {
    const prisma = new PrismaService();
    const redis = new RedisService();
    redis.onModuleInit();
    service = new AssessmentService(prisma, redis);

    teacherUser = {
      id: 'usr_teacher_sharma',
      email: 'teacher@padhaipilot.com',
      fullName: 'Prof. Rajesh Sharma',
      role: 'TEACHER',
      instituteId: 'inst_apex_academy',
    };

    unauthorizedTeacher = {
      id: 'usr_teacher_outsider',
      email: 'outsider@otherinstitute.com',
      fullName: 'Prof. Stranger',
      role: 'TEACHER',
      instituteId: 'inst_different_academy',
    };

    studentUser = {
      id: 'std_01',
      email: 'aarav.patel@student.padhaipilot.com',
      fullName: 'Aarav Patel',
      role: 'STUDENT',
      instituteId: 'inst_apex_academy',
    };

    otherStudentUser = {
      id: 'std_02',
      email: 'diya.sen@student.padhaipilot.com',
      fullName: 'Diya Sen',
      role: 'STUDENT',
      instituteId: 'inst_apex_academy',
    };
  });

  describe('Authorization & Batch Selection', () => {
    it('should list authorized batches for the teacher', async () => {
      const batches = await service.getTeacherBatches(teacherUser);
      expect(batches.length).toBeGreaterThan(0);
      expect(batches[0].teacherId).toBe(teacherUser.id);
    });

    it('should reject unauthorized teacher attempting to access a batch', async () => {
      await expect(
        service.getBatchRoster('btc_jee_math_adv', unauthorizedTeacher),
      ).rejects.toThrow('Teacher is not authorized for this batch.');
    });

    it('should retrieve student roster for an authorized batch', async () => {
      const roster = await service.getBatchRoster('btc_jee_math_adv', teacherUser);
      expect(roster.length).toBeGreaterThan(0);
      expect(roster[0].fullName).toBe('Aarav Patel');
    });
  });

  describe('Mark Validation & Absent Student Handling', () => {
    it('should reject draft with maximum marks <= 0', async () => {
      await expect(
        service.bulkSaveDraft(
          {
            batchId: 'btc_jee_math_adv',
            subject: 'Mathematics',
            title: 'Unit Test 1',
            assessmentDate: '2026-10-25',
            maxMarks: 0,
            marks: [],
          },
          teacherUser,
        ),
      ).rejects.toThrow('Maximum marks must be greater than zero.');
    });

    it('should reject negative marks and marks exceeding maximum marks', async () => {
      await expect(
        service.bulkSaveDraft(
          {
            batchId: 'btc_jee_math_adv',
            subject: 'Mathematics',
            title: 'Unit Test 1',
            assessmentDate: '2026-10-25',
            maxMarks: 50,
            marks: [
              {
                studentId: 'std_01',
                attendanceStatus: 'PRESENT',
                obtainedMarks: 55, // Exceeds 50
              },
            ],
          },
          teacherUser,
        ),
      ).rejects.toThrow();

      await expect(
        service.bulkSaveDraft(
          {
            batchId: 'btc_jee_math_adv',
            subject: 'Mathematics',
            title: 'Unit Test 1',
            assessmentDate: '2026-10-25',
            maxMarks: 50,
            marks: [
              {
                studentId: 'std_01',
                attendanceStatus: 'PRESENT',
                obtainedMarks: -5, // Negative
              },
            ],
          },
          teacherUser,
        ),
      ).rejects.toThrow();
    });

    it('should NEVER silently assign zero marks to an absent student', async () => {
      const saveRes = await service.bulkSaveDraft(
        {
          batchId: 'btc_jee_math_adv',
          subject: 'Mathematics',
          title: 'Calculus Assessment',
          assessmentDate: '2026-10-25',
          maxMarks: 100,
          marks: [
            {
              studentId: 'std_01',
              attendanceStatus: 'PRESENT',
              obtainedMarks: 92,
            },
            {
              studentId: 'std_02',
              attendanceStatus: 'ABSENT',
              obtainedMarks: null,
            },
          ],
        },
        teacherUser,
      );

      expect(saveRes.success).toBe(true);
      const details = await service.getAssessmentDetails(saveRes.assessmentId, teacherUser);

      const absentStudent = details.roster.find((r) => r.studentId === 'std_02');
      expect(absentStudent).toBeDefined();
      expect(absentStudent?.attendanceStatus).toBe('ABSENT');
      expect(absentStudent?.obtainedMarks).toBeNull(); // Strictly null, NOT 0!
      expect(absentStudent?.resultStatus).toBe('ABSENT');
    });
  });

  describe('Draft, Review & Bulk Publishing Lifecycle', () => {
    it('should save draft, review summary, and publish results to students', async () => {
      // 1. Save Draft
      const draftRes = await service.bulkSaveDraft(
        {
          batchId: 'btc_jee_math_adv',
          subject: 'Mathematics',
          title: 'Matrices & Determinants Quiz',
          assessmentDate: '2026-10-26',
          maxMarks: 50,
          marks: [
            {
              studentId: 'std_01',
              attendanceStatus: 'PRESENT',
              obtainedMarks: 45, // 90% -> A+
            },
            {
              studentId: 'std_02',
              attendanceStatus: 'PRESENT',
              obtainedMarks: 38, // 76% -> B+
            },
          ],
        },
        teacherUser,
      );

      const assessmentId = draftRes.assessmentId;

      // 2. Pre-publish review
      const review = await service.getPublishReviewSummary(assessmentId, teacherUser);
      expect(review.summary.scoredCount).toBe(2);

      // 3. Publish
      const publishRes = await service.publishAssessment(assessmentId, teacherUser);
      expect(publishRes.success).toBe(true);
      expect(publishRes.publishedCount).toBeGreaterThanOrEqual(2);

      // 4. Verify student 1 can see published result with correct percentage and grade
      const studentResults = await service.getStudentPublishedResults(studentUser);
      const publishedQuiz = studentResults.find((r) => r.assessmentId === assessmentId);

      expect(publishedQuiz).toBeDefined();
      expect(publishedQuiz?.title).toBe('Matrices & Determinants Quiz');
      expect(publishedQuiz?.obtainedMarks).toBe(45);
      expect(publishedQuiz?.percentage).toBe(90);
      expect(publishedQuiz?.grade).toBe('A+');
      expect(publishedQuiz?.resultStatus).toBe('SCORED');

      // 5. Verify in-app notifications generated for student
      const notifications = await service.getStudentNotifications(studentUser);
      const quizNotif = notifications.find((n) => n.title.includes('Matrices & Determinants Quiz'));
      expect(quizNotif).toBeDefined();
      expect(quizNotif?.type).toBe('RESULT_PUBLISHED');
    });

    it('should keep unpublished drafts strictly hidden from students', async () => {
      // Create a draft that is NOT published
      const draftRes = await service.bulkSaveDraft(
        {
          batchId: 'btc_jee_math_adv',
          subject: 'Physics',
          title: 'Unpublished Secret Test Draft',
          assessmentDate: '2026-10-27',
          maxMarks: 100,
          marks: [
            {
              studentId: 'std_01',
              attendanceStatus: 'PRESENT',
              obtainedMarks: 88,
            },
          ],
        },
        teacherUser,
      );

      // Student results query
      const results = await service.getStudentPublishedResults(studentUser);
      const secretTest = results.find((r) => r.assessmentId === draftRes.assessmentId);
      expect(secretTest).toBeUndefined(); // MUST NOT BE VISIBLE
    });

    it('should strictly isolate results so student A cannot view student B results', async () => {
      const student1Results = await service.getStudentPublishedResults(studentUser);
      const student2Results = await service.getStudentPublishedResults(otherStudentUser);

      // Student 1 has 46.5 in calculus
      const std1Calc = student1Results.find((r) => r.assessmentId === 'asm_sample_calculus_01');
      expect(std1Calc?.obtainedMarks).toBe(46.5);

      // Student 2 has 42 in calculus
      const std2Calc = student2Results.find((r) => r.assessmentId === 'asm_sample_calculus_01');
      expect(std2Calc?.obtainedMarks).toBe(42);

      // Ensure no leakage
      expect(std1Calc?.markId).not.toBe(std2Calc?.markId);
    });
  });

  describe('Result Correction & Audit History', () => {
    it('should permit authorized mark correction and document audit reason', async () => {
      // Sample assessment mark for student 2 (std_02)
      const correctRes = await service.correctMark(
        'asm_sample_calculus_01',
        'mrk_02',
        {
          obtainedMarks: 47, // Re-evaluated from 42
          reason: 'Recounting error in section B question 4 resolved in review.',
        },
        teacherUser,
      );

      expect(correctRes.success).toBe(true);
      expect(correctRes.updatedMark.obtainedMarks).toBe(47);
      expect(correctRes.updatedMark.percentage).toBe(94);
      expect(correctRes.updatedMark.grade).toBe('A+');
      expect(correctRes.historyRecord.previousMarks).toBe(42);
      expect(correctRes.historyRecord.newMarks).toBe(47);
      expect(correctRes.historyRecord.reason).toContain('Recounting error');

      // Check revision notification sent to student 2
      const notifs = await service.getStudentNotifications(otherStudentUser);
      const revisedNotif = notifs.find((n) => n.type === 'RESULT_REVISED');
      expect(revisedNotif).toBeDefined();
      expect(revisedNotif?.message).toContain('revised to 47/50');
    });
  });

  describe('Export Integration', () => {
    it('should generate class result sheet in CSV format', async () => {
      const sheet = await service.exportResultSheet('asm_sample_calculus_01', teacherUser);
      expect(sheet.contentType).toBe('text/csv');
      expect(sheet.data).toContain('Student ID,Roll Number,Student Name');
      expect(sheet.data).toContain('Aarav Patel');
      expect(sheet.data).toContain('Diya Sen');
    });
  });
});

