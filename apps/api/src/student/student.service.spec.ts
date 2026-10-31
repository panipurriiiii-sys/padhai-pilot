import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { StudentService } from './student.service.js';
import { AccessService, clearSessionCache } from '../common/access/access.service.js';
import type { AuthenticatedUser } from '../common/types.js';

/**
 * Unit tests against hand-written Prisma stubs (vi.fn). They verify query scoping and business rules in the
 * service code; they are NOT a substitute for running against PostgreSQL (no test database exists yet).
 */
const student: AuthenticatedUser = {
  id: 'stu1',
  email: 's@example.com',
  fullName: 'Stu One',
  role: 'STUDENT',
  instituteId: 'instA',
  instituteName: 'Inst A',
};

function makeDb(overrides: Record<string, unknown> = {}) {
  const db: any = {
    isConnected: true,
    enrollment: { findMany: vi.fn().mockResolvedValue([{ batchId: 'b1' }]) },
    testQuiz: { findFirst: vi.fn() },
    testAttempt: { findUnique: vi.fn(), create: vi.fn() },
    testAttemptAnswer: { createMany: vi.fn() },
    testQuestion: { findMany: vi.fn() },
    assignment: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
    assignmentSubmission: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    studyTask: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn(), deleteMany: vi.fn() },
    dailyTeachingDiary: { findMany: vi.fn().mockResolvedValue([]) },
    ...overrides,
  };
  db.$transaction = vi.fn(async (fn: (tx: unknown) => unknown) => fn(db));
  return db;
}

function makeService(db: any) {
  const access = new AccessService(db);
  return new StudentService(access, {} as any);
}

describe('StudentService (tenant + ownership scoping)', () => {
  beforeEach(() => clearSessionCache());

  it('fails closed with 503 when the database is not connected', async () => {
    const db = makeDb();
    db.isConnected = false;
    await expect(makeService(db).getAssignments(student)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('a student with no enrolment gets empty lists, never another batch\'s data', async () => {
    const db = makeDb({ enrollment: { findMany: vi.fn().mockResolvedValue([]) } });
    const svc = makeService(db);
    expect(await svc.getAssignments(student)).toEqual([]);
    expect(await svc.getTeachingDiaries(student)).toEqual([]);
    expect(await svc.getTests(student)).toEqual([]);
    expect(db.dailyTeachingDiary.findMany).not.toHaveBeenCalled();
  });

  it('derives institute and enrolments from the JWT user, not client input', async () => {
    const db = makeDb();
    await makeService(db).getAssignments(student);
    expect(db.enrollment.findMany.mock.calls[0][0].where).toMatchObject({ studentId: 'stu1', instituteId: 'instA' });
    expect(db.assignment.findMany.mock.calls[0][0].where).toMatchObject({ instituteId: 'instA', batchId: { in: ['b1'] } });
  });

  it('submitting to an assignment outside the student\'s batches is a 404', async () => {
    const db = makeDb();
    db.assignment.findFirst.mockResolvedValue(null);
    await expect(makeService(db).submitAssignment(student, 'foreign', { content: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    expect(db.assignment.findFirst.mock.calls[0][0].where).toMatchObject({ instituteId: 'instA', batchId: { in: ['b1'] } });
  });

  it('graded assignments cannot be overwritten', async () => {
    const db = makeDb();
    db.assignment.findFirst.mockResolvedValue({ id: 'a1', dueDate: new Date(Date.now() + 1e6) });
    db.assignmentSubmission.findUnique.mockResolvedValue({ id: 's1', status: 'GRADED' });
    db.assignmentSubmission.updateMany.mockResolvedValue({ count: 0 });
    await expect(makeService(db).submitAssignment(student, 'a1', { content: 'again' })).rejects.toBeInstanceOf(ConflictException);
  });

  describe('tests', () => {
    const openTest = { id: 't1', title: 'T', instructions: null, subject: 'M', durationMinutes: 30, totalMarks: 8, scheduledDate: new Date(Date.now() - 1e6), closesAt: new Date(Date.now() + 1e6) };

    it('never selects or returns the answer key when serving a paper', async () => {
      const db = makeDb();
      db.testQuiz.findFirst.mockResolvedValue(openTest);
      db.testAttempt.findUnique.mockResolvedValue(null);
      db.testQuestion.findMany.mockResolvedValue([{ id: 'q1', text: 'Q', type: 'MCQ', options: ['a', 'b'], marks: 4 }]);
      const paper = await makeService(db).getTestDetails(student, 't1');
      const select = db.testQuestion.findMany.mock.calls[0][0].select;
      expect(select.correctOptionIndex).toBeUndefined();
      expect(select.negativeMarks).toBeUndefined();
      expect(JSON.stringify(paper)).not.toMatch(/correct/i);
    });

    it('scores on the server with negative marking and stores per-answer rows', async () => {
      const db = makeDb();
      db.testQuiz.findFirst.mockResolvedValue(openTest);
      db.testAttempt.findUnique.mockResolvedValue(null);
      db.testQuestion.findMany.mockResolvedValue([
        { id: 'q1', type: 'MCQ', options: ['a', 'b'], correctOptionIndex: 0, marks: 4, negativeMarks: 1 },
        { id: 'q2', type: 'MCQ', options: ['a', 'b'], correctOptionIndex: 1, marks: 4, negativeMarks: 1 },
      ]);
      db.testAttempt.create.mockImplementation(async ({ data }: any) => ({ id: 'att1', score: data.score, totalMarks: data.totalMarks, feedback: data.feedback, submittedAt: new Date(), status: data.status }));
      const res = await makeService(db).submitTestAttempt(student, 't1', [
        { questionId: 'q1', selectedOptionIndex: 0 }, // +4
        { questionId: 'q2', selectedOptionIndex: 0 }, // -1
        { questionId: 'ghost', selectedOptionIndex: 0 }, // ignored
      ]);
      expect(res.score).toBe(3);
      expect(res.totalMarks).toBe(8);
      expect(db.testAttemptAnswer.createMany.mock.calls[0][0].data).toHaveLength(2);
    });

    it('is idempotent: a repeated submit returns the original result and never re-scores', async () => {
      const db = makeDb();
      db.testQuiz.findFirst.mockResolvedValue(openTest);
      db.testAttempt.findUnique.mockResolvedValue({ score: 4, totalMarks: 8, feedback: 'f', submittedAt: new Date(), status: 'GRADED' });
      const res = await makeService(db).submitTestAttempt(student, 't1', [{ questionId: 'q1', selectedOptionIndex: 1 }]);
      expect(res.score).toBe(4);
      expect(db.testAttempt.create).not.toHaveBeenCalled();
    });

    it('a concurrent double-submit (unique violation) returns the winner\'s result', async () => {
      const db = makeDb();
      db.testQuiz.findFirst.mockResolvedValue(openTest);
      const stored = { score: 8, totalMarks: 8, feedback: 'f', submittedAt: new Date(), status: 'GRADED' };
      db.testAttempt.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(stored);
      db.testQuestion.findMany.mockResolvedValue([{ id: 'q1', type: 'MCQ', options: ['a', 'b'], correctOptionIndex: 0, marks: 8, negativeMarks: 0 }]);
      db.testAttempt.create.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }));
      const res = await makeService(db).submitTestAttempt(student, 't1', [{ questionId: 'q1', selectedOptionIndex: 0 }]);
      expect(res.score).toBe(8);
    });
  });

  it('study tasks are owner-scoped: another user\'s task id is a 404', async () => {
    const db = makeDb();
    db.studyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(makeService(db).updateStudyTask(student, 'someone-elses', { isCompleted: true })).rejects.toBeInstanceOf(NotFoundException);
    expect(db.studyTask.updateMany.mock.calls[0][0].where).toEqual({ id: 'someone-elses', userId: 'stu1' });
    db.studyTask.deleteMany.mockResolvedValue({ count: 0 });
    await expect(makeService(db).deleteStudyTask(student, 'someone-elses')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AccessService session verification (revocation)', () => {
  beforeEach(() => clearSessionCache());
  const claims = { id: 'u1', role: 'FACULTY', instituteId: 'instA', tv: 0 };
  const active = { status: 'ACTIVE', role: 'FACULTY', institute: { isActive: true }, user: { isActive: true, tokenVersion: 0 } };
  const mk = (membership: unknown) => {
    const db: any = { isConnected: true, instituteMembership: { findUnique: vi.fn().mockResolvedValue(membership) }, user: { findUnique: vi.fn() } };
    return { db, access: new AccessService(db) };
  };

  it('accepts an active membership', async () => {
    await expect(mk(active).access.verifySession(claims)).resolves.toBeUndefined();
  });

  it.each([
    ['revoked membership', { ...active, status: 'REVOKED' }],
    ['suspended tenant', { ...active, institute: { isActive: false } }],
    ['deactivated user', { ...active, user: { isActive: false, tokenVersion: 0 } }],
    ['bumped tokenVersion', { ...active, user: { isActive: true, tokenVersion: 1 } }],
    ['changed role', { ...active, role: 'STUDENT' }],
    ['deleted membership', null],
  ])('rejects %s', async (_name, membership) => {
    await expect(mk(membership).access.verifySession(claims)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sensitive writes bypass the positive cache', async () => {
    const { db, access } = mk(active);
    await access.verifySession(claims);
    await access.verifySession(claims);
    expect(db.instituteMembership.findUnique).toHaveBeenCalledTimes(1); // cached
    await access.assertActiveMembership({ ...claims, email: '', fullName: '', instituteName: '' } as any);
    expect(db.instituteMembership.findUnique).toHaveBeenCalledTimes(2);
  });
});
