import {
  Injectable,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
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

@Injectable()
export class AnalyticsService {
  private readonly access: AccessService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(AccessService) access?: AccessService,
  ) {
    this.access = access ?? new AccessService(prisma);
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

    // Attendance
    const records = await this.db.attendanceRecord.findMany({
      where: {
        studentId,
        session: { instituteId },
      },
      include: {
        session: {
          select: {
            date: true,
            batch: { select: { subject: true } },
          },
        },
      },
      orderBy: { session: { date: 'asc' } },
      take: 100,
    });

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

    // Assessments & Subject Performance
    const marks = await this.db.assessmentMark.findMany({
      where: {
        studentId,
        isPublished: true,
        assessment: {
          instituteId,
          status: 'PUBLISHED',
        },
      },
      include: {
        assessment: true,
      },
      orderBy: {
        assessment: { assessmentDate: 'asc' },
      },
    });

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

    // Homework Summary
    const enrolledBatchIds = await this.access.studentBatchIds(user);
    const [totalAssigned, submissions] = await Promise.all([
      this.db.assignment.count({
        where: {
          instituteId,
          batchId: { in: enrolledBatchIds },
        },
      }),
      this.db.assignmentSubmission.findMany({
        where: {
          studentId,
          assignment: { instituteId },
        },
        select: { status: true },
      }),
    ]);

    const submitted = submissions.length;
    const graded = submissions.filter((s) => s.status === 'GRADED').length;
    const pending = submissions.filter((s) => s.status === 'SUBMITTED').length;
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

    return {
      studentId,
      attendanceRate,
      attendanceTrend,
      subjectPerformance,
      examScoreTrend,
      homeworkSummary,
    };
  }

  // --------------------------------------------------------------------------
  // 2. TEACHER / FACULTY ANALYTICS
  // --------------------------------------------------------------------------
  async getTeacherAnalytics(user: AuthenticatedUser): Promise<TeacherAnalyticsSummary> {
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
    });
    const batchIds = batches.map((b) => b.id);

    // 1. Batch Attendance Trends
    const batchAttendanceTrends: BatchAttendanceTrend[] = await Promise.all(
      batches.map(async (b) => {
        const sessions = await this.db.attendanceSession.findMany({
          where: { batchId: b.id },
          include: { records: { select: { status: true } } },
          take: 30,
        });

        let totalRecords = 0;
        let presentRecords = 0;
        sessions.forEach((s) => {
          s.records.forEach((r) => {
            totalRecords++;
            if (r.status === 'PRESENT' || r.status === 'LATE') presentRecords++;
          });
        });

        const averageAttendancePercentage = totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : null;

        return {
          batchId: b.id,
          batchName: b.name,
          averageAttendancePercentage,
          sessionsCount: sessions.length,
        };
      }),
    );

    // 2. Grade Distribution
    const marks = await this.db.assessmentMark.findMany({
      where: {
        assessment: {
          instituteId,
          batchId: { in: batchIds },
        },
        resultStatus: 'SCORED',
      },
      select: { grade: true },
    });

    const gradeCounts: Record<string, number> = { 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0 };
    marks.forEach((m) => {
      if (m.grade && gradeCounts[m.grade] !== undefined) {
        gradeCounts[m.grade]++;
      }
    });

    const totalGraded = marks.length;
    const gradeDistribution: GradeDistributionBucket[] = Object.entries(gradeCounts).map(
      ([grade, count]) => ({
        grade,
        studentCount: count,
        percentage: totalGraded > 0 ? Math.round((count / totalGraded) * 100) : 0,
      }),
    );

    // 3. Subject Comparison
    const assessments = await this.db.classroomAssessment.findMany({
      where: {
        instituteId,
        batchId: { in: batchIds },
      },
      include: {
        marks: {
          where: { resultStatus: 'SCORED' },
          select: { percentage: true },
        },
        batch: {
          include: {
            _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
    });

    const subjectMap = new Map<string, { totalPct: number; count: number; totalStudents: number; asmCount: number }>();
    assessments.forEach((asm) => {
      const current = subjectMap.get(asm.subject) || { totalPct: 0, count: 0, totalStudents: 0, asmCount: 0 };
      current.asmCount++;
      current.totalStudents = Math.max(current.totalStudents, asm.batch?._count?.enrollments || 0);
      asm.marks.forEach((m) => {
        if (m.percentage !== null) {
          current.totalPct += m.percentage;
          current.count++;
        }
      });
      subjectMap.set(asm.subject, current);
    });

    const subjectComparison: SubjectComparisonItem[] = Array.from(subjectMap.entries()).map(
      ([subject, stat]) => ({
        subject,
        averageScorePercentage: stat.count > 0 ? Math.round(stat.totalPct / stat.count) : null,
        totalStudents: stat.totalStudents,
        assessmentCount: stat.asmCount,
      }),
    );

    // 4. Assignment Submissions
    const recentAssignments = await this.db.assignment.findMany({
      where: {
        instituteId,
        batchId: { in: batchIds },
      },
      include: {
        batch: {
          include: {
            _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
          },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'desc' },
      take: 10,
    });

    const assignmentSubmissions: AssignmentSubmissionStat[] = recentAssignments.map((a) => {
      const totalStudents = a.batch?._count?.enrollments ?? 0;
      const submittedCount = a._count.submissions;
      return {
        assignmentId: a.id,
        title: a.title,
        dueDate: a.dueDate.toISOString().split('T')[0],
        totalStudents,
        submittedCount,
        submissionRatePercentage: totalStudents > 0
          ? Math.round((submittedCount / totalStudents) * 100)
          : 0,
      };
    });

    // 5. Syllabus Coverage
    const lessonPlans = await this.db.lessonPlan.findMany({
      where: {
        instituteId,
        batchId: { in: batchIds },
      },
      include: {
        batch: { select: { name: true } },
      },
    });

    const coverageMap = new Map<string, { batchName: string; subject: string; total: number; completed: number }>();
    lessonPlans.forEach((lp) => {
      const key = `${lp.batchId}:${lp.subject}`;
      const current = coverageMap.get(key) || {
        batchName: lp.batch.name,
        subject: lp.subject,
        total: 0,
        completed: 0,
      };
      current.total++;
      if (lp.isCompleted) current.completed++;
      coverageMap.set(key, current);
    });

    const syllabusCoverage: SyllabusCoverageItem[] = Array.from(coverageMap.entries()).map(
      ([key, stat]) => {
        const batchId = key.split(':')[0];
        return {
          batchId,
          batchName: stat.batchName,
          subject: stat.subject,
          totalTopics: stat.total,
          completedTopics: stat.completed,
          coveragePercentage: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
        };
      },
    );

    return {
      instituteId,
      teacherId: user.id,
      batchAttendanceTrends,
      gradeDistribution,
      subjectComparison,
      assignmentSubmissions,
      syllabusCoverage,
    };
  }

  // --------------------------------------------------------------------------
  // 3. PLATFORM ADMIN ANALYTICS
  // --------------------------------------------------------------------------
  async getAdminAnalytics(): Promise<PlatformAdminAnalyticsSummary> {
    const [
      totalInstitutes,
      activeInstitutes,
      institutes,
      totalStudents,
      totalTeachers,
      assessmentsCreated,
      attendanceRecorded,
      activeLoginsLast24h,
    ] = await Promise.all([
      this.db.institute.count(),
      this.db.institute.count({ where: { isActive: true } }),
      this.db.institute.findMany({ select: { plan: true } }),
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
    institutes.forEach((i) => {
      const plan = i.plan || 'STARTER';
      institutesByPlan[plan] = (institutesByPlan[plan] || 0) + 1;
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
