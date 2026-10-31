import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessmentService } from './assessment.service.js';
import { AccessService } from '../common/access/access.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AuthenticatedUser } from '../common/types.js';

function makeMockAssessmentDb() {
  const batches = [
    {
      id: 'btc_jee_math_adv',
      instituteId: 'inst_apex_academy',
      teacherId: 'usr_teacher_sharma',
      name: 'JEE Advanced — Mathematics Alpha',
      code: 'JEE-MTH-ADV',
      subject: 'Mathematics',
      gradeLevel: 'Class 12',
      isActive: true,
      room: 'Room 101',
    },
    {
      id: 'btc_neet_physics_core',
      instituteId: 'inst_apex_academy',
      teacherId: 'usr_teacher_sharma',
      name: 'Class 11 — Physics Core Batch',
      code: 'PHY-11-CORE',
      subject: 'Physics',
      gradeLevel: 'Class 11',
      isActive: true,
      room: 'Room 102',
    },
  ];

  const students = [
    {
      studentId: 'std_01',
      rollNumber: 'APX-2026-001',
      batchId: 'btc_jee_math_adv',
      instituteId: 'inst_apex_academy',
      status: 'ACTIVE',
      student: {
        id: 'std_01',
        fullName: 'Aarav Patel',
        email: 'aarav.patel@student.padhaipilot.com',
        phone: '+91 98220 11223',
      },
    },
    {
      studentId: 'std_02',
      rollNumber: 'APX-2026-002',
      batchId: 'btc_jee_math_adv',
      instituteId: 'inst_apex_academy',
      status: 'ACTIVE',
      student: {
        id: 'std_02',
        fullName: 'Diya Sen',
        email: 'diya.sen@student.padhaipilot.com',
        phone: '+91 98220 11224',
      },
    },
  ];

  let idCounter = 1;
  const assessments = new Map<string, any>();
  const assessmentMarks = new Map<string, any>();
  const audits: any[] = [];
  const notifications: any[] = [];

  const db: any = {
    isConnected: true,
    batch: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          batches.filter((b) => b.instituteId === where.instituteId && (!where.id?.in || where.id.in.includes(b.id))),
        );
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        const found = batches.find(
          (b) => b.id === where.id && b.instituteId === where.instituteId,
        );
        return Promise.resolve(found || null);
      }),
    },
    batchFaculty: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    enrollment: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          students.filter((s) => s.batchId === where.batchId && s.instituteId === where.instituteId),
        );
      }),
    },
    classroomAssessment: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `asm_${idCounter++}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        assessments.set(id, record);
        return Promise.resolve(record);
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        const asm = assessments.get(where.id);
        if (!asm) return Promise.resolve(null);
        if (include?.batch) {
          const batch = batches.find((b) => b.id === asm.batchId);
          return Promise.resolve({ ...asm, batch });
        }
        return Promise.resolve(asm);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const list = Array.from(assessments.values()).filter((a) => {
          if (where.instituteId && a.instituteId !== where.instituteId) return false;
          if (where.batchId && a.batchId !== where.batchId) return false;
          if (where.status && a.status !== where.status) return false;
          return true;
        });
        return Promise.resolve(list);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = assessments.get(where.id);
        if (!existing) return Promise.resolve(null);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        assessments.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    assessmentMark: {
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        for (const m of assessmentMarks.values()) {
          if (!where.assessmentId || m.assessmentId === where.assessmentId) {
            Object.assign(m, data);
          }
        }
        return Promise.resolve({ count: 1 });
      }),
      upsert: vi.fn().mockImplementation(({ where, create, update }) => {
        const assessmentId = where.assessmentId_studentId.assessmentId;
        const studentId = where.assessmentId_studentId.studentId;
        const key = `${assessmentId}:${studentId}`;
        const existing = assessmentMarks.get(key);
        const record = existing ? { ...existing, ...update } : { id: `mark_${idCounter++}`, assessmentId, studentId, ...create };
        assessmentMarks.set(key, record);
        return Promise.resolve(record);
      }),
      createMany: vi.fn().mockImplementation(({ data }) => {
        for (const item of data) {
          const id = `mark_${idCounter++}`;
          assessmentMarks.set(`${item.assessmentId}:${item.studentId}`, { id, ...item });
        }
        return Promise.resolve({ count: data.length });
      }),
      deleteMany: vi.fn().mockImplementation(({ where }) => {
        for (const [key, val] of assessmentMarks.entries()) {
          if (val.assessmentId === where.assessmentId) {
            assessmentMarks.delete(key);
          }
        }
        return Promise.resolve({ count: 1 });
      }),
      findMany: vi.fn().mockImplementation(({ where, include }) => {
        const list = Array.from(assessmentMarks.values()).filter((m) => {
          if (where.assessmentId && m.assessmentId !== where.assessmentId) return false;
          if (where.studentId && m.studentId !== where.studentId) return false;
          if (where.isPublished !== undefined && m.isPublished !== where.isPublished) return false;
          return true;
        }).map((m) => {
          if (include?.assessment) {
            const asm = assessments.get(m.assessmentId);
            return { ...m, assessment: asm };
          }
          return m;
        });
        return Promise.resolve(list);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id) {
          for (const m of assessmentMarks.values()) {
            if (m.id === where.id) return Promise.resolve(m);
          }
        }
        if (where.assessmentId_studentId) {
          const key = `${where.assessmentId_studentId.assessmentId}:${where.assessmentId_studentId.studentId}`;
          return Promise.resolve(assessmentMarks.get(key) || null);
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        for (const [key, m] of assessmentMarks.entries()) {
          if (m.id === where.id) {
            const updated = { ...m, ...data };
            assessmentMarks.set(key, updated);
            return Promise.resolve(updated);
          }
        }
        return Promise.resolve(null);
      }),
    },
    assessmentAudit: {
      create: vi.fn().mockImplementation(({ data }) => {
        const item = { id: `aud_${idCounter++}`, ...data, createdAt: new Date() };
        audits.push(item);
        return Promise.resolve(item);
      }),
      findMany: vi.fn().mockImplementation(({ where, orderBy }: any = {}) => {
        let list = [...audits];
        if (where?.assessmentId) {
          list = list.filter((a) => a.assessmentId === where.assessmentId);
        }
        if (orderBy?.createdAt === 'desc') {
          list.reverse();
        }
        return Promise.resolve(list);
      }),
    },
    notification: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        const found = notifications.find((n) => {
          if (where?.userId && n.userId !== where.userId) return false;
          if (where?.title && n.title !== where.title) return false;
          return true;
        });
        return Promise.resolve(found || null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const record = { id: `notif_${idCounter++}`, ...data, isRead: false, createdAt: new Date() };
        notifications.push(record);
        return Promise.resolve(record);
      }),
      createMany: vi.fn().mockImplementation(({ data }) => {
        for (const n of data) {
          notifications.push({ id: `notif_${idCounter++}`, ...n, isRead: false, createdAt: new Date() });
        }
        return Promise.resolve({ count: data.length });
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(notifications.filter((n) => !where.userId || n.userId === where.userId));
      }),
    },
    studyMaterial: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  db.$transaction = vi.fn(async (fn: (tx: unknown) => unknown) => fn(db));
  return db;
}

describe('AssessmentService — Bulk Attendance, Marks Entry & Result Publishing', () => {
  let service: AssessmentService;
  let teacherUser: AuthenticatedUser;
  let unauthorizedTeacher: AuthenticatedUser;
  let studentUser: AuthenticatedUser;
  let otherStudentUser: AuthenticatedUser;
  let mockDb: any;

  beforeEach(() => {
    mockDb = makeMockAssessmentDb();
    const redis = new RedisService();
    redis.onModuleInit();
    const access = new AccessService(mockDb);
    service = new AssessmentService(mockDb, redis, access);

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

      // 4. Verify student can view their result
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

      const student1Ids = student1Results.map((r) => r.studentId);
      const student2Ids = student2Results.map((r) => r.studentId);

      expect(student1Ids.every((id) => id === studentUser.id)).toBe(true);
      expect(student2Ids.every((id) => id === otherStudentUser.id)).toBe(true);
    });
  });

  describe('Result Correction & Audit History', () => {
    it('should permit authorized mark correction and document audit reason', async () => {
      const draftRes = await service.bulkSaveDraft(
        {
          batchId: 'btc_jee_math_adv',
          subject: 'Mathematics',
          title: 'Correction Target Exam',
          assessmentDate: '2026-10-28',
          maxMarks: 100,
          marks: [{ studentId: 'std_01', obtainedMarks: 70, attendanceStatus: 'PRESENT' }],
        },
        teacherUser,
      );

      await service.publishAssessment(draftRes.assessmentId, teacherUser);

      // Correct marks with explicit reason
      const correctionRes = await service.correctMark(
        draftRes.assessmentId,
        {
          studentId: 'std_01',
          correctedMarks: 85,
          correctionReason: 'Recounting of Page 4 solution verified.',
        },
        teacherUser,
      );

      expect(correctionRes.success).toBe(true);
      expect(correctionRes.updatedRecord.obtainedMarks).toBe(85);
      expect(correctionRes.updatedRecord.grade).toBe('A');

      // Check audit history
      const history = await service.getAuditHistory(draftRes.assessmentId, teacherUser);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].reason).toContain('Recounting of Page 4');
    });
  });

  describe('Export Integration', () => {
    it('should generate class result sheet in CSV format', async () => {
      const draftRes = await service.bulkSaveDraft(
        {
          batchId: 'btc_jee_math_adv',
          subject: 'Mathematics',
          title: 'Export Target Assessment',
          assessmentDate: '2026-10-29',
          maxMarks: 50,
          marks: [
            { studentId: 'std_01', obtainedMarks: 40, attendanceStatus: 'PRESENT' },
            { studentId: 'std_02', obtainedMarks: null, attendanceStatus: 'ABSENT' },
          ],
        },
        teacherUser,
      );

      const csv = await service.exportResultSheet(draftRes.assessmentId, 'CSV', teacherUser);
      expect(csv).toContain('Roll Number,Student Name,Marks Obtained,Percentage,Grade,Status');
      expect(csv).toContain('Aarav Patel');
      expect(csv).toContain('Diya Sen');
      expect(csv).toContain('ABSENT');
    });
  });
});
