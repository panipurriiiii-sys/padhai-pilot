import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Optional,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { AccessService } from '../common/access/access.service.js';
import { assertDb, optionalUrl, parseDate, toDateOnly } from '../common/db/db.js';
import type { AuthenticatedUser } from '../common/types.js';
import { DOCUMENT_EXTENSIONS, validateMediaUrl } from '../common/security/media-url.js';

@Injectable()
export class TeacherService {
  private readonly access: AccessService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Optional() @Inject(AccessService) access?: AccessService,
  ) {
    this.access = access ?? new AccessService(prisma);
  }

  private get db(): PrismaService {
    assertDb(this.prisma);
    return this.prisma;
  }

  // -------------------------------------------------------------
  // 1. DASHBOARD OVERVIEW (With Redis Caching)
  // -------------------------------------------------------------
  async getDashboardMetrics(user: AuthenticatedUser) {
    const cached = await this.redis.getTeacherDashboard<any>(user.instituteId, user.id);
    if (cached) {
      return cached;
    }

    const staffBatchIds = await this.access.staffBatchIds(user);
    const batchWhere = {
      instituteId: user.instituteId,
      ...(staffBatchIds !== null ? { id: { in: staffBatchIds } } : {}),
      isActive: true,
    };

    const batches = await this.db.batch.findMany({
      where: batchWhere,
      select: {
        id: true,
        name: true,
        code: true,
        subject: true,
        gradeLevel: true,
        room: true,
        teacherId: true,
        _count: {
          select: {
            enrollments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    const activeBatches = batches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      subject: b.subject,
      gradeLevel: b.gradeLevel,
      room: b.room,
      teacherId: b.teacherId,
      studentCount: b._count.enrollments,
    }));

    const totalStudents = activeBatches.reduce((sum, b) => sum + b.studentCount, 0);

    const pendingReviews = await this.db.assignmentSubmission.count({
      where: {
        status: 'SUBMITTED',
        assignment: {
          instituteId: user.instituteId,
          ...(staffBatchIds !== null ? { batchId: { in: staffBatchIds } } : {}),
        },
      },
    });

    const today = toDateOnly(new Date());
    const recordedSessions = await this.db.attendanceSession.findMany({
      where: {
        instituteId: user.instituteId,
        ...(staffBatchIds !== null ? { batchId: { in: staffBatchIds } } : {}),
        date: today,
      },
      select: { batchId: true },
    });
    const recordedBatchIds = new Set(recordedSessions.map((s) => s.batchId));
    const pendingAttendanceCount = activeBatches.filter((b) => !recordedBatchIds.has(b.id)).length;

    const todayDayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
      new Date().getDay()
    ];
    const todaySchedule = await this.db.timetableSlot.findMany({
      where: {
        instituteId: user.instituteId,
        ...(staffBatchIds !== null ? { batchId: { in: staffBatchIds } } : {}),
        dayOfWeek: todayDayName,
      },
      include: {
        batch: { select: { name: true } },
      },
    });

    const recentAnnouncements = await this.db.announcement.findMany({
      where: {
        instituteId: user.instituteId,
        OR: [
          { batchId: null },
          ...(staffBatchIds !== null && staffBatchIds.length > 0 ? [{ batchId: { in: staffBatchIds } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const metrics = {
      todayClassesCount: todaySchedule.length,
      assignedBatchesCount: activeBatches.length,
      totalStudentsCount: totalStudents,
      pendingAttendanceCount,
      pendingReviewsCount: pendingReviews,
      recentAnnouncements,
      todaySchedule,
      activeBatches,
    };

    await this.redis.setTeacherDashboard(user.instituteId, user.id, metrics);
    return metrics;
  }

  // -------------------------------------------------------------
  // 4. ATTENDANCE WORKFLOWS
  // -------------------------------------------------------------
  async getAttendanceSession(batchId: string, date: string, user: AuthenticatedUser) {
    const batch = await this.access.assertBatchAccess(user, batchId);
    const targetDate = toDateOnly(date);

    const session = await this.db.attendanceSession.findUnique({
      where: {
        batchId_date: {
          batchId,
          date: targetDate,
        },
      },
      include: {
        records: {
          include: {
            student: { select: { fullName: true } },
          },
        },
      },
    });

    if (!session) {
      const enrollments = await this.db.enrollment.findMany({
        where: {
          batchId,
          instituteId: user.instituteId,
          status: 'ACTIVE',
        },
        include: {
          student: { select: { id: true, fullName: true } },
        },
        orderBy: { student: { fullName: 'asc' } },
        take: 1000,
      });

      const defaultRecords = enrollments.map((e) => ({
        studentId: e.student.id,
        studentName: e.student.fullName,
        rollNumber: e.rollNumber || '',
        status: 'PRESENT',
        note: '',
      }));

      return {
        isRecorded: false,
        batchName: batch.name,
        date,
        records: defaultRecords,
      };
    }

    const rolls = new Map(
      (
        await this.db.enrollment.findMany({
          where: { batchId, instituteId: user.instituteId, studentId: { in: session.records.map((r) => r.studentId) } },
          select: { studentId: true, rollNumber: true },
          take: 1000,
        })
      ).map((e) => [e.studentId, e.rollNumber]),
    );
    const records = session.records.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      studentId: r.studentId,
      studentName: r.student.fullName,
      rollNumber: rolls.get(r.studentId) || '',
      status: r.status,
      note: r.note || '',
      correctionReason: r.correctionReason,
      updatedBy: r.updatedBy,
    }));

    return {
      isRecorded: true,
      session,
      records,
    };
  }

  async saveAttendance(
    data: {
      batchId: string;
      date: string;
      records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note?: string }[];
    },
    user: AuthenticatedUser,
  ) {
    const batch = await this.access.assertBatchAccess(user, data.batchId);
    const targetDate = toDateOnly(data.date);
    const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    if (!Array.isArray(data.records) || data.records.length === 0 || data.records.length > 1000) {
      throw new BadRequestException('records must contain between 1 and 1000 entries.');
    }
    const seen = new Set<string>();
    for (const r of data.records) {
      if (!r || typeof r.studentId !== 'string' || !STATUSES.includes(r.status) || seen.has(r.studentId)) {
        throw new BadRequestException('Each record needs a unique studentId and a valid status.');
      }
      seen.add(r.studentId);
    }
    // Only students actively enrolled in THIS batch (and institute) may be marked.
    const enrolled = await this.db.enrollment.findMany({
      where: { batchId: data.batchId, instituteId: user.instituteId, status: 'ACTIVE', studentId: { in: [...seen] } },
      select: { studentId: true },
    });
    if (enrolled.length !== seen.size) {
      throw new BadRequestException('Some students are not enrolled in this batch.');
    }

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    data.records.forEach((r) => {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'LATE') late++;
      else if (r.status === 'EXCUSED') excused++;
    });

    const session = await this.db.$transaction(async (tx) => {
      const attSession = await tx.attendanceSession.upsert({
        where: {
          batchId_date: {
            batchId: data.batchId,
            date: targetDate,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          instituteId: user.instituteId,
          batchId: data.batchId,
          teacherId: user.id,
          date: targetDate,
          sessionTime: 'Regular Class',
        },
      });

      await Promise.all(
        data.records.map((r) =>
          tx.attendanceRecord.upsert({
            where: {
              sessionId_studentId: {
                sessionId: attSession.id,
                studentId: r.studentId,
              },
            },
            update: {
              status: r.status,
              note: r.note || null,
            },
            create: {
              sessionId: attSession.id,
              studentId: r.studentId,
              status: r.status,
              note: r.note || null,
            },
          }),
        ),
      );

      return attSession;
    });

    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);

    return {
      success: true,
      message: `Attendance for ${batch.name} (${data.date}) saved successfully.`,
      session: {
        ...session,
        totalPresent: present,
        totalAbsent: absent,
        totalLate: late,
        totalExcused: excused,
      },
    };
  }

  async correctRecord(
    recordId: string,
    data: { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; reason: string },
    user: AuthenticatedUser,
  ) {
    if (!data.reason || data.reason.trim().length < 5) {
      throw new BadRequestException('A valid reason (min 5 characters) is required to correct past attendance.');
    }

    const record = await this.db.attendanceRecord.findUnique({
      where: { id: recordId },
      include: { session: true },
    });

    if (!record || record.session.instituteId !== user.instituteId) {
      throw new NotFoundException('Attendance record not found.');
    }

    await this.access.assertBatchAccess(user, record.session.batchId);

    const updated = await this.db.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: data.status,
        correctionReason: data.reason,
        updatedBy: user.id,
      },
    });

    return { success: true, record: updated };
  }

  // -------------------------------------------------------------
  // 5. ASSIGNMENTS & HOMEWORK
  // -------------------------------------------------------------
  async getAssignments(user: AuthenticatedUser) {
    const staffBatchIds = await this.access.staffBatchIds(user);
    const where = {
      instituteId: user.instituteId,
      ...(staffBatchIds !== null ? { batchId: { in: staffBatchIds } } : {}),
    };

    const assignments = await this.db.assignment.findMany({
      where,
      include: {
        batch: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a) => ({
      ...a,
      batchName: a.batch.name,
      submissionCount: a._count.submissions,
    }));
  }

  async createAssignment(
    data: {
      batchId: string;
      title: string;
      instructions: string;
      subject: string;
      dueDate: string;
      maxMarks?: number;
      attachmentUrl?: string;
    },
    user: AuthenticatedUser,
  ) {
    const batch = await this.access.assertBatchAccess(user, data.batchId);
    const dueDate = parseDate(data.dueDate, 'dueDate');
    const attachmentUrl = validateMediaUrl(data.attachmentUrl, 'attachmentUrl', DOCUMENT_EXTENSIONS);

    const assignment = await this.db.assignment.create({
      data: {
        instituteId: user.instituteId,
        batchId: data.batchId,
        teacherId: user.id,
        title: data.title,
        instructions: data.instructions,
        subject: data.subject,
        dueDate,
        maxMarks: data.maxMarks || 100,
        status: 'PUBLISHED',
        attachmentUrl,
      },
    });

    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);

    return {
      ...assignment,
      batchName: batch.name,
      submissionCount: 0,
    };
  }

  /** Edit an assignment; `attachmentUrl: null | ''` removes the attachment. */
  async updateAssignment(
    assignmentId: string,
    data: { title?: string; instructions?: string; subject?: string; dueDate?: string; maxMarks?: number; attachmentUrl?: string | null },
    user: AuthenticatedUser,
  ) {
    const existing = await this.db.assignment.findFirst({ where: { id: assignmentId, instituteId: user.instituteId } });
    if (!existing) throw new NotFoundException('Assignment not found.');
    await this.access.assertBatchAccess(user, existing.batchId);
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.instructions !== undefined) patch.instructions = data.instructions;
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.maxMarks !== undefined) patch.maxMarks = data.maxMarks;
    if (data.dueDate !== undefined) patch.dueDate = parseDate(data.dueDate, 'dueDate');
    if (data.attachmentUrl !== undefined) {
      patch.attachmentUrl = data.attachmentUrl ? validateMediaUrl(data.attachmentUrl, 'attachmentUrl', DOCUMENT_EXTENSIONS) : null;
    }
    const updated = await this.db.assignment.update({ where: { id: assignmentId }, data: patch });
    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);
    return updated;
  }

  async getSubmissions(assignmentId: string, user: AuthenticatedUser) {
    const assignment = await this.db.assignment.findFirst({
      where: {
        id: assignmentId,
        instituteId: user.instituteId,
      },
      include: {
        batch: { select: { name: true } },
      },
    });

    if (!assignment) {
      throw new ForbiddenException('Unauthorized assignment.');
    }

    await this.access.assertBatchAccess(user, assignment.batchId);

    const submissions = await this.db.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 1000,
    });
    const rolls = new Map(
      (
        await this.db.enrollment.findMany({
          where: { batchId: assignment.batchId, instituteId: user.instituteId, studentId: { in: submissions.map((s) => s.studentId) } },
          select: { studentId: true, rollNumber: true },
          take: 1000,
        })
      ).map((e) => [e.studentId, e.rollNumber]),
    );

    return {
      assignment,
      submissions: submissions.map((s) => ({
        ...s,
        studentName: s.student.fullName,
        rollNumber: rolls.get(s.studentId) || '',
      })),
    };
  }

  async gradeSubmission(
    submissionId: string,
    data: { marksObtained: number; feedback?: string; resubmit?: boolean },
    user: AuthenticatedUser,
  ) {
    const sub = await this.db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!sub || sub.assignment.instituteId !== user.instituteId) {
      throw new NotFoundException('Submission not found.');
    }

    await this.access.assertBatchAccess(user, sub.assignment.batchId);

    const status = data.resubmit ? 'RESUBMIT' : 'GRADED';

    const updated = await this.db.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksObtained: data.marksObtained,
        feedback: data.feedback || null,
        status: status as any,
        gradedAt: new Date(),
        gradedBy: user.id,
      },
    });

    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);
    return { success: true, submission: updated };
  }

  // -------------------------------------------------------------
  // 6. TESTS & QUIZZES (Assessment Engine)
  // -------------------------------------------------------------
  async getTests(user: AuthenticatedUser) {
    const staffBatchIds = await this.access.staffBatchIds(user);
    const where = {
      instituteId: user.instituteId,
      ...(staffBatchIds !== null ? { batchId: { in: staffBatchIds } } : {}),
    };

    const tests = await this.db.testQuiz.findMany({
      where,
      include: {
        batch: { select: { name: true } },
        questionRows: {
          orderBy: { position: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tests.map((t) => ({
      ...t,
      batchName: t.batch.name,
      questions: t.questionRows,
      attemptCount: t._count.attempts,
    }));
  }

  async createTest(
    data: {
      batchId: string;
      title: string;
      subject: string;
      durationMinutes: number;
      scheduledDate: string;
      questions: any[];
    },
    user: AuthenticatedUser,
  ) {
    const batch = await this.access.assertBatchAccess(user, data.batchId);
    const scheduledDate = parseDate(data.scheduledDate, 'scheduledDate');
    const totalMarks = (data.questions || []).reduce((sum: number, q: any) => sum + (q.marks || 0), 0);

    const test = await this.db.$transaction(async (tx) => {
      const created = await tx.testQuiz.create({
        data: {
          instituteId: user.instituteId,
          batchId: data.batchId,
          teacherId: user.id,
          title: data.title,
          subject: data.subject,
          durationMinutes: data.durationMinutes || 45,
          totalMarks: totalMarks || 30,
          scheduledDate,
          resultsReleased: false,
          status: 'PUBLISHED',
          questions: data.questions || [],
        },
      });

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        await tx.testQuestion.createMany({
          data: data.questions.map((q: any, idx: number) => ({
            testId: created.id,
            position: idx + 1,
            text: q.text || '',
            type: q.type || 'MCQ',
            options: q.options || [],
            correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : null,
            marks: q.marks || 1,
            negativeMarks: q.negativeMarks || 0,
          })),
        });
      }

      return created;
    });

    return {
      ...test,
      batchName: batch.name,
      questions: data.questions,
      totalMarks: totalMarks || 30,
      attemptCount: 0,
      averageScore: 0,
    };
  }

  async toggleTestResults(testId: string, user: AuthenticatedUser) {
    const test = await this.db.testQuiz.findFirst({
      where: {
        id: testId,
        instituteId: user.instituteId,
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    await this.access.assertBatchAccess(user, test.batchId);

    const updated = await this.db.testQuiz.update({
      where: { id: testId },
      data: { resultsReleased: !test.resultsReleased },
    });

    return { success: true, resultsReleased: updated.resultsReleased };
  }

  // -------------------------------------------------------------
  // 7. LESSON PLANS & SYLLABUS TOPICS
  // -------------------------------------------------------------
  async getLessonPlans(user: AuthenticatedUser) {
    const staffBatchIds = await this.access.staffBatchIds(user);
    const where = {
      instituteId: user.instituteId,
      ...(staffBatchIds !== null ? { batchId: { in: staffBatchIds } } : {}),
    };

    const plans = await this.db.lessonPlan.findMany({
      where,
      include: {
        batch: { select: { name: true } },
      },
      orderBy: { weekNumber: 'asc' },
    });

    return plans.map((p) => ({
      ...p,
      batchName: p.batch.name,
    }));
  }

  async createLessonPlan(
    data: {
      batchId: string;
      title: string;
      topic: string;
      subject: string;
      weekNumber: number;
      content: string;
    },
    user: AuthenticatedUser,
  ) {
    const batch = await this.access.assertBatchAccess(user, data.batchId);

    const plan = await this.db.lessonPlan.create({
      data: {
        instituteId: user.instituteId,
        batchId: data.batchId,
        teacherId: user.id,
        title: data.title,
        topic: data.topic,
        subject: data.subject,
        weekNumber: data.weekNumber || 1,
        content: data.content,
        resources: [],
        isCompleted: false,
      },
    });

    return {
      ...plan,
      batchName: batch.name,
    };
  }

  async toggleLessonPlanStatus(planId: string, user: AuthenticatedUser) {
    const plan = await this.db.lessonPlan.findFirst({
      where: {
        id: planId,
        instituteId: user.instituteId,
      },
    });

    if (!plan) {
      throw new NotFoundException('Lesson plan not found.');
    }

    await this.access.assertBatchAccess(user, plan.batchId);

    const updated = await this.db.lessonPlan.update({
      where: { id: planId },
      data: { isCompleted: !plan.isCompleted },
    });

    return { success: true, isCompleted: updated.isCompleted };
  }

  // -------------------------------------------------------------
  // 10. TEACHER ANALYTICS & REPORTS
  // -------------------------------------------------------------
  async getReports(user: AuthenticatedUser) {
    const staffBatchIds = await this.access.staffBatchIds(user);
    const batches = await this.db.batch.findMany({
      where: {
        instituteId: user.instituteId,
        isActive: true,
        ...(staffBatchIds !== null ? { id: { in: staffBatchIds } } : {}),
      },
      select: { id: true, name: true, code: true, _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } } },
      take: 300,
    });
    const batchIds = batches.map((b) => b.id);
    const totalStudents = batches.reduce((sum, b) => sum + b._count.enrollments, 0);
    const since = new Date(Date.now() - 28 * 86_400_000);

    const [assignments, testCount, sessions, subStatus] = await Promise.all([
      this.db.assignment.findMany({
        where: { instituteId: user.instituteId, batchId: { in: batchIds } },
        select: { id: true, batchId: true },
        take: 1000,
      }),
      this.db.testQuiz.count({ where: { instituteId: user.instituteId, batchId: { in: batchIds } } }),
      this.db.attendanceSession.findMany({
        where: { instituteId: user.instituteId, batchId: { in: batchIds }, date: { gte: toDateOnly(since) } },
        select: { id: true, batchId: true, date: true },
        take: 3000,
      }),
      this.db.assignmentSubmission.groupBy({
        by: ['status'],
        where: { assignment: { instituteId: user.instituteId, batchId: { in: batchIds } } },
        _count: { _all: true },
      }),
    ]);

    const marks = sessions.length
      ? await this.db.attendanceRecord.groupBy({
          by: ['sessionId', 'status'],
          where: { sessionId: { in: sessions.map((x) => x.id) } },
          _count: { _all: true },
        })
      : [];
    const sessionMeta = new Map(sessions.map((x) => [x.id, x]));
    const week = [0, 1, 2, 3].map(() => ({ ok: 0, total: 0 }));
    const perBatch = new Map<string, { ok: number; total: number }>();
    for (const m of marks) {
      const sess = sessionMeta.get(m.sessionId);
      if (!sess) continue;
      const n = m._count._all;
      const ok = m.status === 'PRESENT' || m.status === 'LATE' ? n : 0;
      const w = Math.min(3, Math.floor((Date.now() - sess.date.getTime()) / (7 * 86_400_000)));
      week[3 - w]!.ok += ok;
      week[3 - w]!.total += n;
      const b = perBatch.get(sess.batchId) ?? { ok: 0, total: 0 };
      b.ok += ok;
      b.total += n;
      perBatch.set(sess.batchId, b);
    }
    const pct = (a: { ok: number; total: number }) => (a.total ? Math.round((a.ok / a.total) * 1000) / 10 : null);

    const statusCount = (st: string) => subStatus.find((x) => x.status === st)?._count._all ?? 0;
    const submitted = subStatus.reduce((sum, x) => sum + x._count._all, 0);

    const subsByAssignment = assignments.length
      ? await this.db.assignmentSubmission.groupBy({
          by: ['assignmentId'],
          where: { assignmentId: { in: assignments.map((a) => a.id) } },
          _count: { _all: true },
        })
      : [];
    const subCount = new Map(subsByAssignment.map((x) => [x.assignmentId, x._count._all]));

    const allAtt = week.reduce((acc, w) => ({ ok: acc.ok + w.ok, total: acc.total + w.total }), { ok: 0, total: 0 });
    return {
      attendanceTrends: week.map((w, i) => ({ label: `Week ${i + 1}`, rate: pct(w) })),
      submissionMetrics: {
        totalAssigned: assignments.length,
        submittedCount: submitted,
        gradedCount: statusCount('GRADED'),
        pendingReviewCount: statusCount('SUBMITTED') + statusCount('LATE'),
      },
      batchPerformance: batches.map((b) => {
        const own = assignments.filter((a) => a.batchId === b.id);
        const expected = own.length * b._count.enrollments;
        const got = own.reduce((sum, a) => sum + (subCount.get(a.id) ?? 0), 0);
        const att = perBatch.get(b.id);
        return {
          batchName: b.name,
          code: b.code,
          studentCount: b._count.enrollments,
          averageAttendance: att ? pct(att) : null,
          assignmentTurnaround: expected ? `${Math.round((got / expected) * 100)}%` : null,
        };
      }),
      summary: {
        totalBatches: batches.length,
        totalStudents,
        averageClassAttendance: allAtt.total ? `${pct(allAtt)}%` : null,
        totalTestsConducted: testCount,
      },
    };
  }

  // -------------------------------------------------------------
  // 11. ACADEMIC QUERIES & REPLIES
  // -------------------------------------------------------------
  async getQueries(
    user: AuthenticatedUser,
    filters?: { status?: string; batchId?: string },
  ) {
    const staffBatchIds = await this.access.staffBatchIds(user);
    if (filters?.batchId) {
      await this.access.assertBatchAccess(user, filters.batchId);
    }

    const where: any = {
      instituteId: user.instituteId,
    };

    if (filters?.batchId) {
      where.batchId = filters.batchId;
    } else if (staffBatchIds !== null) {
      where.OR = [
        { facultyId: user.id },
        { batchId: { in: staffBatchIds } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.db.academicQuery.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        batch: { select: { id: true, name: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async replyToQuery(
    queryId: string,
    body: string,
    user: AuthenticatedUser,
  ) {
    if (!body || typeof body !== 'string' || body.trim().length < 2) {
      throw new BadRequestException('Reply body must be at least 2 characters.');
    }

    const query = await this.db.academicQuery.findFirst({
      where: {
        id: queryId,
        instituteId: user.instituteId,
      },
    });

    if (!query) {
      throw new NotFoundException('Academic query not found.');
    }

    if (query.batchId) {
      await this.access.assertBatchAccess(user, query.batchId);
    }

    const reply = await this.db.$transaction(async (tx) => {
      const createdReply = await tx.academicQueryReply.create({
        data: {
          queryId,
          authorId: user.id,
          body: body.trim(),
        },
      });

      await tx.academicQuery.update({
        where: { id: queryId },
        data: { status: 'ANSWERED' },
      });

      return createdReply;
    });

    return { success: true, reply };
  }
}
