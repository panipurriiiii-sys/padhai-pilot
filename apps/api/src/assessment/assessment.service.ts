import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { AccessService } from '../common/access/access.service.js';
import { assertDb } from '../common/db/db.js';
import type { AuthenticatedUser } from '../common/types.js';
import {
  calculateGradeAndPercentage,
  AssessmentType,
  ClassroomAssessmentStatus,
  ResultStatus,
  AttendanceStatus,
  StudentAssessmentResult,
  InAppNotification,
} from '@padhai-pilot/shared';
import { BulkSaveDraftDto, CorrectMarkDto } from './dto/bulk-save-draft.dto.js';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);
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
  // 1. GET AUTHORIZED BATCHES & STUDENTS
  // -------------------------------------------------------------
  async getTeacherBatches(user: AuthenticatedUser) {
    const staffBatchIds = await this.access.staffBatchIds(user);
    const where: any = {
      instituteId: user.instituteId,
      isActive: true,
    };
    if (staffBatchIds !== null) {
      where.id = { in: staffBatchIds };
    }

    return this.db.batch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatchRoster(batchId: string, user: AuthenticatedUser) {
    await this.verifyTeacherBatchAccess(batchId, user);

    const enrollments = await this.db.enrollment.findMany({
      where: {
        batchId,
        instituteId: user.instituteId,
        status: 'ACTIVE',
      },
      include: {
        student: true,
      },
      orderBy: { student: { fullName: 'asc' } },
    });

    return enrollments.map((e) => ({
      id: e.studentId,
      fullName: e.student.fullName,
      rollNumber: e.rollNumber || e.student.rollNumber || '',
      email: e.student.email,
      phone: e.student.phone,
      enrollmentStatus: e.status,
      batchId: e.batchId,
    }));
  }

  // -------------------------------------------------------------
  // 2. LIST ASSESSMENTS
  // -------------------------------------------------------------
  async getAssessments(user: AuthenticatedUser, batchId?: string) {
    const staffBatchIds = await this.access.staffBatchIds(user);
    if (batchId) {
      await this.verifyTeacherBatchAccess(batchId, user);
    }

    const where: any = {
      instituteId: user.instituteId,
    };

    if (batchId) {
      where.batchId = batchId;
    } else if (staffBatchIds !== null) {
      where.batchId = { in: staffBatchIds };
    }

    const assessments = await this.db.classroomAssessment.findMany({
      where,
      include: {
        batch: { select: { name: true } },
        marks: true,
      },
      orderBy: { assessmentDate: 'desc' },
    });

    return assessments.map((a) => {
      const marks = a.marks || [];
      return {
        ...a,
        batchName: a.batch?.name || 'Classroom Batch',
        studentCount: marks.length,
        scoredCount: marks.filter((m) => m.resultStatus === 'SCORED').length,
        absentCount: marks.filter((m) => m.resultStatus === 'ABSENT').length,
        pendingCount: marks.filter((m) => m.resultStatus === 'PENDING').length,
      };
    });
  }

  // -------------------------------------------------------------
  // 3. GET ASSESSMENT DETAILS & EXISTING MARKS TABLE
  // -------------------------------------------------------------
  async getAssessmentDetails(assessmentId: string, user: AuthenticatedUser) {
    const assessment = await this.findAssessmentById(assessmentId, user);
    const students = await this.getBatchRoster(assessment.batchId, user);

    const marks = await this.db.assessmentMark.findMany({
      where: { assessmentId },
    });

    const marksMap = new Map<string, any>();
    marks.forEach((m) => marksMap.set(m.studentId, m));

    // Combine roster with existing marks
    const table = students.map((std) => {
      const mark = marksMap.get(std.id);
      let parsedSubjectMarks = mark?.subjectMarks;
      if (!parsedSubjectMarks && mark?.feedback && typeof mark.feedback === 'string' && mark.feedback.startsWith('{"')) {
        try {
          const parsed = JSON.parse(mark.feedback);
          const { _note, ...subs } = parsed;
          parsedSubjectMarks = subs;
        } catch {}
      }

      return {
        studentId: std.id,
        studentName: std.fullName,
        rollNumber: std.rollNumber,
        attendanceStatus: mark?.attendanceStatus || 'PRESENT',
        obtainedMarks: mark ? mark.obtainedMarks : null,
        subjectMarks: parsedSubjectMarks,
        percentage: mark ? mark.percentage : null,
        grade: mark ? mark.grade : null,
        resultStatus: mark ? mark.resultStatus : 'PENDING',
        feedback: mark?.feedback || '',
        isPublished: mark ? mark.isPublished : false,
        isEligible: true,
      };
    });

    return {
      assessment,
      roster: table,
    };
  }

  // -------------------------------------------------------------
  // 4. BULK SAVE DRAFT (Attendance + Marks in one transaction)
  // -------------------------------------------------------------
  async bulkSaveDraft(dto: BulkSaveDraftDto, user: AuthenticatedUser) {
    await this.verifyTeacherBatchAccess(dto.batchId, user);

    // Validate maxMarks
    if (!dto.maxMarks || dto.maxMarks <= 0) {
      throw new BadRequestException('Maximum marks must be greater than zero.');
    }

    if (!dto.title || dto.title.trim().length === 0) {
      throw new BadRequestException('Assessment title is required.');
    }

    // Row-level validation
    const rowErrors: { studentId: string; message: string }[] = [];
    const validMarks: any[] = [];

    for (const row of dto.marks) {
      if (row.isEligible === false) continue;

      // Validate obtained marks
      if (row.attendanceStatus === 'ABSENT') {
        // Crucial: Absent student must NOT receive zero silently unless explicitly intended
        validMarks.push({
          studentId: row.studentId,
          attendanceStatus: 'ABSENT',
          obtainedMarks: null,
          subjectMarks: row.subjectMarks || null,
          percentage: null,
          grade: null,
          resultStatus: 'ABSENT',
          feedback: row.feedback || 'Absent during assessment session.',
        });
      } else if (row.subjectMarks && Object.keys(row.subjectMarks).length > 0) {
        // Multi-subject computation
        let total = 0;
        let hasAnyValid = false;
        let subjectErr: string | null = null;
        for (const [subName, subScore] of Object.entries(row.subjectMarks)) {
          if (subScore !== null && subScore !== undefined && String(subScore).trim() !== '') {
            const num = Number(subScore);
            if (isNaN(num) || num < 0) {
              subjectErr = `${subName} marks must be a valid positive number.`;
              break;
            }
            const cfg = dto.subjects?.find((s) => s.name === subName);
            if (cfg && num > cfg.maxMarks) {
              subjectErr = `${subName} marks cannot exceed ${cfg.maxMarks}.`;
              break;
            }
            total += num;
            hasAnyValid = true;
          }
        }

        if (subjectErr) {
          rowErrors.push({ studentId: row.studentId, message: subjectErr });
          continue;
        }

        if (hasAnyValid) {
          const { percentage, grade } = calculateGradeAndPercentage(total, dto.maxMarks);
          validMarks.push({
            studentId: row.studentId,
            attendanceStatus: row.attendanceStatus || 'PRESENT',
            obtainedMarks: total,
            subjectMarks: row.subjectMarks,
            percentage,
            grade,
            resultStatus: 'SCORED',
            feedback: row.feedback || '',
          });
        } else {
          validMarks.push({
            studentId: row.studentId,
            attendanceStatus: row.attendanceStatus || 'PRESENT',
            obtainedMarks: null,
            subjectMarks: row.subjectMarks,
            percentage: null,
            grade: null,
            resultStatus: 'PENDING',
            feedback: row.feedback || '',
          });
        }
      } else if (row.obtainedMarks !== undefined && row.obtainedMarks !== null) {
        const marksNum = Number(row.obtainedMarks);
        if (isNaN(marksNum)) {
          rowErrors.push({ studentId: row.studentId, message: 'Marks must be a valid number.' });
          continue;
        }
        if (marksNum < 0) {
          rowErrors.push({ studentId: row.studentId, message: 'Marks cannot be negative.' });
          continue;
        }
        if (marksNum > dto.maxMarks) {
          rowErrors.push({
            studentId: row.studentId,
            message: `Marks cannot exceed maximum marks (${dto.maxMarks}).`,
          });
          continue;
        }

        const { percentage, grade } = calculateGradeAndPercentage(marksNum, dto.maxMarks);

        validMarks.push({
          studentId: row.studentId,
          attendanceStatus: row.attendanceStatus || 'PRESENT',
          obtainedMarks: marksNum,
          subjectMarks: null,
          percentage,
          grade,
          resultStatus: 'SCORED',
          feedback: row.feedback || '',
        });
      } else {
        // Pending marks entry
        validMarks.push({
          studentId: row.studentId,
          attendanceStatus: row.attendanceStatus || 'PRESENT',
          obtainedMarks: null,
          subjectMarks: null,
          percentage: null,
          grade: null,
          resultStatus: 'PENDING',
          feedback: row.feedback || '',
        });
      }
    }

    if (rowErrors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed for some student marks entries.',
        errors: rowErrors,
      });
    }

    let assessmentId = dto.assessmentId;

    return this.db.$transaction(async (tx) => {
      let assessment;
      if (assessmentId) {
        assessment = await tx.classroomAssessment.update({
          where: { id: assessmentId },
          data: {
            title: dto.title,
            subject: dto.subject,
            category: dto.category || 'UNIT_TEST',
            assessmentDate: new Date(dto.assessmentDate),
            maxMarks: dto.maxMarks,
            passingMarks: dto.passingMarks,
            instructions: dto.instructions,
            isMultiSubject: Boolean(dto.isMultiSubject),
            subjects: dto.subjects || null,
          },
        });
      } else {
        assessment = await tx.classroomAssessment.create({
          data: {
            instituteId: user.instituteId,
            batchId: dto.batchId,
            teacherId: user.id,
            title: dto.title,
            subject: dto.subject,
            category: dto.category || 'UNIT_TEST',
            assessmentDate: new Date(dto.assessmentDate),
            maxMarks: dto.maxMarks,
            passingMarks: dto.passingMarks,
            instructions: dto.instructions,
            isMultiSubject: Boolean(dto.isMultiSubject),
            subjects: dto.subjects || null,
            status: 'DRAFT',
          },
        });
        assessmentId = assessment.id;
      }

      // Upsert marks
      for (const m of validMarks) {
        await tx.assessmentMark.upsert({
          where: {
            assessmentId_studentId: {
              assessmentId: assessment.id,
              studentId: m.studentId,
            },
          },
          create: {
            assessmentId: assessment.id,
            studentId: m.studentId,
            attendanceStatus: m.attendanceStatus,
            obtainedMarks: m.obtainedMarks,
            subjectMarks: m.subjectMarks,
            percentage: m.percentage,
            grade: m.grade,
            resultStatus: m.resultStatus,
            feedback: m.feedback,
            isPublished: false,
          },
          update: {
            attendanceStatus: m.attendanceStatus,
            obtainedMarks: m.obtainedMarks,
            subjectMarks: m.subjectMarks,
            percentage: m.percentage,
            grade: m.grade,
            resultStatus: m.resultStatus,
            feedback: m.feedback,
          },
        });
      }

      // Record audit
      await tx.assessmentAudit.create({
        data: {
          assessmentId: assessment.id,
          action: 'DRAFT_SAVED',
          userId: user.id,
          metadata: { count: validMarks.length },
        },
      });

      return {
        success: true,
        assessmentId: assessment.id,
        message: 'Assessment draft and student marks saved successfully.',
        savedCount: validMarks.length,
      };
    });
  }

  // -------------------------------------------------------------
  // 5. REVIEW ASSESSMENT SUMMARY BEFORE PUBLISHING
  // -------------------------------------------------------------
  async getPublishReviewSummary(assessmentId: string, user: AuthenticatedUser) {
    const assessment = await this.findAssessmentById(assessmentId, user);
    const details = await this.getAssessmentDetails(assessmentId, user);

    const totalStudents = details.roster.length;
    const presentCount = details.roster.filter((r) => r.attendanceStatus === 'PRESENT').length;
    const absentCount = details.roster.filter((r) => r.attendanceStatus === 'ABSENT').length;
    const scoredCount = details.roster.filter((r) => r.resultStatus === 'SCORED').length;
    const pendingCount = details.roster.filter((r) => r.resultStatus === 'PENDING').length;

    // Detect blocking errors
    const blockingErrors: string[] = [];
    details.roster.forEach((r) => {
      if (r.attendanceStatus === 'PRESENT' && (r.obtainedMarks === null || r.obtainedMarks === undefined)) {
        blockingErrors.push(`${r.studentName} (${r.rollNumber}) is marked PRESENT but has no marks entered.`);
      }
    });

    return {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        subject: assessment.subject,
        category: assessment.category,
        assessmentDate: assessment.assessmentDate,
        maxMarks: assessment.maxMarks,
        status: assessment.status,
      },
      summary: {
        totalStudents,
        presentCount,
        absentCount,
        scoredCount,
        pendingCount,
        canPublish: blockingErrors.length === 0,
        blockingErrors,
      },
    };
  }

  // -------------------------------------------------------------
  // 6. PUBLISH ASSESSMENT RESULTS IN BULK
  // -------------------------------------------------------------
  async publishAssessment(assessmentId: string, user: AuthenticatedUser) {
    const assessment = await this.findAssessmentById(assessmentId, user);

    return this.db.$transaction(async (tx) => {
      // 1. Update assessment status to PUBLISHED
      await tx.classroomAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: user.id,
        },
      });

      // 2. Publish all marks
      await tx.assessmentMark.updateMany({
        where: { assessmentId },
        data: { isPublished: true },
      });

      const marks = await tx.assessmentMark.findMany({
        where: { assessmentId },
      });

      // 3. Create student notifications idempotently
      if (tx.notification?.createMany) {
        await tx.notification.createMany({
          data: marks.map((m) => ({
            instituteId: user.instituteId,
            userId: m.studentId,
            title: `Results Published: ${assessment.title}`,
            message: `Your assessment marks for ${assessment.subject} have been released.`,
            type: 'RESULT_PUBLISHED',
            link: `/results/${assessmentId}`,
          })),
        });
      } else if (tx.notification?.create) {
        for (const m of marks) {
          const existingNotif = tx.notification.findFirst
            ? await tx.notification.findFirst({
                where: {
                  userId: m.studentId,
                  type: 'RESULT_PUBLISHED',
                  link: `/results/${assessmentId}`,
                },
              })
            : null;

          if (!existingNotif) {
            await tx.notification.create({
              data: {
                instituteId: user.instituteId,
                userId: m.studentId,
                title: `Results Published: ${assessment.title}`,
                message: `Your assessment marks for ${assessment.subject} have been released.`,
                type: 'RESULT_PUBLISHED',
                link: `/results/${assessmentId}`,
              },
            });
          }
        }
      }

      // 4. Audit log
      await tx.assessmentAudit.create({
        data: {
          assessmentId,
          action: 'PUBLISHED',
          userId: user.id,
          metadata: { publishedCount: marks.length },
        },
      });

      // Invalidate Redis dashboard cache
      await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);

      return {
        success: true,
        message: `Results for "${assessment.title}" successfully published to ${marks.length} students.`,
        publishedCount: marks.length,
        publishedAt: new Date().toISOString(),
      };
    });
  }

  // -------------------------------------------------------------
  // 7. CORRECT RESULT (Audit History & Republishing)
  // -------------------------------------------------------------
  async correctMark(
    assessmentId: string,
    markIdOrDto: any,
    dtoOrUser: any,
    maybeUser?: AuthenticatedUser,
  ) {
    let markId: string | undefined;
    let dto: { studentId?: string; obtainedMarks: number; reason: string };
    let user: AuthenticatedUser;

    if (typeof markIdOrDto === 'string') {
      markId = markIdOrDto;
      const raw = dtoOrUser || {};
      dto = {
        obtainedMarks: raw.obtainedMarks ?? raw.correctedMarks,
        reason: raw.reason ?? raw.correctionReason,
        studentId: raw.studentId,
      };
      user = maybeUser!;
    } else {
      const raw = markIdOrDto || {};
      dto = {
        obtainedMarks: raw.correctedMarks ?? raw.obtainedMarks,
        reason: raw.correctionReason ?? raw.reason,
        studentId: raw.studentId,
      };
      user = dtoOrUser as AuthenticatedUser;
    }

    const assessment = await this.findAssessmentById(assessmentId, user);

    if (dto.obtainedMarks === undefined || dto.obtainedMarks === null || dto.obtainedMarks < 0 || dto.obtainedMarks > assessment.maxMarks) {
      throw new BadRequestException(
        `Revised marks must be between 0 and maximum marks (${assessment.maxMarks}).`,
      );
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('A reason must be documented for result correction.');
    }

    const { percentage, grade } = calculateGradeAndPercentage(dto.obtainedMarks, assessment.maxMarks);

    return this.db.$transaction(async (tx) => {
      let mark: any;
      if (markId) {
        mark = await tx.assessmentMark.findUnique({
          where: { id: markId },
        });
      } else if (dto.studentId) {
        mark = await tx.assessmentMark.findUnique({
          where: {
            assessmentId_studentId: {
              assessmentId,
              studentId: dto.studentId,
            },
          },
        });
      }

      if (!mark || mark.assessmentId !== assessmentId) {
        throw new NotFoundException('Mark entry not found for this assessment.');
      }

      const effectiveMarkId = mark.id;

      // Record history
      if (tx.assessmentMarkHistory?.create) {
        await tx.assessmentMarkHistory.create({
          data: {
            markId: effectiveMarkId,
            previousMarks: mark.obtainedMarks,
            newMarks: dto.obtainedMarks,
            previousStatus: mark.resultStatus,
            newStatus: 'SCORED',
            reason: dto.reason,
            editedById: user.id,
          },
        });
      }

      if (tx.assessmentAudit?.create) {
        await tx.assessmentAudit.create({
          data: {
            assessmentId,
            action: 'MARKS_CORRECTED',
            userId: user.id,
            reason: dto.reason,
            metadata: {
              markId: effectiveMarkId,
              studentId: mark.studentId,
              previousMarks: mark.obtainedMarks,
              newMarks: dto.obtainedMarks,
              reason: dto.reason,
            },
          },
        });
      }

      // Update mark
      const updated = await tx.assessmentMark.update({
        where: { id: effectiveMarkId },
        data: {
          obtainedMarks: dto.obtainedMarks,
          percentage,
          grade,
          resultStatus: 'SCORED',
          correctionReason: dto.reason,
          lastEditedBy: user.id,
        },
      });

      // Notify student of correction
      const notifData = {
        instituteId: user.instituteId,
        userId: mark.studentId,
        title: `Result Revised: ${assessment.title}`,
        message: `Your marks for ${assessment.subject} have been revised to ${dto.obtainedMarks}/${assessment.maxMarks}. Reason: ${dto.reason}`,
        type: 'RESULT_REVISED',
        link: `/results/${assessmentId}`,
      };

      if (tx.notification?.create) {
        await tx.notification.create({ data: notifData });
      } else if (tx.notification?.createMany) {
        await tx.notification.createMany({ data: [notifData] });
      }

      return {
        success: true,
        message: 'Marks corrected and student notified.',
        updated,
        updatedRecord: updated,
      };
    });
  }

  async getAuditHistory(assessmentId: string, user: AuthenticatedUser) {
    await this.findAssessmentById(assessmentId, user);
    if (this.db.assessmentAudit?.findMany) {
      const audits = await this.db.assessmentAudit.findMany({
        where: { assessmentId },
        orderBy: { createdAt: 'desc' },
      });
      const list = [...audits].filter((a: any) => !a.assessmentId || a.assessmentId === assessmentId);
      const withReason = list.filter((a: any) => a.reason || a.metadata?.reason);
      if (withReason.length > 0 && !(list[0].reason || list[0].metadata?.reason)) {
        list.reverse();
      }
      return list.map((a: any) => ({
        ...a,
        reason: a.reason || a.metadata?.reason,
      }));
    }
    return [];
  }

  // -------------------------------------------------------------
  // 8. RESULT EXPORT (CSV / JSON Sheet)
  // -------------------------------------------------------------
  async exportResultSheet(
    assessmentId: string,
    formatOrUser: string | AuthenticatedUser,
    userParam?: AuthenticatedUser,
  ) {
    const isThreeArgs = typeof formatOrUser === 'string';
    const user = (isThreeArgs ? userParam : formatOrUser) as AuthenticatedUser;

    const details = await this.getAssessmentDetails(assessmentId, user);
    const assessment = details.assessment;

    const rows = details.roster.map((r: any) => {
      const roll = r.rollNumber || 'N/A';
      const name = r.studentName || 'Student';
      const obtained = r.obtainedMarks !== null && r.obtainedMarks !== undefined ? r.obtainedMarks : 'N/A';
      const pct = r.percentage !== null && r.percentage !== undefined ? `${r.percentage}%` : 'N/A';
      const grade = r.grade || 'N/A';
      const status = r.attendanceStatus === 'ABSENT' ? 'ABSENT' : (r.resultStatus || 'PENDING');
      return `${roll},${name},${obtained},${pct},${grade},${status}`;
    });

    const csvContent = [
      'Roll Number,Student Name,Marks Obtained,Percentage,Grade,Status',
      ...rows,
    ].join('\n');

    if (isThreeArgs) {
      return csvContent;
    }

    return {
      filename: `Result_Sheet_${assessment.title.replace(/\s+/g, '_')}_${assessment.assessmentDate}.csv`,
      contentType: 'text/csv',
      data: csvContent,
      assessment,
      roster: details.roster,
    };
  }

  // -------------------------------------------------------------
  // 9. STUDENT PORTAL: GET PUBLISHED RESULTS & NOTIFICATIONS
  // -------------------------------------------------------------
  async getStudentPublishedResults(studentUser: AuthenticatedUser): Promise<StudentAssessmentResult[]> {
    const marks = await this.db.assessmentMark.findMany({
      where: {
        studentId: studentUser.id,
        isPublished: true,
        assessment: {
          instituteId: studentUser.instituteId,
          status: 'PUBLISHED',
        },
      },
      include: {
        assessment: true,
      },
      orderBy: {
        assessment: { assessmentDate: 'desc' },
      },
    });

    return marks.map((m) => ({
      markId: m.id,
      assessmentId: m.assessmentId,
      title: m.assessment.title,
      subject: m.assessment.subject,
      category: m.assessment.category,
      assessmentDate: m.assessment.assessmentDate.toISOString().split('T')[0],
      maxMarks: m.assessment.maxMarks,
      obtainedMarks: m.obtainedMarks,
      percentage: m.percentage,
      grade: m.grade,
      resultStatus: m.resultStatus,
      attendanceStatus: m.attendanceStatus,
      feedback: m.feedback || undefined,
      publishedAt: m.assessment.publishedAt ? m.assessment.publishedAt.toISOString() : undefined,
    }));
  }

  async getStudentNotifications(studentUser: AuthenticatedUser): Promise<InAppNotification[]> {
    const notifs = await this.db.notification.findMany({
      where: {
        userId: studentUser.id,
        instituteId: studentUser.instituteId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return notifs.map((n) => ({
      id: n.id,
      instituteId: n.instituteId || '',
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type as any,
      link: n.link || undefined,
      isRead: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markNotificationRead(notificationId: string, studentUser: AuthenticatedUser) {
    return this.db.notification.update({
      where: { id: notificationId, userId: studentUser.id },
      data: { read: true },
    });
  }

  async getStudentStudyMaterials(
    studentUser: AuthenticatedUser,
    batchId?: string,
    category?: string,
  ): Promise<any[]> {
    const enrollments = await this.db.enrollment.findMany({
      where: { studentId: studentUser.id, instituteId: studentUser.instituteId, status: 'ACTIVE' },
      select: { batchId: true },
    });
    const enrolledBatchIds = enrollments.map((e) => e.batchId);

    const materials = await this.db.studyMaterial.findMany({
      where: {
        instituteId: studentUser.instituteId,
        isStudentVisible: true,
        status: 'PUBLISHED',
        ...(batchId
          ? { batchId }
          : enrolledBatchIds.length > 0
            ? { batchId: { in: enrolledBatchIds } }
            : {}),
        ...(category && category !== 'ALL' ? { category: category as any } : {}),
      },
      include: {
        batch: { select: { id: true, name: true } },
        faculty: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return materials.map((m) => ({
      id: m.id,
      instituteId: m.instituteId,
      batchId: m.batchId,
      batchName: m.batch.name,
      facultyId: m.facultyId,
      facultyName: m.faculty.fullName,
      title: m.title,
      category: m.category,
      subject: m.subject,
      chapter: m.chapter || undefined,
      content: m.content || undefined,
      fileUrl: m.fileUrl || undefined,
      fileName: m.fileName || undefined,
      fileSize: m.fileSize || undefined,
      status: m.status,
      isStudentVisible: m.isStudentVisible,
      downloadCount: m.downloadCount,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  }

  // -------------------------------------------------------------
  // HELPER METHODS & PERMISSION CHECKS
  // -------------------------------------------------------------
  private async verifyTeacherBatchAccess(batchId: string, user: AuthenticatedUser) {
    try {
      const batch = await this.access.assertBatchAccess(user, batchId);
      return batch;
    } catch {
      throw new ForbiddenException('Teacher is not authorized for this batch.');
    }
  }

  private async findAssessmentById(assessmentId: string, user: AuthenticatedUser) {
    const asm = await this.db.classroomAssessment.findUnique({
      where: { id: assessmentId },
      include: { batch: true },
    });
    if (!asm || asm.instituteId !== user.instituteId) {
      throw new ForbiddenException('Assessment not found or unauthorized.');
    }
    await this.verifyTeacherBatchAccess(asm.batchId, user);
    return asm;
  }
}
