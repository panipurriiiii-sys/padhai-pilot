import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
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

interface InMemoryAssessmentStore {
  assessments: any[];
  marks: any[];
  markHistory: any[];
  audits: any[];
  notifications: any[];
  batches: any[];
  students: any[];
}

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);
  private memoryStore: InMemoryAssessmentStore;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {
    this.memoryStore = this.initializeSeedStore();
  }

  private initializeSeedStore(): InMemoryAssessmentStore {
    const instituteId = 'inst_apex_academy';
    const teacherId = 'usr_teacher_sharma';

    const batches = [
      {
        id: 'btc_jee_math_adv',
        instituteId,
        teacherId,
        name: 'JEE Advanced — Mathematics Alpha',
        code: 'JEE-MTH-ADV',
        subject: 'Mathematics',
        gradeLevel: 'Class 12',
      },
      {
        id: 'btc_neet_physics_core',
        instituteId,
        teacherId,
        name: 'Class 11 — Physics Core Batch',
        code: 'PHY-11-CORE',
        subject: 'Physics',
        gradeLevel: 'Class 11',
      },
    ];

    const students = [
      {
        id: 'std_01',
        fullName: 'Aarav Patel',
        rollNumber: 'APX-2026-001',
        email: 'aarav.patel@student.padhaipilot.com',
        batchId: 'btc_jee_math_adv',
        instituteId,
        enrollmentStatus: 'ACTIVE',
      },
      {
        id: 'std_02',
        fullName: 'Diya Sen',
        rollNumber: 'APX-2026-002',
        email: 'diya.sen@student.padhaipilot.com',
        batchId: 'btc_jee_math_adv',
        instituteId,
        enrollmentStatus: 'ACTIVE',
      },
      {
        id: 'std_03',
        fullName: 'Rohan Deshmukh',
        rollNumber: 'APX-2026-003',
        email: 'rohan.deshmukh@student.padhaipilot.com',
        batchId: 'btc_jee_math_adv',
        instituteId,
        enrollmentStatus: 'ACTIVE',
      },
      {
        id: 'std_04',
        fullName: 'Ananya Iyer',
        rollNumber: 'APX-2026-004',
        email: 'ananya.iyer@student.padhaipilot.com',
        batchId: 'btc_jee_math_adv',
        instituteId,
        enrollmentStatus: 'ACTIVE',
      },
      {
        id: 'std_05',
        fullName: 'Vikram Malhotra',
        rollNumber: 'APX-2026-005',
        email: 'vikram.malhotra@student.padhaipilot.com',
        batchId: 'btc_jee_math_adv',
        instituteId,
        enrollmentStatus: 'ACTIVE',
      },
    ];

    // Pre-populate one published assessment to demonstrate student results immediately
    const pastAssessmentId = 'asm_sample_calculus_01';
    const pastAssessment = {
      id: pastAssessmentId,
      instituteId,
      batchId: 'btc_jee_math_adv',
      teacherId,
      title: 'Differential Calculus & Limits Unit Test',
      subject: 'Higher Calculus & Vectors',
      category: 'UNIT_TEST' as AssessmentType,
      assessmentDate: '2026-10-20',
      maxMarks: 50,
      passingMarks: 20,
      instructions: 'Calculators strictly prohibited. Show all intermediate limit expansions.',
      status: 'PUBLISHED' as ClassroomAssessmentStatus,
      publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      publishedBy: teacherId,
      gradingPrecision: 1,
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    };

    const pastMarks = [
      {
        id: 'mrk_01',
        assessmentId: pastAssessmentId,
        studentId: 'std_01',
        attendanceStatus: 'PRESENT' as AttendanceStatus,
        obtainedMarks: 46.5,
        percentage: 93,
        grade: 'A+',
        resultStatus: 'SCORED' as ResultStatus,
        feedback: 'Exceptional mastery of L\'Hopital\'s rule and continuity theorems.',
        isPublished: true,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'mrk_02',
        assessmentId: pastAssessmentId,
        studentId: 'std_02',
        attendanceStatus: 'PRESENT' as AttendanceStatus,
        obtainedMarks: 42,
        percentage: 84,
        grade: 'A',
        resultStatus: 'SCORED' as ResultStatus,
        feedback: 'Very good score. Double check algebraic signs in Taylor series step.',
        isPublished: true,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'mrk_03',
        assessmentId: pastAssessmentId,
        studentId: 'std_03',
        attendanceStatus: 'ABSENT' as AttendanceStatus,
        obtainedMarks: null,
        percentage: null,
        grade: null,
        resultStatus: 'ABSENT' as ResultStatus,
        feedback: 'Absent with prior intimation. Makeup assessment scheduled for next week.',
        isPublished: true,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    const notifications = [
      {
        id: 'notif_01',
        instituteId,
        userId: 'std_01',
        title: 'Results Published: Differential Calculus & Limits Unit Test',
        message: 'Your marks for Higher Calculus & Vectors have been officially published.',
        type: 'RESULT_PUBLISHED',
        link: '/results',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'notif_02',
        instituteId,
        userId: 'std_02',
        title: 'Results Published: Differential Calculus & Limits Unit Test',
        message: 'Your marks for Higher Calculus & Vectors have been officially published.',
        type: 'RESULT_PUBLISHED',
        link: '/results',
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    return {
      assessments: [pastAssessment],
      marks: pastMarks,
      markHistory: [],
      audits: [],
      notifications,
      batches,
      students,
    };
  }

  // -------------------------------------------------------------
  // 1. GET AUTHORIZED BATCHES & STUDENTS
  // -------------------------------------------------------------
  async getTeacherBatches(user: AuthenticatedUser) {
    if (this.prisma.isConnected) {
      return this.prisma.batch.findMany({
        where: {
          instituteId: user.instituteId,
          teacherId: user.id,
          isActive: true,
        },
      });
    }

    return this.memoryStore.batches.filter(
      (b) => b.instituteId === user.instituteId && b.teacherId === user.id,
    );
  }

  async getBatchRoster(batchId: string, user: AuthenticatedUser) {
    await this.verifyTeacherBatchAccess(batchId, user);

    if (this.prisma.isConnected) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          batchId,
          instituteId: user.instituteId,
        },
        include: {
          student: true,
        },
      });

      return enrollments.map((e) => ({
        id: e.studentId,
        fullName: e.student.fullName,
        rollNumber: e.rollNumber,
        email: e.student.email,
        phone: e.student.phone,
        enrollmentStatus: e.status,
        batchId: e.batchId,
      }));
    }

    return this.memoryStore.students.filter((s) => s.batchId === batchId);
  }

  // -------------------------------------------------------------
  // 2. LIST ASSESSMENTS
  // -------------------------------------------------------------
  async getAssessments(user: AuthenticatedUser, batchId?: string) {
    if (this.prisma.isConnected) {
      const where: any = {
        instituteId: user.instituteId,
        teacherId: user.id,
      };
      if (batchId) where.batchId = batchId;

      return this.prisma.classroomAssessment.findMany({
        where,
        include: {
          batch: true,
          marks: true,
        },
        orderBy: { assessmentDate: 'desc' },
      });
    }

    let list = this.memoryStore.assessments.filter(
      (a) => a.instituteId === user.instituteId && a.teacherId === user.id,
    );
    if (batchId) list = list.filter((a) => a.batchId === batchId);

    return list.map((a) => {
      const batch = this.memoryStore.batches.find((b) => b.id === a.batchId);
      const marks = this.memoryStore.marks.filter((m) => m.assessmentId === a.id);
      return {
        ...a,
        batchName: batch?.name || 'Classroom Batch',
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

    let marks: any[] = [];
    if (this.prisma.isConnected) {
      marks = await this.prisma.assessmentMark.findMany({
        where: { assessmentId },
      });
    } else {
      marks = this.memoryStore.marks.filter((m) => m.assessmentId === assessmentId);
    }

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
          subjectMarks: row.subjectMarks,
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

    // 1. Prisma implementation
    if (this.prisma.isConnected) {
      return this.prisma.$transaction(async (tx) => {
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
              percentage: m.percentage,
              grade: m.grade,
              resultStatus: m.resultStatus,
              feedback: m.feedback,
              isPublished: false,
            },
            update: {
              attendanceStatus: m.attendanceStatus,
              obtainedMarks: m.obtainedMarks,
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

    // 2. Resilient memory store implementation
    if (!assessmentId) {
      assessmentId = `asm_${Date.now()}`;
      const newAssessment = {
        id: assessmentId,
        instituteId: user.instituteId,
        batchId: dto.batchId,
        teacherId: user.id,
        title: dto.title,
        subject: dto.subject,
        subjects: dto.subjects,
        isMultiSubject: dto.isMultiSubject,
        category: dto.category || 'UNIT_TEST',
        assessmentDate: dto.assessmentDate,
        maxMarks: dto.maxMarks,
        passingMarks: dto.passingMarks,
        instructions: dto.instructions,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.memoryStore.assessments.push(newAssessment);
    } else {
      const existing = this.memoryStore.assessments.find((a) => a.id === assessmentId);
      if (existing) {
        existing.title = dto.title;
        existing.subject = dto.subject;
        existing.subjects = dto.subjects || existing.subjects;
        existing.isMultiSubject = dto.isMultiSubject !== undefined ? dto.isMultiSubject : existing.isMultiSubject;
        existing.category = dto.category || existing.category;
        existing.assessmentDate = dto.assessmentDate;
        existing.maxMarks = dto.maxMarks;
        existing.passingMarks = dto.passingMarks;
        existing.instructions = dto.instructions;
        existing.updatedAt = new Date().toISOString();
      }
    }

    // Upsert marks in memory
    for (const m of validMarks) {
      const existingIndex = this.memoryStore.marks.findIndex(
        (mark) => mark.assessmentId === assessmentId && mark.studentId === m.studentId,
      );

      const markRecord = {
        id: existingIndex >= 0 ? this.memoryStore.marks[existingIndex].id : `mrk_${Date.now()}_${m.studentId}`,
        assessmentId,
        studentId: m.studentId,
        attendanceStatus: m.attendanceStatus,
        obtainedMarks: m.obtainedMarks,
        subjectMarks: m.subjectMarks,
        percentage: m.percentage,
        grade: m.grade,
        resultStatus: m.resultStatus,
        feedback: m.feedback,
        isPublished: existingIndex >= 0 ? this.memoryStore.marks[existingIndex].isPublished : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        this.memoryStore.marks[existingIndex] = markRecord;
      } else {
        this.memoryStore.marks.push(markRecord);
      }
    }

    return {
      success: true,
      assessmentId,
      message: 'Assessment draft and student marks saved successfully.',
      savedCount: validMarks.length,
    };
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

    if (this.prisma.isConnected) {
      return this.prisma.$transaction(async (tx) => {
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
        for (const m of marks) {
          const existingNotif = await tx.notification.findFirst({
            where: {
              userId: m.studentId,
              type: 'RESULT_PUBLISHED',
              link: `/results/${assessmentId}`,
            },
          });

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

    // Memory Store Implementation
    assessment.status = 'PUBLISHED';
    assessment.publishedAt = new Date().toISOString();
    assessment.publishedBy = user.id;

    const assessmentMarks = this.memoryStore.marks.filter((m) => m.assessmentId === assessmentId);
    assessmentMarks.forEach((m) => {
      m.isPublished = true;
    });

    // Generate notifications idempotently
    let notificationCount = 0;
    for (const m of assessmentMarks) {
      const alreadyNotified = this.memoryStore.notifications.some(
        (n) => n.userId === m.studentId && n.type === 'RESULT_PUBLISHED' && n.link === `/results/${assessmentId}`,
      );

      if (!alreadyNotified) {
        this.memoryStore.notifications.unshift({
          id: `notif_${Date.now()}_${m.studentId}`,
          instituteId: user.instituteId,
          userId: m.studentId,
          title: `Results Published: ${assessment.title}`,
          message: `Your assessment marks for ${assessment.subject} have been released.`,
          type: 'RESULT_PUBLISHED',
          link: `/results/${assessmentId}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        notificationCount++;
      }
    }

    this.memoryStore.audits.push({
      id: `adt_${Date.now()}`,
      assessmentId,
      action: 'PUBLISHED',
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);

    return {
      success: true,
      message: `Results for "${assessment.title}" successfully published to ${assessmentMarks.length} students.`,
      publishedCount: assessmentMarks.length,
      notificationsDispatched: notificationCount,
      publishedAt: assessment.publishedAt,
    };
  }

  // -------------------------------------------------------------
  // 7. CORRECT RESULT (Audit History & Republishing)
  // -------------------------------------------------------------
  async correctMark(
    assessmentId: string,
    markId: string,
    dto: CorrectMarkDto,
    user: AuthenticatedUser,
  ) {
    const assessment = await this.findAssessmentById(assessmentId, user);

    if (dto.obtainedMarks < 0 || dto.obtainedMarks > assessment.maxMarks) {
      throw new BadRequestException(
        `Revised marks must be between 0 and maximum marks (${assessment.maxMarks}).`,
      );
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('A reason must be documented for result correction.');
    }

    const { percentage, grade } = calculateGradeAndPercentage(dto.obtainedMarks, assessment.maxMarks);

    if (this.prisma.isConnected) {
      return this.prisma.$transaction(async (tx) => {
        const mark = await tx.assessmentMark.findUnique({
          where: { id: markId },
        });

        if (!mark || mark.assessmentId !== assessmentId) {
          throw new NotFoundException('Mark entry not found for this assessment.');
        }

        // Record history
        await tx.assessmentMarkHistory.create({
          data: {
            markId,
            previousMarks: mark.obtainedMarks,
            newMarks: dto.obtainedMarks,
            previousStatus: mark.resultStatus,
            newStatus: 'SCORED',
            reason: dto.reason,
            editedById: user.id,
          },
        });

        // Update mark
        const updated = await tx.assessmentMark.update({
          where: { id: markId },
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
        await tx.notification.create({
          data: {
            instituteId: user.instituteId,
            userId: mark.studentId,
            title: `Result Revised: ${assessment.title}`,
            message: `Your marks for ${assessment.subject} have been revised to ${dto.obtainedMarks}/${assessment.maxMarks}. Reason: ${dto.reason}`,
            type: 'RESULT_REVISED',
            link: `/results/${assessmentId}`,
          },
        });

        return {
          success: true,
          message: 'Marks corrected and student notified.',
          updated,
        };
      });
    }

    // Memory Store Implementation
    const mark = this.memoryStore.marks.find((m) => m.id === markId && m.assessmentId === assessmentId);
    if (!mark) {
      throw new NotFoundException('Mark entry not found.');
    }

    const historyRecord = {
      id: `his_${Date.now()}`,
      markId,
      previousMarks: mark.obtainedMarks,
      newMarks: dto.obtainedMarks,
      previousStatus: mark.resultStatus,
      newStatus: 'SCORED',
      reason: dto.reason,
      editedById: user.id,
      createdAt: new Date().toISOString(),
    };
    this.memoryStore.markHistory.push(historyRecord);

    mark.obtainedMarks = dto.obtainedMarks;
    mark.percentage = percentage;
    mark.grade = grade;
    mark.resultStatus = 'SCORED';
    mark.correctionReason = dto.reason;
    mark.lastEditedBy = user.id;
    mark.updatedAt = new Date().toISOString();

    // Create student notification
    this.memoryStore.notifications.unshift({
      id: `notif_${Date.now()}`,
      instituteId: user.instituteId,
      userId: mark.studentId,
      title: `Result Revised: ${assessment.title}`,
      message: `Your marks for ${assessment.subject} have been revised to ${dto.obtainedMarks}/${assessment.maxMarks}. Reason: ${dto.reason}`,
      type: 'RESULT_REVISED',
      link: `/results/${assessmentId}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Marks corrected and student notified.',
      updatedMark: mark,
      historyRecord,
    };
  }

  // -------------------------------------------------------------
  // 8. RESULT EXPORT (CSV / JSON Sheet)
  // -------------------------------------------------------------
  async exportResultSheet(assessmentId: string, user: AuthenticatedUser) {
    const details = await this.getAssessmentDetails(assessmentId, user);
    const assessment = details.assessment;

    const isMulti = assessment.isMultiSubject && assessment.subjects && assessment.subjects.length > 0;
    const headers = ['Student ID', 'Roll Number', 'Student Name', 'Attendance'];

    if (isMulti) {
      assessment.subjects.forEach((s: any) => {
        headers.push(`"${s.name} (Max ${s.maxMarks})"`);
      });
      headers.push(`"Total Marks (Max ${assessment.maxMarks})"`);
    } else {
      headers.push('Max Marks', 'Obtained Marks');
    }

    headers.push('Percentage', 'Grade', 'Result Status', 'Feedback');

    const rows = details.roster.map((r: any) => {
      const rowVals = [
        r.studentId,
        r.rollNumber,
        `"${r.studentName}"`,
        r.attendanceStatus,
      ];

      if (isMulti) {
        assessment.subjects.forEach((s: any) => {
          const subScore = r.subjectMarks?.[s.name];
          rowVals.push(subScore !== undefined && subScore !== null ? subScore : 'N/A');
        });
        rowVals.push(r.obtainedMarks !== null ? r.obtainedMarks : 'N/A');
      } else {
        rowVals.push(assessment.maxMarks);
        rowVals.push(r.obtainedMarks !== null ? r.obtainedMarks : 'N/A');
      }

      rowVals.push(r.percentage !== null ? `${r.percentage}%` : 'N/A');
      rowVals.push(r.grade || 'N/A');
      rowVals.push(r.resultStatus);
      rowVals.push(`"${r.feedback || ''}"`);

      return rowVals;
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

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
    if (this.prisma.isConnected) {
      const marks = await this.prisma.assessmentMark.findMany({
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

    // Memory Store: Strictly published results for this student only!
    const marks = this.memoryStore.marks.filter(
      (m) => m.studentId === studentUser.id && m.isPublished === true,
    );

    return marks
      .map((m) => {
        const assessment = this.memoryStore.assessments.find(
          (a) => a.id === m.assessmentId && a.status === 'PUBLISHED',
        );
        if (!assessment) return null;

        return {
          markId: m.id,
          assessmentId: assessment.id,
          title: assessment.title,
          subject: assessment.subject,
          category: assessment.category,
          assessmentDate: assessment.assessmentDate,
          maxMarks: assessment.maxMarks,
          obtainedMarks: m.obtainedMarks,
          percentage: m.percentage,
          grade: m.grade,
          resultStatus: m.resultStatus,
          attendanceStatus: m.attendanceStatus,
          feedback: m.feedback,
          publishedAt: assessment.publishedAt,
        };
      })
      .filter(Boolean) as StudentAssessmentResult[];
  }

  async getStudentNotifications(studentUser: AuthenticatedUser): Promise<InAppNotification[]> {
    if (this.prisma.isConnected) {
      const notifs = await this.prisma.notification.findMany({
        where: {
          userId: studentUser.id,
          instituteId: studentUser.instituteId,
        },
        orderBy: { createdAt: 'desc' },
      });
      return notifs.map((n) => ({
        id: n.id,
        instituteId: n.instituteId,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link || undefined,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }));
    }

    return this.memoryStore.notifications.filter((n) => n.userId === studentUser.id);
  }

  async markNotificationRead(notificationId: string, studentUser: AuthenticatedUser) {
    if (this.prisma.isConnected) {
      return this.prisma.notification.update({
        where: { id: notificationId, userId: studentUser.id },
        data: { isRead: true },
      });
    }

    const notif = this.memoryStore.notifications.find(
      (n) => n.id === notificationId && n.userId === studentUser.id,
    );
    if (notif) notif.isRead = true;
    return { success: true };
  }

  async getStudentStudyMaterials(
    studentUser: AuthenticatedUser,
    batchId?: string,
    category?: string,
  ): Promise<any[]> {
    if (this.prisma.isConnected) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId: studentUser.id, instituteId: studentUser.instituteId },
        select: { batchId: true },
      });
      const enrolledBatchIds = enrollments.map((e) => e.batchId);

      const materials = await this.prisma.studyMaterial.findMany({
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

    // Memory Store fallback
    const list = [
      {
        id: 'mat_01',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        title: 'Definite Integrals — Comprehensive Theory & 50 Solved JEE Advanced Models',
        category: 'CHAPTER_NOTES',
        subject: 'Mathematics',
        chapter: 'Definite Integration',
        content: 'Complete analytical notes covering King property, Leibniz integral rule, and Walli formula.',
        fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
        fileName: 'Definite_Integrals_JEE_Adv_Notes.pdf',
        fileSize: '3.8 MB',
        status: 'PUBLISHED',
        isStudentVisible: true,
        downloadCount: 68,
        createdAt: '2026-10-28T10:00:00.000Z',
        updatedAt: '2026-10-28T10:00:00.000Z',
      },
    ];

    return list.filter((m) => {
      if (batchId && m.batchId !== batchId) return false;
      if (category && category !== 'ALL' && m.category !== category) return false;
      return true;
    });
  }

  // -------------------------------------------------------------
  // HELPER METHODS & PERMISSION CHECKS
  // -------------------------------------------------------------
  private async verifyTeacherBatchAccess(batchId: string, user: AuthenticatedUser) {
    if (this.prisma.isConnected) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
      });
      if (!batch || batch.instituteId !== user.instituteId || batch.teacherId !== user.id) {
        throw new ForbiddenException('Teacher is not authorized for this batch.');
      }
      return batch;
    }

    const batch = this.memoryStore.batches.find(
      (b) => b.id === batchId && b.instituteId === user.instituteId && b.teacherId === user.id,
    );
    if (!batch) {
      throw new ForbiddenException('Teacher is not authorized for this batch.');
    }
    return batch;
  }

  private async findAssessmentById(assessmentId: string, user: AuthenticatedUser) {
    if (this.prisma.isConnected) {
      const asm = await this.prisma.classroomAssessment.findUnique({
        where: { id: assessmentId },
        include: { batch: true },
      });
      if (!asm || asm.instituteId !== user.instituteId || asm.teacherId !== user.id) {
        throw new ForbiddenException('Assessment not found or unauthorized.');
      }
      return asm;
    }

    const asm = this.memoryStore.assessments.find(
      (a) => a.id === assessmentId && a.instituteId === user.instituteId && a.teacherId === user.id,
    );
    if (!asm) {
      throw new ForbiddenException('Assessment not found or unauthorized.');
    }
    return asm;
  }
}
