import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AccessService } from '../common/access/access.service.js';
import { AssessmentService } from '../assessment/assessment.service.js';
import type { AuthenticatedUser } from '../common/types.js';
import { signSession } from '../common/security/session.js';
import {
  clampLimit,
  isoDay,
  isUniqueViolation,
  optionalString,
  optionalUrl,
  parseDate,
  requireString,
  toDateOnly,
} from '../common/db/db.js';
import { randomBytes } from 'node:crypto';
import type {
  AttendanceCorrectionRequestDto,
  CreateAcademicQueryDto,
  CreateStudyTaskDto,
  UpdateStudyTaskDto,
  CreateSupportRequestDto,
  UpdateStudentProfileDto,
  SubmitAssignmentDto,
  TestAnswerItemDto,
} from './dto/student.dto.js';
import type {
  StudentAttendanceSummary,
  StudentFeeSummary,
  StudentAnnouncementItem,
  StudentTeachingDiaryItem,
  StudentAssignmentItem,
  StudentTestItem,
  AcademicQueryItem,
  PersonalStudyTaskItem,
  StudentDocumentItem,
  StudentTimetableDay,
  StudentJoinBatchResult,
} from '@padhai-pilot/shared';
export type {
  StudentAttendanceSummary,
  StudentFeeSummary,
  StudentAnnouncementItem,
  StudentTeachingDiaryItem,
  StudentAssignmentItem,
  StudentTestItem,
  AcademicQueryItem,
  PersonalStudyTaskItem,
  StudentDocumentItem,
} from '@padhai-pilot/shared';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_NOTIFICATION_PREFS = { email: true, sms: true, inApp: true, results: true, fees: true };
const SUPPORT_CATEGORIES = ['PROFILE_CORRECTION', 'ATTENDANCE_MISMATCH', 'PAYMENT_ISSUE', 'ACADEMIC_HELP', 'TECHNICAL_SUPPORT'];
const MAX_TEST_ANSWERS = 300;

function formatClock(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  if (!m) return hhmm || '';
  let h = parseInt(m[1], 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m[2]} ${suffix}`;
}

const titleCaseDay = (d: string): string => (d ? d.charAt(0).toUpperCase() + d.slice(1).toLowerCase() : d);

/**
 * Student-facing service. Every query is scoped by the authenticated student's id and the institute taken
 * from the verified JWT (never from client input), and batch-scoped data is limited to the student's own
 * ACTIVE enrolments. There is no in-memory/fabricated fallback: with no database the API answers 503.
 */
@Injectable()
export class StudentService {
  constructor(
    @Inject(AccessService) private readonly access: AccessService,
    @Inject(AssessmentService) private readonly assessmentService: AssessmentService,
  ) {}

  // ==========================================================================
  // 1. DASHBOARD
  // ==========================================================================
  async getDashboard(user: AuthenticatedUser) {
    const profile = await this.getStudentProfile(user);
    const [results, materials, attendance, announcements, fees, diaries, assignments, tests, timetable] = await Promise.all([
      this.assessmentService.getStudentPublishedResults(user),
      this.assessmentService.getStudentStudyMaterials(user),
      this.getAttendance(user),
      this.getAnnouncements(user),
      this.getFees(user),
      this.getTeachingDiaries(user, { limit: 2 }),
      this.getAssignments(user),
      this.getTests(user),
      this.getTimetable(user),
    ]);

    const scored = results.filter((r) => r.resultStatus === 'SCORED' && r.percentage !== null);
    const avgPercentage = scored.length
      ? Math.round(scored.reduce((acc, r) => acc + (r.percentage || 0), 0) / scored.length)
      : 0;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });

    return {
      student: {
        id: user.id,
        fullName: profile.fullName,
        email: profile.email,
        rollNumber: profile.rollNumber,
        instituteName: profile.instituteName,
        batchName: profile.batchName,
        academicYear: profile.academicYear,
      },
      stats: {
        totalTests: results.length,
        avgPercentage,
        attendanceRate: attendance.percentage,
        totalMaterials: materials.length,
        pendingAssignments: assignments.filter((a) => a.status === 'PENDING').length,
        feeBalance: fees.balanceDue,
        classesAttended: attendance.attended,
        totalClasses: attendance.totalClasses,
        upcomingTests: tests.filter((t) => t.status !== 'COMPLETED').length,
      },
      recentResults: results.slice(0, 3),
      recentMaterials: materials.slice(0, 3),
      recentDiaries: diaries.slice(0, 2),
      upcomingAssignments: assignments.slice(0, 3),
      announcements: announcements.slice(0, 2),
      timetable: timetable.find((d) => d.day === today)?.slots ?? [],
    };
  }

  // ==========================================================================
  // 2. INVITATION & BATCH ENROLLMENT
  // ==========================================================================
  async validateInvitation(code: string) {
    const db = this.access.db();
    const clean = requireString(code, 'Invitation code', 64).toUpperCase();
    const inv = await db.invitationCode.findUnique({
      where: { code: clean },
      select: {
        code: true,
        instituteId: true,
        batchId: true,
        expiresAt: true,
        isRevoked: true,
        usedCount: true,
        maxUses: true,
        institute: { select: { name: true, isActive: true } },
        batch: { select: { name: true, subject: true, gradeLevel: true, isActive: true } },
      },
    });
    if (!inv || inv.isRevoked || !inv.institute.isActive || (inv.batch && !inv.batch.isActive) || (inv.expiresAt && inv.expiresAt < new Date()) || inv.usedCount >= inv.maxUses) {
      throw new BadRequestException('This invitation code is invalid, expired, or has reached its usage limit.');
    }
    return {
      valid: true,
      code: inv.code,
      instituteId: inv.instituteId,
      instituteName: inv.institute.name,
      batchId: inv.batchId,
      batchName: inv.batch?.name || 'Classroom Batch',
      subject: inv.batch?.subject || 'All Subjects',
      gradeLevel: inv.batch?.gradeLevel || 'Standard Batch',
      expiresAt: inv.expiresAt ? inv.expiresAt.toISOString() : null,
    };
  }

  /**
   * Redeems a student invitation code. Idempotent: re-sending the same code for an enrolment that already
   * exists returns success without consuming another use. The use counter is claimed with a guarded
   * updateMany inside the transaction so concurrent redemptions cannot exceed maxUses.
   */
  async joinInstitute(user: AuthenticatedUser, code: string): Promise<StudentJoinBatchResult> {
    const db = this.access.db();
    const clean = requireString(code, 'Invitation code', 64).toUpperCase();
    const invalid = () => new BadRequestException('This invitation code is invalid, expired, or has reached its usage limit.');

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await db.$transaction(async (tx) => {
          const inv = await tx.invitationCode.findUnique({
            where: { code: clean },
            select: {
              id: true,
              instituteId: true,
              batchId: true,
              maxUses: true,
              institute: { select: { name: true, isActive: true } },
              batch: { select: { name: true, isActive: true } },
            },
          });
          if (!inv || !inv.institute.isActive || (inv.batch && !inv.batch.isActive)) throw invalid();

          // Staff of an institute can never be turned into (or mixed up with) a student of it.
          const membership = await tx.instituteMembership.findUnique({
            where: { instituteId_userId: { instituteId: inv.instituteId, userId: user.id } },
            select: { role: true, status: true },
          });
          if (membership && membership.role !== 'STUDENT') {
            throw new ForbiddenException('This account already holds a staff role in that institute.');
          }

          const existingEnrollment = inv.batchId
            ? await tx.enrollment.findUnique({
                where: { batchId_studentId: { batchId: inv.batchId, studentId: user.id } },
                select: { id: true, status: true },
              })
            : null;
          const alreadyEnrolled = !!membership && membership.status === 'ACTIVE' && (!inv.batchId || existingEnrollment?.status === 'ACTIVE');

          if (!alreadyEnrolled) {
            const claimed = await tx.invitationCode.updateMany({
              where: {
                id: inv.id,
                isRevoked: false,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                usedCount: { lt: inv.maxUses },
              },
              data: { usedCount: { increment: 1 } },
            });
            if (claimed.count !== 1) throw invalid();

            await tx.instituteMembership.upsert({
              where: { instituteId_userId: { instituteId: inv.instituteId, userId: user.id } },
              create: { instituteId: inv.instituteId, userId: user.id, role: 'STUDENT', status: 'ACTIVE' },
              update: { status: 'ACTIVE', revokedAt: null },
            });
            if (inv.batchId) {
              await tx.enrollment.upsert({
                where: { batchId_studentId: { batchId: inv.batchId, studentId: user.id } },
                create: {
                  instituteId: inv.instituteId,
                  batchId: inv.batchId,
                  studentId: user.id,
                  rollNumber: `STU-${randomBytes(3).toString('hex').toUpperCase()}`,
                  status: 'ACTIVE',
                },
                update: { status: 'ACTIVE' },
              });
            }
          }

          const u = await tx.user.findUnique({ where: { id: user.id }, select: { tokenVersion: true, avatarUrl: true } });
          const session: AuthenticatedUser = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: 'STUDENT',
            instituteId: inv.instituteId,
            instituteName: inv.institute.name,
            tv: u?.tokenVersion ?? 0,
            ...(u?.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
          };
          const batchName = inv.batch?.name || 'Classroom Batch';
          return {
            success: true,
            alreadyEnrolled,
            message: alreadyEnrolled
              ? `You are already enrolled in ${inv.institute.name} - ${batchName}.`
              : `Successfully enrolled in ${inv.institute.name} - ${batchName}!`,
            instituteName: inv.institute.name,
            batchName,
            token: signSession(session),
            user: {
              id: session.id,
              email: session.email,
              fullName: session.fullName,
              role: session.role,
              instituteId: session.instituteId,
              instituteName: session.instituteName,
            },
          };
        });
      } catch (err) {
        if (isUniqueViolation(err) && attempt < 2) continue; // roll-number collision: retry with a new number
        throw err;
      }
    }
    throw invalid();
  }

  // ==========================================================================
  // 3. STUDENT PROFILE
  // ==========================================================================
  async getStudentProfile(user: AuthenticatedUser) {
    const db = this.access.db();
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, createdAt: true, notificationPreferences: true },
    });
    if (!dbUser) throw new NotFoundException('Student profile not found.');

    const enrollment = user.instituteId
      ? await db.enrollment.findFirst({
          where: { studentId: user.id, instituteId: user.instituteId, status: 'ACTIVE' },
          orderBy: { joinedAt: 'asc' },
          select: {
            rollNumber: true,
            joinedAt: true,
            batchId: true,
            batch: { select: { name: true, subject: true } },
            institute: { select: { id: true, name: true, academicYear: true } },
          },
        })
      : null;
    const institute =
      enrollment?.institute ??
      (user.instituteId
        ? await db.institute.findUnique({ where: { id: user.instituteId }, select: { id: true, name: true, academicYear: true } })
        : null);

    const prefs = (dbUser.notificationPreferences ?? {}) as Partial<typeof DEFAULT_NOTIFICATION_PREFS>;
    return {
      id: dbUser.id,
      fullName: dbUser.fullName,
      email: dbUser.email,
      phone: dbUser.phone || '',
      avatarUrl: dbUser.avatarUrl || null,
      role: 'STUDENT',
      rollNumber: enrollment?.rollNumber || '',
      instituteId: institute?.id || user.instituteId || '',
      instituteName: institute?.name || '',
      batchId: enrollment?.batchId || '',
      batchName: enrollment?.batch.name || '',
      subject: enrollment?.batch.subject || '',
      academicYear: institute?.academicYear || '',
      joinedAt: (enrollment?.joinedAt ?? dbUser.createdAt).toISOString(),
      notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFS, ...prefs },
    };
  }

  async updateStudentProfile(user: AuthenticatedUser, dto: UpdateStudentProfileDto) {
    const db = this.access.db();
    const fullName = optionalString(dto?.fullName, 'Full name', 120);
    const phone = optionalString(dto?.phone, 'Phone', 32);
    const avatarUrl = optionalUrl(dto?.avatarUrl, 'Avatar URL');
    let prefs: Record<string, boolean> | undefined;
    if (dto?.notificationPreferences) {
      prefs = {};
      for (const k of Object.keys(DEFAULT_NOTIFICATION_PREFS)) {
        const v = (dto.notificationPreferences as unknown as Record<string, unknown>)[k];
        prefs[k] = typeof v === 'boolean' ? v : (DEFAULT_NOTIFICATION_PREFS as Record<string, boolean>)[k];
      }
    }
    await db.user.update({
      where: { id: user.id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(phone ? { phone } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(prefs ? { notificationPreferences: prefs } : {}),
      },
    });
    return { success: true, message: 'Profile updated successfully.' };
  }

  // ==========================================================================
  // 4. DAILY TEACHING DIARY (STUDENT VIEW)
  // ==========================================================================
  async getTeachingDiaries(
    user: AuthenticatedUser,
    query?: { subject?: string; search?: string; limit?: number | string },
  ): Promise<StudentTeachingDiaryItem[]> {
    const db = this.access.db();
    const batchIds = await this.access.studentBatchIds(user);
    if (batchIds.length === 0) return [];
    const subject = query?.subject && query.subject !== 'ALL' ? query.subject.slice(0, 120) : undefined;
    const search = query?.search?.trim().slice(0, 120);

    const diaries = await db.dailyTeachingDiary.findMany({
      where: {
        instituteId: user.instituteId,
        batchId: { in: batchIds },
        status: 'PUBLISHED',
        audience: 'BATCH',
        ...(subject ? { subject: { equals: subject, mode: 'insensitive' } } : {}),
        ...(search
          ? {
              OR: [
                { chapterTitle: { contains: search, mode: 'insensitive' } },
                { conceptsTaught: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        lessonDate: true,
        sessionTime: true,
        subject: true,
        chapterTitle: true,
        conceptsTaught: true,
        learningObjectives: true,
        homeworkAssigned: true,
        attachmentUrl: true,
        referenceLinks: true,
        createdAt: true,
        faculty: { select: { fullName: true } },
        batch: { select: { name: true } },
      },
      orderBy: { lessonDate: 'desc' },
      take: clampLimit(query?.limit, 50, 100),
    });

    return diaries.map((d) => ({
      id: d.id,
      lessonDate: isoDay(d.lessonDate),
      sessionTime: d.sessionTime || undefined,
      subject: d.subject,
      facultyName: d.faculty.fullName,
      batchName: d.batch.name,
      chapterTitle: d.chapterTitle,
      conceptsTaught: d.conceptsTaught,
      learningObjectives: d.learningObjectives || undefined,
      homeworkAssigned: d.homeworkAssigned || undefined,
      attachmentUrl: d.attachmentUrl || undefined,
      referenceLinks: d.referenceLinks || [],
      createdAt: d.createdAt.toISOString(),
    }));
  }

  // ==========================================================================
  // 5. TIMETABLE
  // ==========================================================================
  async getTimetable(user: AuthenticatedUser): Promise<StudentTimetableDay[]> {
    const db = this.access.db();
    const batchIds = await this.access.studentBatchIds(user);
    if (batchIds.length === 0) return [];
    const slots = await db.timetableSlot.findMany({
      where: { instituteId: user.instituteId, batchId: { in: batchIds } },
      select: {
        subject: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        room: true,
        teacher: { select: { fullName: true } },
        batch: { select: { room: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 200,
    });
    const byDay = new Map<string, StudentTimetableDay['slots']>();
    for (const s of slots) {
      const day = titleCaseDay(s.dayOfWeek);
      const list = byDay.get(day) ?? [];
      list.push({
        time: `${formatClock(s.startTime)} - ${formatClock(s.endTime)}`,
        subject: s.subject,
        topic: s.subject,
        room: s.room || s.batch.room || '',
        faculty: s.teacher.fullName,
      });
      byDay.set(day, list);
    }
    return DAYS.filter((d) => byDay.has(d)).map((day) => ({ day, slots: byDay.get(day)! }));
  }

  // ==========================================================================
  // 6. ATTENDANCE & CORRECTION REQUESTS
  // ==========================================================================
  async getAttendance(user: AuthenticatedUser): Promise<StudentAttendanceSummary> {
    const db = this.access.db();
    if (!user.instituteId) return { totalClasses: 0, attended: 0, absent: 0, late: 0, percentage: 0, records: [] };
    const where = { studentId: user.id, session: { instituteId: user.instituteId } };

    // Totals are aggregated in SQL over the whole history; only the latest 30 rows travel to the client.
    const [grouped, recent] = await Promise.all([
      db.attendanceRecord.groupBy({ by: ['status'], where, _count: { _all: true } }),
      db.attendanceRecord.findMany({
        where,
        select: {
          id: true,
          status: true,
          note: true,
          session: { select: { date: true, batch: { select: { subject: true } } } },
        },
        orderBy: { session: { date: 'desc' } },
        take: 30,
      }),
    ]);
    const count = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
    const present = count('PRESENT');
    const late = count('LATE');
    const absent = count('ABSENT');
    const total = grouped.reduce((n, g) => n + g._count._all, 0);
    return {
      totalClasses: total,
      attended: present,
      absent,
      late,
      percentage: total ? Math.round(((present + late * 0.5) / total) * 100) : 0,
      records: recent.map((r) => ({
        id: r.id,
        date: isoDay(r.session.date),
        status: r.status,
        subjectName: r.session.batch.subject,
        remarks: r.note || undefined,
      })),
    };
  }

  async submitAttendanceCorrection(user: AuthenticatedUser, dto: AttendanceCorrectionRequestDto) {
    const db = this.access.db();
    const reason = requireString(dto?.reason, 'Reason', 1000);
    if (reason.length < 5) throw new BadRequestException('Please explain the correction in at least 5 characters.');
    const date = toDateOnly(requireString(dto?.date, 'Session date', 40), 'Session date');
    const batchIds = await this.access.studentBatchIds(user);

    const session = await db.attendanceSession.findFirst({
      where: {
        instituteId: user.instituteId,
        batchId: { in: batchIds },
        date,
        ...(dto?.sessionId ? { id: dto.sessionId } : {}),
      },
      select: { id: true, batchId: true },
    });
    if (!session) throw new BadRequestException('No attendance was recorded for your batch on that date.');

    // Idempotent: one pending request per student per day.
    const existing = await db.attendanceCorrectionRequest.findFirst({
      where: { studentId: user.id, instituteId: user.instituteId, date, status: 'PENDING' },
      select: { id: true },
    });
    if (existing) {
      return { success: true, message: 'A correction request for that date is already awaiting review.', status: 'PENDING', id: existing.id };
    }
    const created = await db.attendanceCorrectionRequest.create({
      data: { instituteId: user.instituteId, studentId: user.id, batchId: session.batchId, sessionId: session.id, date, reason },
      select: { id: true },
    });
    return {
      success: true,
      message: 'Attendance correction request submitted to academic faculty for review.',
      status: 'PENDING',
      id: created.id,
    };
  }

  // ==========================================================================
  // 7. HOMEWORK & ASSIGNMENTS
  // ==========================================================================
  async getAssignments(user: AuthenticatedUser): Promise<StudentAssignmentItem[]> {
    const db = this.access.db();
    const batchIds = await this.access.studentBatchIds(user);
    if (batchIds.length === 0) return [];
    const assignments = await db.assignment.findMany({
      where: { instituteId: user.instituteId, batchId: { in: batchIds }, status: 'PUBLISHED' },
      select: { id: true, title: true, instructions: true, subject: true, dueDate: true, maxMarks: true, attachmentUrl: true },
      orderBy: { dueDate: 'desc' },
      take: 100,
    });
    if (assignments.length === 0) return [];
    const subs = await db.assignmentSubmission.findMany({
      where: { studentId: user.id, assignmentId: { in: assignments.map((a) => a.id) } },
      select: { assignmentId: true, submittedAt: true, content: true, attachmentUrl: true, status: true, marksObtained: true, feedback: true },
    });
    const subById = new Map(subs.map((s) => [s.assignmentId, s]));
    return assignments.map((a) => {
      const sub = subById.get(a.id);
      return {
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        subject: a.subject,
        dueDate: a.dueDate.toISOString(),
        maxMarks: a.maxMarks,
        attachmentUrl: a.attachmentUrl || undefined,
        status: sub ? sub.status : 'PENDING',
        ...(sub
          ? {
              submission: {
                submittedAt: sub.submittedAt.toISOString(),
                content: sub.content || undefined,
                attachmentUrl: sub.attachmentUrl || undefined,
                marksObtained: sub.marksObtained ?? undefined,
                feedback: sub.feedback || undefined,
              },
            }
          : {}),
      };
    });
  }

  async submitAssignment(user: AuthenticatedUser, assignmentId: string, dto: SubmitAssignmentDto) {
    const db = this.access.db();
    const content = optionalString(dto?.content, 'Content', 20000);
    const attachmentUrl = optionalUrl(dto?.attachmentUrl, 'Attachment URL');
    if (!content && !attachmentUrl) {
      throw new BadRequestException('Please provide written notes or upload an attachment document.');
    }
    const batchIds = await this.access.studentBatchIds(user);
    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, instituteId: user.instituteId, batchId: { in: batchIds }, status: 'PUBLISHED' },
      select: { id: true, dueDate: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found.');

    const isDraft = dto?.isDraft === true;
    const status = isDraft ? 'PENDING' : new Date() > assignment.dueDate ? 'LATE' : 'SUBMITTED';
    const data = { content: content ?? null, attachmentUrl: attachmentUrl ?? null, status, submittedAt: new Date() } as const;

    for (let attempt = 0; attempt < 2; attempt++) {
      const existing = await db.assignmentSubmission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
        select: { id: true, status: true },
      });
      if (existing) {
        // Graded work is final unless faculty explicitly reopened it (RESUBMIT).
        const updated = await db.assignmentSubmission.updateMany({
          where: { id: existing.id, status: { not: 'GRADED' } },
          data,
        });
        if (updated.count !== 1) throw new ConflictException('This assignment has already been graded.');
        break;
      }
      try {
        await db.assignmentSubmission.create({ data: { assignmentId, studentId: user.id, ...data } });
        break;
      } catch (err) {
        if (!isUniqueViolation(err) || attempt === 1) throw err; // double-submit race: fall through to update path
      }
    }
    return {
      success: true,
      message: isDraft ? 'Assignment draft saved successfully.' : 'Assignment submitted successfully to faculty!',
      status,
    };
  }

  // ==========================================================================
  // 8. TESTS, QUIZZES & EXAMINATIONS
  // ==========================================================================
  private testWindowStatus(test: { scheduledDate: Date; closesAt: Date | null }, now = new Date()): 'UPCOMING' | 'ACTIVE' | 'CLOSED' {
    if (now < test.scheduledDate) return 'UPCOMING';
    if (test.closesAt && now > test.closesAt) return 'CLOSED';
    return 'ACTIVE';
  }

  async getTests(user: AuthenticatedUser): Promise<StudentTestItem[]> {
    const db = this.access.db();
    const batchIds = await this.access.studentBatchIds(user);
    if (batchIds.length === 0) return [];
    const tests = await db.testQuiz.findMany({
      where: { instituteId: user.instituteId, batchId: { in: batchIds }, status: { in: ['PUBLISHED', 'COMPLETED'] } },
      select: { id: true, title: true, instructions: true, subject: true, scheduledDate: true, closesAt: true, durationMinutes: true, totalMarks: true },
      orderBy: { scheduledDate: 'desc' },
      take: 100,
    });
    if (tests.length === 0) return [];
    const attempts = await db.testAttempt.findMany({
      where: { studentId: user.id, testId: { in: tests.map((t) => t.id) } },
      select: { testId: true, submittedAt: true, score: true, status: true, feedback: true },
    });
    const byTest = new Map(attempts.map((a) => [a.testId, a]));
    return tests.map((t) => {
      const attempt = byTest.get(t.id);
      const window = this.testWindowStatus(t);
      return {
        id: t.id,
        title: t.title,
        instructions: t.instructions || undefined,
        subject: t.subject,
        scheduledDate: t.scheduledDate.toISOString(),
        durationMinutes: t.durationMinutes,
        totalMarks: t.totalMarks,
        status: attempt || window === 'CLOSED' ? 'COMPLETED' : window,
        ...(attempt
          ? { attempt: { submittedAt: attempt.submittedAt.toISOString(), score: attempt.score ?? 0, status: attempt.status, feedback: attempt.feedback || undefined } }
          : {}),
      };
    });
  }

  private async loadAttemptableTest(user: AuthenticatedUser, testId: string) {
    const db = this.access.db();
    const batchIds = await this.access.studentBatchIds(user);
    const test = await db.testQuiz.findFirst({
      where: { id: testId, instituteId: user.instituteId, batchId: { in: batchIds }, status: 'PUBLISHED' },
      select: { id: true, title: true, instructions: true, subject: true, durationMinutes: true, totalMarks: true, scheduledDate: true, closesAt: true },
    });
    if (!test) throw new NotFoundException('Test not found.');
    return test;
  }

  /** Returns the paper WITHOUT any answer key. Refused before the start time, after close, or once attempted. */
  async getTestDetails(user: AuthenticatedUser, testId: string) {
    const db = this.access.db();
    const test = await this.loadAttemptableTest(user, testId);
    const window = this.testWindowStatus(test);
    if (window === 'UPCOMING') throw new ForbiddenException('This test has not started yet.');
    if (window === 'CLOSED') throw new ForbiddenException('This test is closed.');
    const attempt = await db.testAttempt.findUnique({
      where: { testId_studentId: { testId, studentId: user.id } },
      select: { id: true },
    });
    if (attempt) throw new ConflictException('You have already submitted this test.');

    const questions = await db.testQuestion.findMany({
      where: { testId },
      select: { id: true, text: true, type: true, options: true, marks: true }, // never correctOptionIndex / negativeMarks
      orderBy: { position: 'asc' },
      take: MAX_TEST_ANSWERS,
    });
    return {
      id: test.id,
      title: test.title,
      instructions: test.instructions || undefined,
      subject: test.subject,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: (q.type === 'TEXT' ? 'TEXT' : 'MCQ') as 'MCQ' | 'TEXT',
        options: q.options,
        marks: q.marks,
      })),
    };
  }

  /**
   * Scores a submission on the server from the stored answer key. Exactly one attempt per student per test is
   * enforced by the (testId, studentId) unique index; a repeated submit returns the original result unchanged
   * (idempotent), it never re-scores or creates a second attempt.
   */
  async submitTestAttempt(user: AuthenticatedUser, testId: string, answers: TestAnswerItemDto[]) {
    const db = this.access.db();
    if (!Array.isArray(answers)) throw new BadRequestException('answers must be an array.');
    if (answers.length > MAX_TEST_ANSWERS) throw new BadRequestException('Too many answers submitted.');

    const test = await this.loadAttemptableTest(user, testId);
    const toResult = (a: { score: number | null; totalMarks: number | null; feedback: string | null; submittedAt: Date; status: string }) => {
      const total = a.totalMarks ?? test.totalMarks;
      const score = a.score ?? 0;
      return {
        success: true,
        score,
        totalMarks: total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        feedback: a.feedback || '',
        submittedAt: a.submittedAt.toISOString(),
      };
    };

    const prior = await db.testAttempt.findUnique({
      where: { testId_studentId: { testId, studentId: user.id } },
      select: { score: true, totalMarks: true, feedback: true, submittedAt: true, status: true },
    });
    if (prior) return toResult(prior);
    if (this.testWindowStatus(test) !== 'ACTIVE') throw new ForbiddenException('This test is not open for submissions.');

    const questions = await db.testQuestion.findMany({
      where: { testId },
      select: { id: true, type: true, options: true, correctOptionIndex: true, marks: true, negativeMarks: true },
      take: MAX_TEST_ANSWERS,
    });
    if (questions.length === 0) throw new BadRequestException('This test has no questions yet.');

    const submitted = new Map<string, TestAnswerItemDto>();
    for (const a of answers) {
      if (a && typeof a.questionId === 'string' && !submitted.has(a.questionId)) submitted.set(a.questionId, a);
    }

    let score = 0;
    let totalMarks = 0;
    let needsManualGrading = false;
    const rows = questions.map((q) => {
      totalMarks += q.marks;
      const a = submitted.get(q.id);
      let isCorrect: boolean | null = null;
      let marksAwarded = 0;
      let selectedOptionIndex: number | null = null;
      let textAnswer: string | null = null;
      if (q.type === 'TEXT') {
        textAnswer = typeof a?.textAnswer === 'string' ? a.textAnswer.slice(0, 5000) : null;
        if (textAnswer) needsManualGrading = true;
      } else if (a && Number.isInteger(a.selectedOptionIndex) && (a.selectedOptionIndex as number) >= 0 && (a.selectedOptionIndex as number) < q.options.length) {
        selectedOptionIndex = a.selectedOptionIndex as number;
        isCorrect = selectedOptionIndex === q.correctOptionIndex;
        marksAwarded = isCorrect ? q.marks : -q.negativeMarks;
      }
      score += marksAwarded;
      return { questionId: q.id, selectedOptionIndex, textAnswer, isCorrect, marksAwarded };
    });
    score = Math.max(0, Math.round(score * 100) / 100);
    const feedback = needsManualGrading
      ? `Auto-graded questions scored ${score}/${totalMarks}. Written answers await faculty review.`
      : `Online assessment verified. Score: ${score}/${totalMarks} (${totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0}%).`;

    try {
      const attempt = await db.$transaction(async (tx) => {
        const created = await tx.testAttempt.create({
          data: {
            testId,
            studentId: user.id,
            answers: rows.map((r) => ({ questionId: r.questionId, selectedOptionIndex: r.selectedOptionIndex, textAnswer: r.textAnswer })),
            score,
            totalMarks,
            status: needsManualGrading ? 'SUBMITTED' : 'GRADED',
            feedback,
            gradedAt: needsManualGrading ? null : new Date(),
          },
          select: { id: true, score: true, totalMarks: true, feedback: true, submittedAt: true, status: true },
        });
        await tx.testAttemptAnswer.createMany({
          data: rows.map((r) => ({ ...r, attemptId: created.id, studentId: user.id })),
        });
        return created;
      });
      return toResult(attempt);
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Concurrent double-submit: the other request won; return its stored result.
        const winner = await db.testAttempt.findUnique({
          where: { testId_studentId: { testId, studentId: user.id } },
          select: { score: true, totalMarks: true, feedback: true, submittedAt: true, status: true },
        });
        if (winner) return toResult(winner);
      }
      throw err;
    }
  }

  // ==========================================================================
  // 9. RESULTS & STUDY MATERIALS (published only, own records only)
  // ==========================================================================
  async getResults(user: AuthenticatedUser) {
    return this.assessmentService.getStudentPublishedResults(user);
  }

  async getMaterials(user: AuthenticatedUser, batchId?: string, category?: string) {
    return this.assessmentService.getStudentStudyMaterials(user, batchId, category);
  }

  // ==========================================================================
  // 10. FEES & RECEIPTS
  // ==========================================================================
  async getFees(user: AuthenticatedUser): Promise<StudentFeeSummary> {
    const db = this.access.db();
    if (!user.instituteId) return { totalFees: 0, paidAmount: 0, balanceDue: 0, status: 'PAID', receipts: [] };
    const records = await db.studentFeeRecord.findMany({
      where: { studentId: user.id, instituteId: user.instituteId },
      select: { id: true, feeTitle: true, totalAmount: true, paidAmount: true, dueDate: true },
      orderBy: { dueDate: 'desc' },
      take: 100,
    });
    const now = new Date();
    const total = records.reduce((s, r) => s + r.totalAmount, 0);
    const paid = records.reduce((s, r) => s + r.paidAmount, 0);
    const balance = Math.max(0, total - paid);
    const anyOverdue = records.some((r) => r.paidAmount < r.totalAmount && r.dueDate < now);
    return {
      totalFees: total,
      paidAmount: paid,
      balanceDue: balance,
      status: balance <= 0 ? 'PAID' : anyOverdue ? 'OVERDUE' : paid > 0 ? 'PARTIAL' : 'PENDING',
      receipts: records.map((r) => ({
        id: r.id,
        title: r.feeTitle,
        dueDate: isoDay(r.dueDate),
        amount: r.totalAmount,
        paidAmount: r.paidAmount,
        status: r.paidAmount >= r.totalAmount ? 'PAID' : r.dueDate < now ? 'OVERDUE' : 'PENDING',
        receiptNumber: `REC-${r.id.slice(-6).toUpperCase()}`,
      })),
    };
  }

  // ==========================================================================
  // 11. ANNOUNCEMENTS (institute-wide + the student's own batches)
  // ==========================================================================
  async getAnnouncements(user: AuthenticatedUser): Promise<StudentAnnouncementItem[]> {
    const db = this.access.db();
    if (!user.instituteId) return [];
    const batchIds = await this.access.studentBatchIds(user);
    const rows = await db.announcement.findMany({
      where: {
        instituteId: user.instituteId,
        OR: [{ batchId: null }, ...(batchIds.length ? [{ batchId: { in: batchIds } }] : [])],
      },
      select: { id: true, title: true, content: true, priority: true, createdAt: true, author: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      date: isoDay(a.createdAt),
      priority: a.priority,
      authorName: a.author.fullName,
    }));
  }

  // ==========================================================================
  // 12. ACADEMIC QUERIES & DOUBTS
  // ==========================================================================
  async getAcademicQueries(user: AuthenticatedUser): Promise<AcademicQueryItem[]> {
    const db = this.access.db();
    if (!user.instituteId) return [];
    const rows = await db.academicQuery.findMany({
      where: { studentId: user.id, instituteId: user.instituteId },
      select: {
        id: true,
        subject: true,
        topic: true,
        questionText: true,
        attachmentUrl: true,
        status: true,
        createdAt: true,
        replies: { select: { authorId: true, body: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const authorIds = [...new Set(rows.flatMap((r) => r.replies.map((x) => x.authorId)))];
    const authors = authorIds.length
      ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, fullName: true } })
      : [];
    const nameById = new Map(authors.map((a) => [a.id, a.fullName]));
    return rows.map((q) => {
      const reply = q.replies[0];
      return {
        id: q.id,
        subject: q.subject,
        topic: q.topic || undefined,
        questionText: q.questionText,
        attachmentUrl: q.attachmentUrl || undefined,
        status: q.status === 'ANSWERED' ? 'ANSWERED' : 'PENDING',
        facultyReply: reply?.body,
        repliedAt: reply?.createdAt.toISOString(),
        facultyName: reply ? nameById.get(reply.authorId) : undefined,
        createdAt: q.createdAt.toISOString(),
      };
    });
  }

  async submitAcademicQuery(user: AuthenticatedUser, dto: CreateAcademicQueryDto) {
    const db = this.access.db();
    const subject = requireString(dto?.subject, 'Subject', 120);
    const questionText = requireString(dto?.questionText, 'Question', 5000);
    const topic = optionalString(dto?.topic, 'Topic', 200);
    const attachmentUrl = optionalUrl(dto?.attachmentUrl, 'Attachment URL');

    const batchIds = await this.access.studentBatchIds(user);
    if (batchIds.length === 0) throw new ForbiddenException('Join a batch before asking faculty a question.');
    const batches = await db.batch.findMany({
      where: { id: { in: batchIds }, instituteId: user.instituteId },
      select: { id: true, subject: true, teacherId: true },
    });
    const batch = batches.find((b) => b.subject.toLowerCase() === subject.toLowerCase()) ?? batches[0];

    let facultyId: string | undefined;
    if (dto?.facultyId) {
      const assigned = await db.batchFaculty.findFirst({
        where: { facultyId: dto.facultyId, batchId: { in: batchIds }, instituteId: user.instituteId },
        select: { id: true },
      });
      const leads = batches.some((b) => b.teacherId === dto.facultyId);
      if (!assigned && !leads) throw new BadRequestException('That faculty member does not teach your batches.');
      facultyId = dto.facultyId;
    }

    // Idempotent against double-taps: identical question from the same student in the last minute.
    const duplicate = await db.academicQuery.findFirst({
      where: { studentId: user.id, questionText, createdAt: { gte: new Date(Date.now() - 60_000) } },
      select: { id: true, createdAt: true },
    });
    const created =
      duplicate ??
      (await db.academicQuery.create({
        data: {
          instituteId: user.instituteId,
          studentId: user.id,
          batchId: batch?.id,
          facultyId,
          subject,
          topic,
          questionText,
          attachmentUrl,
        },
        select: { id: true, createdAt: true },
      }));
    const query: AcademicQueryItem = {
      id: created.id,
      subject,
      topic,
      questionText,
      attachmentUrl,
      status: 'PENDING',
      createdAt: created.createdAt.toISOString(),
    };
    return { success: true, message: 'Your academic question has been submitted to faculty.', query };
  }

  // ==========================================================================
  // 13. STUDY PLANNER & PERSONAL TASKS (private to the student)
  // ==========================================================================
  private toTask(t: { id: string; title: string; subject: string | null; dueDate: Date | null; priority: string; isCompleted: boolean; createdAt: Date }): PersonalStudyTaskItem {
    return {
      id: t.id,
      title: t.title,
      subject: t.subject || undefined,
      dueDate: t.dueDate ? isoDay(t.dueDate) : undefined,
      priority: t.priority === 'HIGH' || t.priority === 'LOW' ? t.priority : 'NORMAL',
      isCompleted: t.isCompleted,
      createdAt: t.createdAt.toISOString(),
    };
  }

  private static readonly TASK_SELECT = { id: true, title: true, subject: true, dueDate: true, priority: true, isCompleted: true, createdAt: true } as const;

  async getStudyTasks(user: AuthenticatedUser): Promise<PersonalStudyTaskItem[]> {
    const db = this.access.db();
    const rows = await db.studyTask.findMany({
      where: { userId: user.id },
      select: StudentService.TASK_SELECT,
      orderBy: [{ isCompleted: 'asc' }, { dueDate: 'asc' }],
      take: 200,
    });
    return rows.map((t) => this.toTask(t));
  }

  async createStudyTask(user: AuthenticatedUser, dto: CreateStudyTaskDto) {
    const db = this.access.db();
    const title = requireString(dto?.title, 'Task title', 300);
    const priority = dto?.priority && ['LOW', 'NORMAL', 'HIGH'].includes(dto.priority) ? dto.priority : 'NORMAL';
    const dueDate = dto?.dueDate ? parseDate(dto.dueDate, 'Due date') : undefined;
    const count = await db.studyTask.count({ where: { userId: user.id, isCompleted: false } });
    if (count >= 500) throw new BadRequestException('Too many open tasks. Complete or delete some first.');
    const created = await db.studyTask.create({
      data: {
        userId: user.id,
        instituteId: user.instituteId || null,
        title,
        subject: optionalString(dto?.subject, 'Subject', 120) ?? null,
        dueDate: dueDate ?? null,
        priority,
      },
      select: StudentService.TASK_SELECT,
    });
    return this.toTask(created);
  }

  async updateStudyTask(user: AuthenticatedUser, taskId: string, dto: UpdateStudyTaskDto) {
    const db = this.access.db();
    const title = dto?.title !== undefined ? requireString(dto.title, 'Task title', 300) : undefined;
    const result = await db.studyTask.updateMany({
      where: { id: taskId, userId: user.id },
      data: {
        ...(typeof dto?.isCompleted === 'boolean' ? { isCompleted: dto.isCompleted } : {}),
        ...(title ? { title } : {}),
      },
    });
    if (result.count !== 1) throw new NotFoundException('Task not found.');
    const row = await db.studyTask.findFirst({ where: { id: taskId, userId: user.id }, select: StudentService.TASK_SELECT });
    if (!row) throw new NotFoundException('Task not found.');
    return this.toTask(row);
  }

  async deleteStudyTask(user: AuthenticatedUser, taskId: string) {
    const db = this.access.db();
    const result = await db.studyTask.deleteMany({ where: { id: taskId, userId: user.id } });
    if (result.count !== 1) throw new NotFoundException('Task not found.');
    return { success: true, message: 'Task deleted.' };
  }

  // ==========================================================================
  // 14. STUDENT DOCUMENTS (metadata of issued files)
  // ==========================================================================
  async getDocuments(user: AuthenticatedUser): Promise<StudentDocumentItem[]> {
    const db = this.access.db();
    if (!user.instituteId) return [];
    const rows = await db.studentDocument.findMany({
      where: { studentId: user.id, instituteId: user.instituteId },
      select: { id: true, title: true, category: true, issueDate: true, academicPeriod: true, downloadUrl: true, fileSize: true },
      orderBy: { issueDate: 'desc' },
      take: 100,
    });
    return rows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category as StudentDocumentItem['category'],
      issueDate: isoDay(d.issueDate),
      academicPeriod: d.academicPeriod || '',
      downloadUrl: d.downloadUrl,
      fileSize: d.fileSize || undefined,
    }));
  }

  // ==========================================================================
  // 15. SUPPORT & HELP REQUESTS
  // ==========================================================================
  async submitSupportRequest(user: AuthenticatedUser, dto: CreateSupportRequestDto) {
    const db = this.access.db();
    const subject = requireString(dto?.subject, 'Subject', 200);
    const description = requireString(dto?.description, 'Description', 5000);
    if (!SUPPORT_CATEGORIES.includes(dto?.category)) throw new BadRequestException('Unknown support category.');

    const recent = await db.supportRequest.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
    });
    if (recent >= 10) throw new HttpException('Too many support requests today. Please wait before sending more.', HttpStatus.TOO_MANY_REQUESTS);

    const ticket = await db.supportRequest.create({
      data: { userId: user.id, instituteId: user.instituteId || null, category: dto.category, subject, description },
      select: { id: true },
    });
    return {
      success: true,
      ticketId: ticket.id,
      message: 'Support request submitted. Academic desk will update you within 24 hours.',
    };
  }
}
