import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertDb, clampLimit, parseDate } from '../common/db/db.js';
import { AccessService } from '../common/access/access.service.js';
import { isManagement } from '../common/security/roles.js';
import { LOGO_EXTENSIONS, validateMediaUrl } from '../common/security/media-url.js';
import type { AuthenticatedUser } from '../common/types.js';
import type {
  UpdateTuitionProfileDto,
  CreateFacultyDto,
  UpdateFacultyDto,
  GenerateSalaryRecordDto,
  RecordPaymentDto,
  ApplyFacultyLeaveDto,
  ReviewFacultyLeaveDto,
  CreateTeachingDiaryDto,
  UpdateTeachingDiaryDto,
  CreateStudyMaterialDto,
  CreateStudentFeeRecordDto,
  DispatchFeeReminderDto,
  MediaUploadProxyDto,
} from './dto/tuition.dto.js';
import type {
  TuitionBrandingProfile,
  FacultyMember,
  SalaryStatementItem,
  FacultyLeaveItem,
  DailyTeachingDiaryEntry,
  TeachingDiaryOverview,
  StudyMaterialItem,
  StudentFeeItem,
  FeeSummaryOverview,
} from '@padhai-pilot/shared';
import { validateInstituteBranding } from '@padhai-pilot/shared';

@Injectable()
export class TuitionService {
  private readonly access: AccessService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(AccessService) access?: AccessService,
  ) {
    this.access = access ?? new AccessService(prisma);
  }

  /** The user must hold a faculty profile in this institute (tenant check for facultyId inputs). */
  private async assertFacultyInInstitute(instituteId: string, facultyUserId: string, label = 'facultyId') {
    const p = await this.prisma.facultyProfile.findFirst({
      where: { instituteId, userId: facultyUserId },
      select: { id: true },
    });
    if (!p) throw new BadRequestException(`${label} does not belong to a faculty member of this institute.`);
  }

  // ==========================================================================
  // 1. TUITION PROFILE & BRANDING
  // ==========================================================================

  async getBrandingProfile(instituteId: string): Promise<TuitionBrandingProfile> {
    assertDb(this.prisma);
    const institute = await this.prisma.institute.findUnique({
      where: { id: instituteId },
      include: {
        _count: {
          select: {
            facultyProfiles: true,
            batches: true,
            enrollments: true,
          },
        },
      },
    });

    if (!institute) {
      throw new NotFoundException(`Institute with ID ${instituteId} not found.`);
    }

    return {
      id: institute.id,
      name: institute.name,
      slug: institute.slug,
      logoUrl: institute.logoUrl || undefined,
      primaryColor: institute.primaryColor || '#1677FF',
      address: institute.address || undefined,
      contactPhone: institute.contactPhone || undefined,
      contactEmail: institute.contactEmail || undefined,
      website: institute.website || undefined,
      description: institute.description || undefined,
      footerText: institute.footerText || undefined,
      signatoryName: institute.signatoryName || undefined,
      signatoryTitle: institute.signatoryTitle || undefined,
      academicYear: institute.academicYear || '2026-2027',
      ownerId: institute.ownerId || undefined,
      totalFaculty: institute._count.facultyProfiles,
      totalBatches: institute._count.batches,
      totalStudents: institute._count.enrollments,
    };
  }

  async updateBrandingProfile(
    instituteId: string,
    dto: UpdateTuitionProfileDto,
  ): Promise<TuitionBrandingProfile> {
    if (dto.primaryColor) {
      // Institute accent colours are validated server-side (hex only + WCAG contrast); see docs/global-design-system.md.
      const check = validateInstituteBranding({ accentColor: dto.primaryColor });
      if (!check.ok) throw new BadRequestException({ message: 'Invalid brand colour.', errors: check.errors });
      dto.primaryColor = check.branding?.accentColor ?? dto.primaryColor;
    }
    if (dto.logoUrl) dto.logoUrl = validateMediaUrl(dto.logoUrl, 'logoUrl', LOGO_EXTENSIONS);
    assertDb(this.prisma);
    const updated = await this.prisma.institute.update({
      where: { id: instituteId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.primaryColor ? { primaryColor: dto.primaryColor } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
        ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail } : {}),
        ...(dto.website !== undefined ? { website: dto.website } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.footerText !== undefined ? { footerText: dto.footerText } : {}),
        ...(dto.signatoryName !== undefined ? { signatoryName: dto.signatoryName } : {}),
        ...(dto.signatoryTitle !== undefined ? { signatoryTitle: dto.signatoryTitle } : {}),
        ...(dto.academicYear ? { academicYear: dto.academicYear } : {}),
      },
    });

    return this.getBrandingProfile(updated.id);
  }

  // ==========================================================================
  // 2. FACULTY MANAGEMENT & WORKLOAD
  // ==========================================================================

  async getFaculties(instituteId: string): Promise<FacultyMember[]> {
    assertDb(this.prisma);
    const profiles = await this.prisma.facultyProfile.findMany({
      where: { instituteId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            teacherBatches: {
              where: { instituteId },
              select: {
                id: true,
                name: true,
                code: true,
                subject: true,
                gradeLevel: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      staffId: p.staffId,
      fullName: p.user.fullName,
      email: p.user.email,
      phone: p.user.phone || undefined,
      avatarUrl: p.user.avatarUrl || undefined,
      designation: p.designation,
      employmentStatus: p.employmentStatus as any,
      compensationType: p.compensationType as any,
      baseSalary: p.baseSalary,
      hourlyRate: p.hourlyRate,
      joiningDate: p.joiningDate.toISOString(),
      assignedSubjects: p.assignedSubjects,
      delegatedPermissions: p.delegatedPermissions as any,
      assignedBatchesCount: p.user.teacherBatches.length,
      assignedBatches: p.user.teacherBatches,
      weeklyLectureCount: p.user.teacherBatches.length * 4,
      emergencyContact: p.emergencyContact || undefined,
    }));
  }

  async createFaculty(instituteId: string, dto: CreateFacultyDto): Promise<FacultyMember> {
    assertDb(this.prisma);

    // Validate batch ownership if batchIds provided
    if (dto.batchIds && dto.batchIds.length > 0 && this.prisma.batch?.findMany) {
      const validBatches = await this.prisma.batch.findMany({
        where: { id: { in: dto.batchIds }, instituteId },
        select: { id: true },
      });
      if (validBatches.length !== dto.batchIds.length) {
        throw new BadRequestException('One or more batch IDs are invalid or belong to another institute.');
      }
    }

    // Faculty accounts are created ONLY through the invitation flow (POST /faculty-invitations): this endpoint
    // never creates a user or a credential, and never links an arbitrary existing account. It can only
    // update the profile of someone who already holds a TEACHER/FACULTY membership in this institute.
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    const membership = user
      ? await this.prisma.instituteMembership.findUnique({
          where: { instituteId_userId: { instituteId, userId: user.id } },
          select: { role: true, status: true },
        })
      : null;
    if (!user || !membership || !['FACULTY', 'TEACHER'].includes(membership.role)) {
      throw new BadRequestException(
        'Faculty must join through an invitation. Use POST /faculty-invitations to invite this person.',
      );
    }

    // Create or update FacultyProfile
    const profile = await this.prisma.facultyProfile.upsert({
      where: {
        instituteId_userId: {
          instituteId,
          userId: user.id,
        },
      },
      update: {
        staffId: dto.staffId,
        designation: dto.designation,
        compensationType: dto.compensationType,
        baseSalary: dto.baseSalary,
        hourlyRate: dto.hourlyRate || 0,
        assignedSubjects: dto.assignedSubjects,
        delegatedPermissions: dto.delegatedPermissions || [],
      },
      create: {
        instituteId,
        userId: user.id,
        staffId: dto.staffId,
        designation: dto.designation,
        compensationType: dto.compensationType,
        baseSalary: dto.baseSalary,
        hourlyRate: dto.hourlyRate || 0,
        assignedSubjects: dto.assignedSubjects,
        delegatedPermissions: dto.delegatedPermissions || [],
      },
    });

    // Assign batches if provided
    if (dto.batchIds && dto.batchIds.length > 0) {
      await this.prisma.batch.updateMany({
        where: {
          id: { in: dto.batchIds },
          instituteId,
        },
        data: {
          teacherId: user.id,
        },
      });
    }

    const faculties = await this.getFaculties(instituteId);
    const found = faculties.find((f) => f.id === profile.id);
    if (!found) {
      throw new BadRequestException('Failed to retrieve newly created faculty member.');
    }
    return found;
  }

  async updateFaculty(
    instituteId: string,
    facultyId: string,
    dto: UpdateFacultyDto,
  ): Promise<FacultyMember> {
    assertDb(this.prisma);
    const profile = await this.prisma.facultyProfile.findUnique({
      where: { id: facultyId },
      include: { user: true },
    });

    if (!profile || profile.instituteId !== instituteId) {
      throw new NotFoundException(`Faculty profile ${facultyId} not found.`);
    }

    // Validate batch ownership if batchIds provided
    if (dto.batchIds && dto.batchIds.length > 0 && this.prisma.batch?.findMany) {
      const validBatches = await this.prisma.batch.findMany({
        where: { id: { in: dto.batchIds }, instituteId },
        select: { id: true },
      });
      if (validBatches.length !== dto.batchIds.length) {
        throw new BadRequestException('One or more batch IDs are invalid or belong to another institute.');
      }
    }

    // Update user details if requested
    if (dto.fullName || dto.phone) {
      await this.prisma.user.update({
        where: { id: profile.userId },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName } : {}),
          ...(dto.phone ? { phone: dto.phone } : {}),
        },
      });
    }

    // Update profile
    await this.prisma.facultyProfile.update({
      where: { id: facultyId },
      data: {
        ...(dto.designation ? { designation: dto.designation } : {}),
        ...(dto.employmentStatus ? { employmentStatus: dto.employmentStatus } : {}),
        ...(dto.compensationType ? { compensationType: dto.compensationType } : {}),
        ...(dto.baseSalary !== undefined ? { baseSalary: dto.baseSalary } : {}),
        ...(dto.hourlyRate !== undefined ? { hourlyRate: dto.hourlyRate } : {}),
        ...(dto.assignedSubjects ? { assignedSubjects: dto.assignedSubjects } : {}),
        ...(dto.delegatedPermissions ? { delegatedPermissions: dto.delegatedPermissions } : {}),
      },
    });

    // Update batches if provided
    if (dto.batchIds) {
      await this.prisma.batch.updateMany({
        where: {
          id: { in: dto.batchIds },
          instituteId,
        },
        data: {
          teacherId: profile.userId,
        },
      });
    }

    const faculties = await this.getFaculties(instituteId);
    return faculties.find((f) => f.id === facultyId)!;
  }

  // ==========================================================================
  // 3. SALARY & PAYROLL RECORDS
  // ==========================================================================

  async getSalaryRecords(
    instituteId: string,
    payPeriod?: string,
    facultyId?: string,
  ): Promise<SalaryStatementItem[]> {
    assertDb(this.prisma);
    const records = await this.prisma.salaryRecord.findMany({
      where: {
        instituteId,
        ...(payPeriod ? { payPeriod } : {}),
        ...(facultyId ? { facultyId } : {}),
      },
      include: {
        faculty: {
          select: {
            id: true,
            fullName: true,
            facultyProfiles: {
              where: { instituteId },
              select: { staffId: true, designation: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return records.map((r) => {
      const profile = r.faculty.facultyProfiles[0];
      return {
        id: r.id,
        instituteId: r.instituteId,
        facultyId: r.facultyId,
        facultyName: r.faculty.fullName,
        staffId: profile?.staffId || 'N/A',
        designation: profile?.designation || 'Faculty Member',
        payPeriod: r.payPeriod,
        compensationModel: r.compensationModel as any,
        classesConducted: r.classesConducted,
        baseAmount: r.baseAmount,
        additions: r.additions,
        deductions: r.deductions,
        advances: r.advances,
        netPayable: r.netPayable,
        status: r.status as any,
        paymentDate: r.paymentDate ? r.paymentDate.toISOString() : undefined,
        paymentMethod: r.paymentMethod || undefined,
        paymentReference: r.paymentReference || undefined,
        remarks: r.remarks || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }

  async generateSalaryRecord(
    instituteId: string,
    dto: GenerateSalaryRecordDto,
  ): Promise<SalaryStatementItem> {
    assertDb(this.prisma);

    await this.assertFacultyInInstitute(instituteId, dto.facultyId);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(dto.payPeriod || '')) {
      throw new BadRequestException('payPeriod must be YYYY-MM.');
    }
    for (const [k, v] of [['baseAmount', dto.baseAmount], ['additions', dto.additions || 0], ['deductions', dto.deductions || 0], ['advances', dto.advances || 0]] as const) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new BadRequestException(`${k} must be a non-negative number.`);
    }
    const additions = dto.additions || 0;
    const deductions = dto.deductions || 0;
    const advances = dto.advances || 0;
    const netPayable = Math.max(0, dto.baseAmount + additions - deductions - advances);
    const where = { instituteId_facultyId_payPeriod: { instituteId, facultyId: dto.facultyId, payPeriod: dto.payPeriod } };
    const include = {
      faculty: {
        select: {
          id: true,
          fullName: true,
          facultyProfiles: { where: { instituteId }, select: { staffId: true, designation: true } },
        },
      },
    } as const;
    const values = {
      compensationModel: dto.compensationModel,
      classesConducted: dto.classesConducted || 0,
      baseAmount: dto.baseAmount,
      additions,
      deductions,
      advances,
      netPayable,
      remarks: dto.remarks,
    };

    const existing = await this.prisma.salaryRecord.findUnique({ where });
    let record;
    if (existing) {
      // Guarded update: a record that is (or becomes, concurrently) PAID is never overwritten.
      const res = await this.prisma.salaryRecord.updateMany({
        where: { id: existing.id, instituteId, status: { not: 'PAID' } },
        data: values,
      });
      if (res.count !== 1) {
        throw new BadRequestException('Cannot modify a salary record that has already been marked as PAID.');
      }
      record = await this.prisma.salaryRecord.findUniqueOrThrow({ where: { id: existing.id }, include });
    } else {
      try {
        record = await this.prisma.salaryRecord.create({
          data: { instituteId, facultyId: dto.facultyId, payPeriod: dto.payPeriod, ...values, status: 'DRAFT' },
          include,
        });
      } catch (err) {
        if ((err as { code?: string }).code === 'P2002') {
          throw new ConflictException('A salary record for this faculty and period already exists. Retry to update it.');
        }
        throw err;
      }
    }

    const profile = record.faculty.facultyProfiles[0];
    return {
      id: record.id,
      instituteId: record.instituteId,
      facultyId: record.facultyId,
      facultyName: record.faculty.fullName,
      staffId: profile?.staffId || 'N/A',
      designation: profile?.designation || 'Faculty Member',
      payPeriod: record.payPeriod,
      compensationModel: record.compensationModel as any,
      classesConducted: record.classesConducted,
      baseAmount: record.baseAmount,
      additions: record.additions,
      deductions: record.deductions,
      advances: record.advances,
      netPayable: record.netPayable,
      status: record.status as any,
      paymentDate: record.paymentDate ? record.paymentDate.toISOString() : undefined,
      paymentMethod: record.paymentMethod || undefined,
      paymentReference: record.paymentReference || undefined,
      remarks: record.remarks || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async recordSalaryPayment(
    instituteId: string,
    salaryRecordId: string,
    dto: RecordPaymentDto,
  ): Promise<SalaryStatementItem> {
    assertDb(this.prisma);
    const existing = await this.prisma.salaryRecord.findUnique({
      where: { id: salaryRecordId },
    });

    if (!existing || existing.instituteId !== instituteId) {
      throw new NotFoundException(`Salary record ${salaryRecordId} not found.`);
    }

    if (existing.status === 'PAID') {
      throw new BadRequestException('This salary statement is already marked as PAID.');
    }

    const claim = await this.prisma.salaryRecord.updateMany({
      where: { id: salaryRecordId, instituteId, status: { not: 'PAID' } },
      data: {
        status: 'PAID',
        paymentDate: parseDate(dto.paymentDate, 'paymentDate'),
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        remarks: dto.remarks || existing.remarks,
      },
    });
    if (claim.count !== 1) throw new BadRequestException('This salary statement is already marked as PAID.');
    const updated = await this.prisma.salaryRecord.findUniqueOrThrow({
      where: { id: salaryRecordId },
      include: {
        faculty: {
          select: {
            id: true,
            fullName: true,
            facultyProfiles: {
              where: { instituteId },
              select: { staffId: true, designation: true },
            },
          },
        },
      },
    });

    const profile = updated.faculty.facultyProfiles[0];
    return {
      id: updated.id,
      instituteId: updated.instituteId,
      facultyId: updated.facultyId,
      facultyName: updated.faculty.fullName,
      staffId: profile?.staffId || 'N/A',
      designation: profile?.designation || 'Faculty Member',
      payPeriod: updated.payPeriod,
      compensationModel: updated.compensationModel as any,
      classesConducted: updated.classesConducted,
      baseAmount: updated.baseAmount,
      additions: updated.additions,
      deductions: updated.deductions,
      advances: updated.advances,
      netPayable: updated.netPayable,
      status: updated.status as any,
      paymentDate: updated.paymentDate ? updated.paymentDate.toISOString() : undefined,
      paymentMethod: updated.paymentMethod || undefined,
      paymentReference: updated.paymentReference || undefined,
      remarks: updated.remarks || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ==========================================================================
  // 4. LEAVE APPLICATIONS
  // ==========================================================================

  async getLeaveApplications(
    instituteId: string,
    facultyId?: string,
  ): Promise<FacultyLeaveItem[]> {
    assertDb(this.prisma);
    const leaves = await this.prisma.facultyLeaveApplication.findMany({
      where: {
        instituteId,
        ...(facultyId ? { facultyId } : {}),
      },
      include: {
        faculty: {
          select: {
            id: true,
            fullName: true,
            facultyProfiles: {
              where: { instituteId },
              select: { staffId: true },
            },
          },
        },
        reviewedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return leaves.map((l) => ({
      id: l.id,
      instituteId: l.instituteId,
      facultyId: l.facultyId,
      facultyName: l.faculty.fullName,
      staffId: l.faculty.facultyProfiles[0]?.staffId || 'N/A',
      leaveType: l.leaveType as any,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      totalDays: l.totalDays,
      reason: l.reason,
      attachmentUrl: l.attachmentUrl || undefined,
      status: l.status as any,
      reviewedById: l.reviewedById || undefined,
      reviewerName: l.reviewedBy?.fullName || undefined,
      reviewerRemarks: l.reviewerRemarks || undefined,
      reviewedAt: l.reviewedAt ? l.reviewedAt.toISOString() : undefined,
      substituteFacultyId: l.substituteFacultyId || undefined,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async applyLeave(
    instituteId: string,
    facultyUserId: string,
    dto: ApplyFacultyLeaveDto,
  ): Promise<FacultyLeaveItem> {
    assertDb(this.prisma);
    if (!(dto.totalDays > 0) || dto.totalDays > 365) {
      throw new BadRequestException('Leave total days must be between 0 and 365.');
    }
    const startDate = parseDate(dto.startDate, 'startDate');
    const endDate = parseDate(dto.endDate, 'endDate');
    if (endDate < startDate) throw new BadRequestException('endDate cannot be before startDate.');
    if (dto.substituteFacultyId) await this.assertFacultyInInstitute(instituteId, dto.substituteFacultyId, 'substituteFacultyId');

    const leave = await this.prisma.facultyLeaveApplication.create({
      data: {
        instituteId,
        facultyId: facultyUserId,
        leaveType: dto.leaveType,
        startDate,
        endDate,
        totalDays: dto.totalDays,
        reason: dto.reason,
        attachmentUrl: dto.attachmentUrl,
        substituteFacultyId: dto.substituteFacultyId,
        status: 'PENDING',
      },
      include: {
        faculty: {
          select: {
            id: true,
            fullName: true,
            facultyProfiles: {
              where: { instituteId },
              select: { staffId: true },
            },
          },
        },
      },
    });

    return {
      id: leave.id,
      instituteId: leave.instituteId,
      facultyId: leave.facultyId,
      facultyName: leave.faculty.fullName,
      staffId: leave.faculty.facultyProfiles[0]?.staffId || 'N/A',
      leaveType: leave.leaveType as any,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      totalDays: leave.totalDays,
      reason: leave.reason,
      attachmentUrl: leave.attachmentUrl || undefined,
      status: leave.status as any,
      substituteFacultyId: leave.substituteFacultyId || undefined,
      createdAt: leave.createdAt.toISOString(),
    };
  }

  async reviewLeave(
    instituteId: string,
    leaveId: string,
    reviewer: AuthenticatedUser,
    dto: ReviewFacultyLeaveDto,
  ): Promise<FacultyLeaveItem> {
    assertDb(this.prisma);
    const leave = await this.prisma.facultyLeaveApplication.findUnique({
      where: { id: leaveId },
    });

    if (!leave || leave.instituteId !== instituteId) {
      throw new NotFoundException(`Leave application ${leaveId} not found.`);
    }

    if (leave.status !== 'PENDING') {
      throw new BadRequestException(`This leave application is already ${leave.status.toLowerCase()}.`);
    }
    if (dto.substituteFacultyId) await this.assertFacultyInInstitute(instituteId, dto.substituteFacultyId, 'substituteFacultyId');

    // MANDATORY RULE: Faculty member cannot review or approve their own leave
    if (leave.facultyId === reviewer.id) {
      throw new BadRequestException(
        'Faculty cannot review or approve their own leave application.',
      );
    }

    const updated = await this.prisma.facultyLeaveApplication.update({
      where: { id: leaveId },
      data: {
        status: dto.status,
        reviewerRemarks: dto.reviewerRemarks,
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
        substituteFacultyId: dto.substituteFacultyId || leave.substituteFacultyId,
      },
      include: {
        faculty: {
          select: {
            id: true,
            fullName: true,
            facultyProfiles: {
              where: { instituteId },
              select: { staffId: true },
            },
          },
        },
        reviewedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return {
      id: updated.id,
      instituteId: updated.instituteId,
      facultyId: updated.facultyId,
      facultyName: updated.faculty.fullName,
      staffId: updated.faculty.facultyProfiles[0]?.staffId || 'N/A',
      leaveType: updated.leaveType as any,
      startDate: updated.startDate.toISOString(),
      endDate: updated.endDate.toISOString(),
      totalDays: updated.totalDays,
      reason: updated.reason,
      attachmentUrl: updated.attachmentUrl || undefined,
      status: updated.status as any,
      reviewedById: updated.reviewedById || undefined,
      reviewerName: updated.reviewedBy?.fullName || undefined,
      reviewerRemarks: updated.reviewerRemarks || undefined,
      reviewedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : undefined,
      substituteFacultyId: updated.substituteFacultyId || undefined,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // ==========================================================================
  // 5. DAILY TEACHING DIARY (LESSON JOURNAL)
  // ==========================================================================

  async getTeachingDiaries(
    user: AuthenticatedUser,
    batchId?: string,
    facultyId?: string,
  ): Promise<DailyTeachingDiaryEntry[]> {
    assertDb(this.prisma);
    const instituteId = user.instituteId;
    // Owners/admins see every entry. Faculty see their own entries (any status/audience) plus published
    // batch-audience entries of colleagues for batches they teach; never private drafts of others.
    let visibility: Record<string, unknown> = {};
    if (!isManagement(user.role)) {
      const mine = (await this.access.staffBatchIds(user)) ?? [];
      visibility = {
        OR: [
          { facultyId: user.id },
          { status: 'PUBLISHED', audience: 'BATCH', batchId: { in: mine } },
        ],
      };
    }
    if (batchId) await this.access.assertBatchAccess(user, batchId);
    const diaries = await this.prisma.dailyTeachingDiary.findMany({
      where: {
        instituteId,
        ...visibility,
        ...(batchId ? { batchId } : {}),
        ...(facultyId ? { facultyId } : {}),
      },
      take: 200,
      include: {
        batch: { select: { id: true, name: true, code: true } },
        faculty: { select: { id: true, fullName: true } },
      },
      orderBy: { lessonDate: 'desc' },
    });

    return diaries.map((d) => ({
      id: d.id,
      instituteId: d.instituteId,
      batchId: d.batchId,
      batchName: d.batch.name,
      batchCode: d.batch.code,
      facultyId: d.facultyId,
      facultyName: d.faculty.fullName,
      lessonDate: d.lessonDate.toISOString(),
      sessionTime: d.sessionTime || undefined,
      subject: d.subject,
      chapterTitle: d.chapterTitle,
      conceptsTaught: d.conceptsTaught,
      learningObjectives: d.learningObjectives || undefined,
      teachingMethods: d.teachingMethods || undefined,
      durationMinutes: d.durationMinutes,
      homeworkAssigned: d.homeworkAssigned || undefined,
      referenceLinks: d.referenceLinks,
      attachmentUrl: d.attachmentUrl || undefined,
      followUpPlan: d.followUpPlan || undefined,
      status: d.status as any,
      audience: d.audience as any,
      isCovered: d.isCovered,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  async getTeachingDiaryOverview(instituteId: string): Promise<TeachingDiaryOverview> {
    assertDb(this.prisma);
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const diaries = await this.prisma.dailyTeachingDiary.findMany({
      where: {
        instituteId,
        lessonDate: { gte: firstDayOfMonth },
      },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        faculty: { select: { id: true, fullName: true } },
      },
      orderBy: { lessonDate: 'desc' },
    });

    const uniqueBatches = new Set(diaries.map((d) => d.batchId));
    const uniqueFaculty = new Set(diaries.map((d) => d.facultyId));
    const subjectCoverageMap: Record<string, number> = {};

    diaries.forEach((d) => {
      subjectCoverageMap[d.subject] = (subjectCoverageMap[d.subject] || 0) + 1;
    });

    const recentEntries = diaries.slice(0, 10).map((d) => ({
      id: d.id,
      instituteId: d.instituteId,
      batchId: d.batchId,
      batchName: d.batch.name,
      batchCode: d.batch.code,
      facultyId: d.facultyId,
      facultyName: d.faculty.fullName,
      lessonDate: d.lessonDate.toISOString(),
      sessionTime: d.sessionTime || undefined,
      subject: d.subject,
      chapterTitle: d.chapterTitle,
      conceptsTaught: d.conceptsTaught,
      learningObjectives: d.learningObjectives || undefined,
      teachingMethods: d.teachingMethods || undefined,
      durationMinutes: d.durationMinutes,
      homeworkAssigned: d.homeworkAssigned || undefined,
      referenceLinks: d.referenceLinks,
      attachmentUrl: d.attachmentUrl || undefined,
      followUpPlan: d.followUpPlan || undefined,
      status: d.status as any,
      audience: d.audience as any,
      isCovered: d.isCovered,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    return {
      totalEntriesThisMonth: diaries.length,
      batchesCovered: uniqueBatches.size,
      activeFacultyCount: uniqueFaculty.size,
      recentEntries,
      subjectCoverageMap,
    };
  }

  async createTeachingDiary(
    user: AuthenticatedUser,
    dto: CreateTeachingDiaryDto,
  ): Promise<DailyTeachingDiaryEntry> {
    assertDb(this.prisma);
    const instituteId = user.instituteId;
    const facultyUserId = user.id;
    // 404 for other tenants, 403 for batches the caller neither leads nor is assigned to.
    await this.access.assertBatchAccess(user, dto.batchId);
    const lessonDate = parseDate(dto.lessonDate, 'lessonDate');

    const diary = await this.prisma.dailyTeachingDiary.create({
      data: {
        instituteId,
        batchId: dto.batchId,
        facultyId: facultyUserId,
        lessonDate,
        sessionTime: dto.sessionTime,
        subject: dto.subject,
        chapterTitle: dto.chapterTitle,
        conceptsTaught: dto.conceptsTaught,
        learningObjectives: dto.learningObjectives,
        teachingMethods: dto.teachingMethods || 'LECTURE',
        durationMinutes: dto.durationMinutes || 60,
        homeworkAssigned: dto.homeworkAssigned,
        referenceLinks: dto.referenceLinks || [],
        attachmentUrl: dto.attachmentUrl,
        followUpPlan: dto.followUpPlan,
        status: dto.status || 'PUBLISHED',
        audience: dto.audience || 'BATCH',
      },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        faculty: { select: { id: true, fullName: true } },
      },
    });

    return {
      id: diary.id,
      instituteId: diary.instituteId,
      batchId: diary.batchId,
      batchName: diary.batch.name,
      batchCode: diary.batch.code,
      facultyId: diary.facultyId,
      facultyName: diary.faculty.fullName,
      lessonDate: diary.lessonDate.toISOString(),
      sessionTime: diary.sessionTime || undefined,
      subject: diary.subject,
      chapterTitle: diary.chapterTitle,
      conceptsTaught: diary.conceptsTaught,
      learningObjectives: diary.learningObjectives || undefined,
      teachingMethods: diary.teachingMethods || undefined,
      durationMinutes: diary.durationMinutes,
      homeworkAssigned: diary.homeworkAssigned || undefined,
      referenceLinks: diary.referenceLinks,
      attachmentUrl: diary.attachmentUrl || undefined,
      followUpPlan: diary.followUpPlan || undefined,
      status: diary.status as any,
      audience: diary.audience as any,
      isCovered: diary.isCovered,
      createdAt: diary.createdAt.toISOString(),
      updatedAt: diary.updatedAt.toISOString(),
    };
  }

  async updateTeachingDiary(
    instituteId: string,
    diaryId: string,
    user: AuthenticatedUser,
    dto: UpdateTeachingDiaryDto,
  ): Promise<DailyTeachingDiaryEntry> {
    assertDb(this.prisma);
    const existing = await this.prisma.dailyTeachingDiary.findUnique({
      where: { id: diaryId },
    });

    if (!existing || existing.instituteId !== instituteId) {
      throw new NotFoundException(`Teaching diary entry ${diaryId} not found.`);
    }

    if (
      user.role === 'TEACHER' &&
      existing.facultyId !== user.id
    ) {
      throw new ForbiddenException('You can only edit your own teaching diary entries.');
    }

    const updated = await this.prisma.dailyTeachingDiary.update({
      where: { id: diaryId },
      data: {
        ...(dto.lessonDate ? { lessonDate: new Date(dto.lessonDate) } : {}),
        ...(dto.sessionTime !== undefined ? { sessionTime: dto.sessionTime } : {}),
        ...(dto.subject ? { subject: dto.subject } : {}),
        ...(dto.chapterTitle ? { chapterTitle: dto.chapterTitle } : {}),
        ...(dto.conceptsTaught ? { conceptsTaught: dto.conceptsTaught } : {}),
        ...(dto.learningObjectives !== undefined ? { learningObjectives: dto.learningObjectives } : {}),
        ...(dto.teachingMethods ? { teachingMethods: dto.teachingMethods } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
        ...(dto.homeworkAssigned !== undefined ? { homeworkAssigned: dto.homeworkAssigned } : {}),
        ...(dto.referenceLinks ? { referenceLinks: dto.referenceLinks } : {}),
        ...(dto.attachmentUrl !== undefined ? { attachmentUrl: dto.attachmentUrl } : {}),
        ...(dto.followUpPlan !== undefined ? { followUpPlan: dto.followUpPlan } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.audience ? { audience: dto.audience } : {}),
      },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        faculty: { select: { id: true, fullName: true } },
      },
    });

    return {
      id: updated.id,
      instituteId: updated.instituteId,
      batchId: updated.batchId,
      batchName: updated.batch.name,
      batchCode: updated.batch.code,
      facultyId: updated.facultyId,
      facultyName: updated.faculty.fullName,
      lessonDate: updated.lessonDate.toISOString(),
      sessionTime: updated.sessionTime || undefined,
      subject: updated.subject,
      chapterTitle: updated.chapterTitle,
      conceptsTaught: updated.conceptsTaught,
      learningObjectives: updated.learningObjectives || undefined,
      teachingMethods: updated.teachingMethods || undefined,
      durationMinutes: updated.durationMinutes,
      homeworkAssigned: updated.homeworkAssigned || undefined,
      referenceLinks: updated.referenceLinks,
      attachmentUrl: updated.attachmentUrl || undefined,
      followUpPlan: updated.followUpPlan || undefined,
      status: updated.status as any,
      audience: updated.audience as any,
      isCovered: updated.isCovered,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ==========================================================================
  // 6. STUDY MATERIAL & NOTES
  // ==========================================================================

  async getStudyMaterials(
    user: AuthenticatedUser,
    batchId?: string,
  ): Promise<StudyMaterialItem[]> {
    assertDb(this.prisma);
    const instituteId = user.instituteId;
    const scope = await this.access.staffBatchIds(user);
    if (batchId) await this.access.assertBatchAccess(user, batchId);
    const materials = await this.prisma.studyMaterial.findMany({
      take: 200,
      where: {
        instituteId,
        ...(batchId ? { batchId } : scope !== null ? { batchId: { in: scope } } : {}),
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
      category: m.category as any,
      subject: m.subject,
      chapter: m.chapter || undefined,
      content: m.content || undefined,
      fileUrl: m.fileUrl || undefined,
      fileName: m.fileName || undefined,
      fileSize: m.fileSize || undefined,
      status: m.status as any,
      isStudentVisible: m.isStudentVisible,
      downloadCount: m.downloadCount,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  }

  async getStudentStudyMaterials(
    user: AuthenticatedUser,
    batchId?: string,
  ): Promise<StudyMaterialItem[]> {
    assertDb(this.prisma);
    const enrolledBatchIds = await this.access.studentBatchIds(user);
    // A student only ever sees materials of batches they are actively enrolled in; none -> empty list.
    if (enrolledBatchIds.length === 0 || (batchId && !enrolledBatchIds.includes(batchId))) return [];

    const materials = await this.prisma.studyMaterial.findMany({
      take: 200,
      where: {
        instituteId: user.instituteId,
        isStudentVisible: true,
        status: 'PUBLISHED',
        batchId: batchId ? batchId : { in: enrolledBatchIds },
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
      category: m.category as any,
      subject: m.subject,
      chapter: m.chapter || undefined,
      content: m.content || undefined,
      fileUrl: m.fileUrl || undefined,
      fileName: m.fileName || undefined,
      fileSize: m.fileSize || undefined,
      status: m.status as any,
      isStudentVisible: m.isStudentVisible,
      downloadCount: m.downloadCount,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  }

  async createStudyMaterial(
    user: AuthenticatedUser,
    dto: CreateStudyMaterialDto,
  ): Promise<StudyMaterialItem> {
    assertDb(this.prisma);
    const instituteId = user.instituteId;
    const facultyUserId = user.id;
    await this.access.assertBatchAccess(user, dto.batchId);

    const created = await this.prisma.studyMaterial.create({
      data: {
        instituteId,
        batchId: dto.batchId,
        facultyId: facultyUserId,
        title: dto.title,
        category: dto.category,
        subject: dto.subject,
        chapter: dto.chapter,
        content: dto.content,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        status: dto.status || 'PUBLISHED',
        isStudentVisible: dto.isStudentVisible ?? true,
      },
      include: {
        batch: { select: { id: true, name: true } },
        faculty: { select: { id: true, fullName: true } },
      },
    });

    return {
      id: created.id,
      instituteId: created.instituteId,
      batchId: created.batchId,
      batchName: created.batch.name,
      facultyId: created.facultyId,
      facultyName: created.faculty.fullName,
      title: created.title,
      category: created.category as any,
      subject: created.subject,
      chapter: created.chapter || undefined,
      content: created.content || undefined,
      fileUrl: created.fileUrl || undefined,
      fileName: created.fileName || undefined,
      fileSize: created.fileSize || undefined,
      status: created.status as any,
      isStudentVisible: created.isStudentVisible,
      downloadCount: created.downloadCount,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async proxyMediaUpload(dto: MediaUploadProxyDto): Promise<{
    url: string;
    data: string;
    fileName: string;
    fileSize: string;
    rawSize: number;
    mediaType: string;
  }> {
    if (!dto.base64) {
      throw new BadRequestException('File base64 data is required.');
    }

    const buffer = Buffer.from(dto.base64, 'base64');
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB limit per media.dhyey.cc docs
    if (buffer.length > MAX_SIZE) {
      throw new BadRequestException('File exceeds the 20MB maximum allowed limit.');
    }
    if (buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty.');
    }

    // Clean filename: remove unsafe chars, keep extension
    const originalName = dto.fileName || 'document.pdf';
    const extMatch = originalName.match(/\.[0-9a-z]+$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '.bin';
    const baseName = originalName.replace(/\.[0-9a-z]+$/i, '');
    const cleanBase =
      baseName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') || 'file';
    const safeFilename = `${cleanBase}${ext}`;

    const mime = dto.mimeType || 'application/octet-stream';
    const blob = new Blob([buffer], { type: mime });
    const formData = new FormData();
    formData.append('file', blob, safeFilename);

    let lastError: Error | null = null;
    const WORKER_ENDPOINT = 'https://media-hosting.dhyeyp254.workers.dev/upload';

    const formatBytes = (bytes: number, decimals = 1): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Up to 3 attempts with exponential backoff & jitter
    for (let attempt = 1; attempt <= 3; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      try {
        const response = await fetch(WORKER_ENDPOINT, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Media worker returned HTTP ${response.status}: ${errText}`);
        }

        const json = await response.json();
        const uploadedUrl = json.data || json.url;
        if (!uploadedUrl) {
          throw new Error('Worker response did not include a valid data/url field.');
        }

        return {
          url: uploadedUrl,
          data: uploadedUrl,
          fileName: json.filename || safeFilename,
          fileSize: formatBytes(json.size || buffer.length),
          rawSize: json.size || buffer.length,
          mediaType: json.media_type || mime,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (attempt < 3) {
          const backoff = 1000 * Math.pow(2, attempt - 1) + Math.random() * 500;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    throw new BadRequestException(
      `Media upload proxy failed after 3 attempts: ${lastError?.message || 'Upstream service error'}`,
    );
  }

  // ==========================================================================
  // 7. STUDENT FEE MANAGEMENT
  // ==========================================================================

  async getFeeRecords(
    instituteId: string,
    batchId?: string,
    limit?: unknown,
  ): Promise<StudentFeeItem[]> {
    assertDb(this.prisma);
    const fees = await this.prisma.studentFeeRecord.findMany({
      where: {
        instituteId,
        ...(batchId ? { batchId } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            enrollments: {
              where: { instituteId },
              select: { rollNumber: true },
            },
          },
        },
        batch: { select: { id: true, name: true } },
        _count: {
          select: { reminders: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: clampLimit(limit, 200, 500),
    });

    return fees.map((f) => ({
      id: f.id,
      instituteId: f.instituteId,
      studentId: f.studentId,
      studentName: f.student.fullName,
      rollNumber: f.student.enrollments[0]?.rollNumber || 'N/A',
      batchId: f.batchId || undefined,
      batchName: f.batch?.name || undefined,
      feeTitle: f.feeTitle,
      totalAmount: f.totalAmount,
      paidAmount: f.paidAmount,
      balanceDue: Math.max(0, f.totalAmount - f.paidAmount),
      dueDate: f.dueDate.toISOString(),
      status: f.status as any,
      academicYear: f.academicYear || '',
      reminderCount: f._count.reminders,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async getFeeSummary(instituteId: string): Promise<FeeSummaryOverview> {
    assertDb(this.prisma);
    const fees = await this.prisma.studentFeeRecord.findMany({
      where: { instituteId },
      select: { totalAmount: true, paidAmount: true, status: true, dueDate: true },
      take: 10000,
    });

    let totalReceivable = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    const now = new Date();

    fees.forEach((f) => {
      totalReceivable += f.totalAmount;
      totalCollected += f.paidAmount;
      if (f.status === 'OVERDUE' || (f.paidAmount < f.totalAmount && f.dueDate < now)) {
        overdueCount++;
      }
    });

    const remindersCount = await this.prisma.studentFeeReminder.count({
      where: {
        feeRecord: { instituteId },
      },
    });

    return {
      totalReceivable,
      totalCollected,
      totalPending: Math.max(0, totalReceivable - totalCollected),
      overdueCount,
      remindersSentThisMonth: remindersCount,
    };
  }

  async createFeeRecord(
    instituteId: string,
    dto: CreateStudentFeeRecordDto,
  ): Promise<StudentFeeItem> {
    assertDb(this.prisma);

    if (dto.batchId) {
      const batch = await this.prisma.batch.findFirst({ where: { id: dto.batchId, instituteId }, select: { id: true } });
      if (!batch) throw new NotFoundException(`Batch with ID ${dto.batchId} not found.`);
    }
    // The student must be an active STUDENT of this institute (never a user of another tenant).
    const studentMembership = await this.prisma.instituteMembership.findFirst({
      where: { instituteId, userId: dto.studentId, role: 'STUDENT', status: 'ACTIVE' },
      select: { id: true },
    });
    if (!studentMembership) throw new NotFoundException('Student not found in this institute.');
    if (!(dto.totalAmount > 0) || (dto.paidAmount ?? 0) < 0 || (dto.paidAmount ?? 0) > dto.totalAmount) {
      throw new BadRequestException('Fee amounts are invalid.');
    }

    const created = await this.prisma.studentFeeRecord.create({
      data: {
        instituteId,
        studentId: dto.studentId,
        batchId: dto.batchId,
        feeTitle: dto.feeTitle,
        totalAmount: dto.totalAmount,
        paidAmount: dto.paidAmount || 0,
        dueDate: parseDate(dto.dueDate, 'dueDate'),
        status: (dto.paidAmount || 0) >= dto.totalAmount ? 'PAID' : (dto.paidAmount || 0) > 0 ? 'PARTIAL' : 'PENDING',
        academicYear: dto.academicYear || '2026-2027',
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            enrollments: {
              where: { instituteId },
              select: { rollNumber: true },
            },
          },
        },
        batch: { select: { id: true, name: true } },
      },
    });

    return {
      id: created.id,
      instituteId: created.instituteId,
      studentId: created.studentId,
      studentName: created.student.fullName,
      rollNumber: created.student.enrollments[0]?.rollNumber || 'N/A',
      batchId: created.batchId || undefined,
      batchName: created.batch?.name || undefined,
      feeTitle: created.feeTitle,
      totalAmount: created.totalAmount,
      paidAmount: created.paidAmount,
      balanceDue: Math.max(0, created.totalAmount - created.paidAmount),
      dueDate: created.dueDate.toISOString(),
      status: created.status as any,
      academicYear: created.academicYear || '2026-2027',
      reminderCount: 0,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async dispatchFeeReminder(
    instituteId: string,
    senderUserId: string,
    dto: DispatchFeeReminderDto,
  ): Promise<{ success: boolean; message: string; reminderId: string }> {
    assertDb(this.prisma);
    const fee = await this.prisma.studentFeeRecord.findUnique({
      where: { id: dto.feeRecordId },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!fee || fee.instituteId !== instituteId) {
      throw new NotFoundException(`Fee record ${dto.feeRecordId} not found.`);
    }

    const balance = Math.max(0, fee.totalAmount - fee.paidAmount);
    const defaultMsg = `Dear ${fee.student.fullName}, your tuition fee installment for "${fee.feeTitle}" (Balance: ₹${balance.toLocaleString()}) was due on ${fee.dueDate.toLocaleDateString()}. Please clear at earliest convenience.`;
    const message = dto.customMessage || defaultMsg;

    const dedupeKey = `${dto.channel}:${new Date().toISOString().slice(0, 10)}`;

    if (this.prisma.studentFeeReminder?.findUnique) {
      const existingReminder = await this.prisma.studentFeeReminder.findUnique({
        where: {
          feeRecordId_dedupeKey: {
            feeRecordId: fee.id,
            dedupeKey,
          },
        },
      });
      if (existingReminder) {
        throw new ConflictException(`A reminder via ${dto.channel} has already been dispatched today for this fee record.`);
      }
    }

    const reminderStatus = dto.channel === 'IN_APP' ? 'DELIVERED' : 'RECORDED';

    const performCreate = async (tx: any) => {
      const created = await tx.studentFeeReminder.create({
        data: {
          feeRecordId: fee.id,
          studentId: fee.studentId,
          channel: dto.channel,
          message,
          status: reminderStatus,
          sentById: senderUserId,
          dedupeKey,
        },
      });

      if (dto.channel === 'IN_APP' && tx.notification?.create) {
        await tx.notification.create({
          data: {
            instituteId,
            userId: fee.studentId,
            title: 'Fee Payment Reminder',
            message,
            type: 'FEE_REMINDER',
            link: '/student/fees',
          },
        });
      }

      return created;
    };

    const reminder = this.prisma.$transaction
      ? await this.prisma.$transaction(performCreate)
      : await performCreate(this.prisma);

    return {
      success: true,
      message: `Reminder sent successfully via ${dto.channel} to ${fee.student.fullName}`,
      reminderId: reminder.id,
    };
  }
}
