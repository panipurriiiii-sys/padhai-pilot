import {
  Injectable,
  Inject,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RedisKeys, RedisTTLs } from '../redis/redis.config.js';
import { AccessService } from '../common/access/access.service.js';
import { assertDb } from '../common/db/db.js';
import type { AuthenticatedUser } from '../common/types.js';
import type {
  StudentAnalyticsSummary,
  TeacherAnalyticsSummary,
  PlatformAdminAnalyticsSummary,
  StudentAttendanceDay,
  SubjectPerformanceItem,
  ExamScoreTrendPoint,
  HomeworkCompletionSummary,
  BatchAttendanceTrend,
  GradeDistributionBucket,
  SubjectComparisonItem,
  AssignmentSubmissionStat,
  SyllabusCoverageItem,
} from '@padhai-pilot/shared';

/**
 * Hard bounds so one large institute can never turn a chart endpoint into an unbounded scan.
 * Every chart in the portals renders aggregates, so these caps are invisible in the UI.
 */
const MAX_BATCHES = 300;
const ATTENDANCE_SESSIONS_PER_BATCH = 30;
const MAX_ASSESSMENTS = 500;
const MAX_STUDENT_ATTENDANCE_RECORDS = 200;
const MAX_STUDENT_MARKS = 200;

/** Redis is optional (it falls back to an in-process cache), so analytics must work without it. */
const NO_REDIS = {
  get: async () => null,
  set: async () => undefined,
} as unknown as RedisService;

@Injectable()
export class AnalyticsService {
  private readonly access: AccessService;
  private readonly redis: RedisService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(AccessService) access?: AccessService,
    @Optional() @Inject(RedisService) redis?: RedisService,
  ) {
    this.access = access ?? new AccessService(prisma);
    this.redis = redis ?? NO_REDIS;
  }

  private get db(): PrismaService {
    assertDb(this.prisma);
    return this.prisma;
  }

  // --------------------------------------------------------------------------
  // 1. STUDENT ANALYTICS
  // --------------------------------------------------------------------------
  async getStudentAnalytics(user: AuthenticatedUser): Promise<StudentAnalyticsSummary> {
    const studentId = user.id;
    const instituteId = user.instituteId;

    if (instituteId) {
      const cached = await this.redis.get<StudentAnalyticsSummary>(
        RedisKeys.studentAnalytics(instituteId, studentId),
      );
      if (cached) return cached;
    }

    if (!instituteId) {
      return {
        studentId,
        attendanceRate: null,
        attendanceTrend: [],
        subjectPerformance: [],
        examScoreTrend: [],
        homeworkSummary: {
          totalAssigned: 0,
          submitted: 0,
          graded: 0,
          pending: 0,
          completionRatePercentage: null,
        },
      };
    }

    // The four blocks below are independent, so they go out together instead of in series.
    const [records, marks, enrolledBatchIds] = await Promise.all([
      // Attendance
      this.db.attendanceRecord.findMany({
        where: {
          studentId,
          session: { instituteId },
        },
        select: {
          status: true,
          session: {
            select: {
              date: true,
              batch: { select: { subject: true } },
            },
          },
        },
        orderBy: { session: { date: 'asc' } },
        take: MAX_STUDENT_ATTENDANCE_RECORDS,
      }),

      // Assessments & subject performance. Only the assessment columns this method reads are
      // selected, and the row count is bounded.
      this.db.assessmentMark.findMany({
        where: {
          studentId,
          isPublished: true,
          assessment: {
            instituteId,
            status: 'PUBLISHED',
          },
        },
        select: {
          assessmentId: true,
          obtainedMarks: true,
          percentage: true,
          assessment: {
            select: { title: true, subject: true, maxMarks: true, assessmentDate: true },
          },
        },
        orderBy: {
          assessment: { assessmentDate: 'asc' },
        },
        take: MAX_STUDENT_MARKS,
      }),

      this.access.studentBatchIds(user),
    ]);

    const presentCount = records.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE',
    ).length;
    const attendanceRate = records.length > 0
      ? Math.round((presentCount / records.length) * 100)
      : null;

    const attendanceTrend: StudentAttendanceDay[] = records.slice(-14).map((r) => ({
      date: r.session.date.toISOString().split('T')[0],
      status: r.status as any,
      subject: r.session.batch.subject,
    }));

    const subjectStatsMap = new Map<string, { totalObtained: number; totalMax: number; count: number }>();
    for (const m of marks) {
      const subject = m.assessment.subject;
      const current = subjectStatsMap.get(subject) || { totalObtained: 0, totalMax: 0, count: 0 };
      if (m.obtainedMarks !== null) {
        current.totalObtained += m.obtainedMarks;
        current.totalMax += m.assessment.maxMarks;
        current.count += 1;
        subjectStatsMap.set(subject, current);
      }
    }

    const subjectPerformance: SubjectPerformanceItem[] = Array.from(subjectStatsMap.entries()).map(
      ([subject, stat]) => {
        const pct = stat.totalMax > 0 ? Math.round((stat.totalObtained / stat.totalMax) * 100) : 0;
        let grade = 'F';
        if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B+';
        else if (pct >= 60) grade = 'B';
        else if (pct >= 50) grade = 'C';
        else if (pct >= 40) grade = 'D';

        return {
          subject,
          marksObtained: stat.totalObtained,
          maxMarks: stat.totalMax,
          percentage: pct,
          grade,
          assessmentsCount: stat.count,
        };
      },
    );

    // Class average is an aggregate over published scores only (no other student's row is exposed).
    const classAverages = marks.length
      ? await this.db.assessmentMark.groupBy({
          by: ['assessmentId'],
          where: {
            assessmentId: { in: [...new Set(marks.map((m) => m.assessmentId))] },
            isPublished: true,
            resultStatus: 'SCORED',
          },
          _avg: { percentage: true },
        })
      : [];
    const classAvgByAssessment = new Map(
      classAverages.map((c) => [c.assessmentId, c._avg.percentage === null ? null : Math.round(c._avg.percentage)]),
    );
    const examScoreTrend: ExamScoreTrendPoint[] = marks.map((m) => ({
      assessmentId: m.assessmentId,
      title: m.assessment.title,
      date: m.assessment.assessmentDate.toISOString().split('T')[0],
      percentage: m.percentage || 0,
      classAveragePercentage: classAvgByAssessment.get(m.assessmentId) ?? null,
    }));

    // Homework Summary — the per-status breakdown is counted in PostgreSQL.
    const [totalAssigned, submissionGroups] = await Promise.all([
      this.db.assignment.count({
        where: {
          instituteId,
          batchId: { in: enrolledBatchIds },
        },
      }),
      this.db.assignmentSubmission.groupBy({
        by: ['status'],
        where: {
          studentId,
          assignment: { instituteId },
        },
        _count: { _all: true },
      }),
    ]);

    const countOf = (status: string) =>
      submissionGroups.find((s) => s.status === status)?._count._all ?? 0;
    const submitted = submissionGroups.reduce((sum, s) => sum + s._count._all, 0);
    const graded = countOf('GRADED');
    const pending = countOf('SUBMITTED');
    const completionRatePercentage = totalAssigned > 0
      ? Math.round((submitted / totalAssigned) * 100)
      : null;

    const homeworkSummary: HomeworkCompletionSummary = {
      totalAssigned,
      submitted,
      graded,
      pending,
      completionRatePercentage,
    };

    const summary: StudentAnalyticsSummary = {
      studentId,
      attendanceRate,
      attendanceTrend,
      subjectPerformance,
      examScoreTrend,
      homeworkSummary,
    };

    await this.redis.set(
      RedisKeys.studentAnalytics(instituteId, studentId),
      summary,
      RedisTTLs.ANALYTICS_SECONDS,
    );
    return summary;
  }

  /**
   * Present/total attendance per batch over each batch's newest
   * ATTENDANCE_SESSIONS_PER_BATCH sessions, computed entirely in PostgreSQL.
   *
   * Prisma's `groupBy` cannot group a child table by a parent column, so doing this through the
   * client meant fetching the sessions, then one row per (session x status) — thousands of rows
   * for a mid-sized institute — and folding them in Node. This returns one row per batch.
   * Values are parameterised; `batchIds` is already tenant-scoped by the caller and the
   * instituteId filter is repeated here so the query is safe on its own.
   */
  private async batchAttendanceTotals(
    instituteId: string,
    batchIds: string[],
  ): Promise<{ batchId: string; present: number; total: number; sessions: number }[]> {
    if (batchIds.length === 0) return [];
    const rows = await this.db.$queryRaw<
      { batchId: string; present: bigint; total: bigint; sessions: bigint }[]
    >`
      SELECT s."batchId"                                               AS "batchId",
             COUNT(r.id)                                               AS "total",
             COUNT(r.id) FILTER (WHERE r.status IN ('PRESENT','LATE')) AS "present",
             COUNT(DISTINCT s.id)                                      AS "sessions"
      FROM (
        SELECT id, "batchId"
        FROM (
          SELECT id, "batchId",
                 ROW_NUMBER() OVER (PARTITION BY "batchId" ORDER BY date DESC) AS rn
          FROM "AttendanceSession"
          WHERE "instituteId" = ${instituteId}
            AND "batchId" IN (${Prisma.join(batchIds)})
        ) ranked
        WHERE rn <= ${ATTENDANCE_SESSIONS_PER_BATCH}
      ) s
      LEFT JOIN "AttendanceRecord" r ON r."sessionId" = s.id
      GROUP BY s."batchId"
    `;
    return rows.map((r) => ({
      batchId: r.batchId,
      present: Number(r.present),
      total: Number(r.total),
      sessions: Number(r.sessions),
    }));
  }

  // --------------------------------------------------------------------------
  // 2. TEACHER / FACULTY ANALYTICS
  // --------------------------------------------------------------------------
  async getTeacherAnalytics(user: AuthenticatedUser): Promise<TeacherAnalyticsSummary> {
    const cached = await this.redis.get<TeacherAnalyticsSummary>(
      RedisKeys.teacherAnalytics(user.instituteId, user.id),
    );
    if (cached) return cached;

    const instituteId = user.instituteId;
    const staffBatchIds = await this.access.staffBatchIds(user);

    const batchWhere: any = {
      instituteId,
      isActive: true,
    };
    if (staffBatchIds !== null) {
      batchWhere.id = { in: staffBatchIds };
    }

    const batches = await this.db.batch.findMany({
      where: batchWhere,
      select: { id: true, name: true, subject: true },
      take: MAX_BATCHES,
    });
    const batchIds = batches.map((b) => b.id);
    const batchById = new Map(batches.map((b) => [b.id, b]));

    // Everything below is independent of everything else, so it goes out in one round of queries
    // instead of five sequential ones. Each block is an aggregate: no per-batch loop, and no
    // "load every row to count it".
    const [
      attendanceRows,
      gradeGroups,
      assessmentRows,
      enrollmentCounts,
      recentAssignments,
      lessonGroups,
    ] = await Promise.all([
      // (1) Attendance per batch over its newest N sessions, aggregated by PostgreSQL.
      // Was one query per batch, each loading every attendance record of those sessions.
      this.batchAttendanceTotals(instituteId, batchIds),

      // (2) Grade distribution: counted in PostgreSQL (was every mark row shipped to Node).
      batchIds.length && typeof this.db.assessmentMark?.groupBy === 'function'
        ? this.db.assessmentMark.groupBy({
            by: ['grade'],
            where: {
              assessment: { instituteId, batchId: { in: batchIds } },
              resultStatus: 'SCORED',
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),

      // (3) Subject comparison: assessment ids + subject only; marks are summed below.
      batchIds.length
        ? this.db.classroomAssessment.findMany({
            where: { instituteId, batchId: { in: batchIds } },
            select: { id: true, subject: true, batchId: true },
            orderBy: { assessmentDate: 'desc' },
            take: MAX_ASSESSMENTS,
          })
        : Promise.resolve([]),

      // Active head count per batch, once, instead of a nested _count on every assessment row.
      batchIds.length && typeof this.db.enrollment?.groupBy === 'function'
        ? this.db.enrollment.groupBy({
            by: ['batchId'],
            where: { instituteId, batchId: { in: batchIds }, status: 'ACTIVE' },
            _count: { _all: true },
          })
        : Promise.resolve([]),

      // (4) Assignment submissions — already bounded, kept as-is apart from the head count.
      batchIds.length
        ? this.db.assignment.findMany({
            where: { instituteId, batchId: { in: batchIds } },
            select: {
              id: true,
              title: true,
              dueDate: true,
              batchId: true,
              _count: { select: { submissions: true } },
            },
            orderBy: { dueDate: 'desc' },
            take: 10,
          })
        : Promise.resolve([]),

      // (5) Syllabus coverage: counted in PostgreSQL (was every lesson plan row, body included).
      batchIds.length && typeof this.db.lessonPlan?.groupBy === 'function'
        ? this.db.lessonPlan.groupBy({
            by: ['batchId', 'subject', 'isCompleted'],
            where: { instituteId, batchId: { in: batchIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const headCount = new Map(enrollmentCounts.map((e) => [e.batchId, e._count._all]));

    // (1) Attendance trends
    const attByBatch = new Map(attendanceRows.map((r) => [r.batchId, r]));
    const batchAttendanceTrends: BatchAttendanceTrend[] = batches.map((b) => {
      const acc = attByBatch.get(b.id);
      return {
        batchId: b.id,
        batchName: b.name,
        averageAttendancePercentage:
          acc && acc.total > 0 ? Math.round((acc.present / acc.total) * 100) : null,
        sessionsCount: acc?.sessions ?? 0,
      };
    });

    // (2) Grade distribution
    const gradeCounts: Record<string, number> = { 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0 };
    let totalGraded = 0;
    for (const g of gradeGroups) {
      totalGraded += g._count._all;
      if (g.grade && gradeCounts[g.grade] !== undefined) gradeCounts[g.grade] += g._count._all;
    }
    const gradeDistribution: GradeDistributionBucket[] = Object.entries(gradeCounts).map(
      ([grade, count]) => ({
        grade,
        studentCount: count,
        percentage: totalGraded > 0 ? Math.round((count / totalGraded) * 100) : 0,
      }),
    );

    // (3) Subject comparison — sum and count the marks in PostgreSQL, average per subject here.
    // Same arithmetic as before (mean over every scored mark of the subject), one query instead
    // of loading every mark of every assessment.
    const markStats = assessmentRows.length
      ? await this.db.assessmentMark.groupBy({
          by: ['assessmentId'],
          where: {
            assessmentId: { in: assessmentRows.map((a) => a.id) },
            resultStatus: 'SCORED',
            percentage: { not: null },
          },
          _sum: { percentage: true },
          _count: { percentage: true },
        })
      : [];
    const markByAssessment = new Map(
      markStats.map((m) => [m.assessmentId, { sum: m._sum.percentage ?? 0, count: m._count.percentage }]),
    );

    const subjectMap = new Map<
      string,
      { totalPct: number; count: number; totalStudents: number; asmCount: number }
    >();
    for (const asm of assessmentRows) {
      const current =
        subjectMap.get(asm.subject) || { totalPct: 0, count: 0, totalStudents: 0, asmCount: 0 };
      current.asmCount += 1;
      current.totalStudents = Math.max(current.totalStudents, headCount.get(asm.batchId) ?? 0);
      const stat = markByAssessment.get(asm.id);
      if (stat) {
        current.totalPct += stat.sum;
        current.count += stat.count;
      }
      subjectMap.set(asm.subject, current);
    }

    const subjectComparison: SubjectComparisonItem[] = Array.from(subjectMap.entries()).map(
      ([subject, stat]) => ({
        subject,
        averageScorePercentage: stat.count > 0 ? Math.round(stat.totalPct / stat.count) : null,
        totalStudents: stat.totalStudents,
        assessmentCount: stat.asmCount,
      }),
    );

    // (4) Assignment submissions
    const assignmentSubmissions: AssignmentSubmissionStat[] = recentAssignments.map((a) => {
      const totalStudents = headCount.get(a.batchId) ?? 0;
      const submittedCount = a._count.submissions;
      return {
        assignmentId: a.id,
        title: a.title,
        dueDate: a.dueDate.toISOString().split('T')[0],
        totalStudents,
        submittedCount,
        submissionRatePercentage:
          totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0,
      };
    });

    // (5) Syllabus coverage
    const coverageMap = new Map<
      string,
      { batchId: string; batchName: string; subject: string; total: number; completed: number }
    >();
    for (const g of lessonGroups) {
      const key = `${g.batchId}:${g.subject}`;
      const current =
        coverageMap.get(key) || {
          batchId: g.batchId,
          batchName: batchById.get(g.batchId)?.name ?? '',
          subject: g.subject,
          total: 0,
          completed: 0,
        };
      current.total += g._count._all;
      if (g.isCompleted) current.completed += g._count._all;
      coverageMap.set(key, current);
    }

    const syllabusCoverage: SyllabusCoverageItem[] = Array.from(coverageMap.values()).map((stat) => ({
      batchId: stat.batchId,
      batchName: stat.batchName,
      subject: stat.subject,
      totalTopics: stat.total,
      completedTopics: stat.completed,
      coveragePercentage: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    }));

    const summary: TeacherAnalyticsSummary = {
      instituteId,
      teacherId: user.id,
      batchAttendanceTrends,
      gradeDistribution,
      subjectComparison,
      assignmentSubmissions,
      syllabusCoverage,
    };

    await this.redis.set(
      RedisKeys.teacherAnalytics(instituteId, user.id),
      summary,
      RedisTTLs.ANALYTICS_SECONDS,
    );
    return summary;
  }

  // --------------------------------------------------------------------------
  // 3. PLATFORM ADMIN ANALYTICS
  // --------------------------------------------------------------------------
  async getAdminAnalytics(): Promise<PlatformAdminAnalyticsSummary> {
    const [
      totalInstitutes,
      activeInstitutes,
      planGroups,
      totalStudents,
      totalTeachers,
      assessmentsCreated,
      attendanceRecorded,
      activeLoginsLast24h,
    ] = await Promise.all([
      this.db.institute.count(),
      this.db.institute.count({ where: { isActive: true } }),
      // Counted in PostgreSQL rather than shipping one row per institute to Node.
      this.db.institute.groupBy({ by: ['plan'], _count: { _all: true } }),
      this.db.user.count({ where: { role: 'STUDENT' } }),
      this.db.user.count({ where: { role: { in: ['TEACHER', 'FACULTY'] } } }),
      this.db.classroomAssessment.count(),
      this.db.attendanceRecord.count(),
      this.db.user.count({
        where: {
          updatedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
        },
      }),
    ]);

    const institutesByPlan: Record<string, number> = {};
    planGroups.forEach((g) => {
      const plan = g.plan || 'STARTER';
      institutesByPlan[plan] = (institutesByPlan[plan] || 0) + g._count._all;
    });

    return {
      totalInstitutes,
      activeInstitutes,
      institutesByPlan,
      totalStudents,
      totalTeachers,
      recentActivityCounts: {
        assessmentsCreated,
        attendanceRecorded,
        activeLoginsLast24h,
      },
    };
  }
}
