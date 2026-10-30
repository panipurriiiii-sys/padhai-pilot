import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
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

@Injectable()
export class TuitionService {
    private memProfile: TuitionBrandingProfile;
  private memFaculties: FacultyMember[];
  private memSalaries: SalaryStatementItem[];
  private memLeaves: FacultyLeaveItem[];
  private memDiaries: DailyTeachingDiaryEntry[];
  private memMaterials: StudyMaterialItem[];
  private memFees: StudentFeeItem[];

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    this.memProfile = {
      id: 'inst_apex_academy',
      name: 'Apex IIT-JEE & Medical Academy',
      slug: 'apex-academy',
      logoUrl: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=128&q=80',
      primaryColor: '#1677FF',
      address: 'Plot 42, Knowledge Park III, Silicon Corridor, Pune - 411045',
      contactPhone: '+91 98230 45678',
      contactEmail: 'admissions@apexacademy.edu.in',
      website: 'https://apexacademy.edu.in',
      description: 'Premier coaching institute specialized in JEE Advanced, NEET-UG, and National Olympiad foundations with 14+ years of academic excellence.',
      footerText: 'PadhaiPilot Verified Tuition Institute — ISO 9001:2015 Certified Coaching Center',
      signatoryName: 'Dr. Anand K. Kulkarni',
      signatoryTitle: 'Founder & Academic Director',
      academicYear: '2026-2027',
      ownerId: 'usr_owner_01',
      totalStudents: 84,
      totalFaculty: 3,
      totalBatches: 3,
    };

    this.memFaculties = [
      {
        id: 'fac_01',
        userId: 'usr_teacher_sharma',
        staffId: 'FAC-101',
        fullName: 'Prof. Rajesh Sharma',
        email: 'teacher@padhaipilot.com',
        phone: '+91 98220 11223',
        designation: 'Senior Faculty & HOD Mathematics',
        employmentStatus: 'ACTIVE',
        compensationType: 'FIXED_MONTHLY',
        baseSalary: 75000,
        hourlyRate: 0,
        joiningDate: '2023-06-01T00:00:00.000Z',
        assignedSubjects: ['Mathematics', 'Advanced Calculus', 'Vectors & 3D'],
        delegatedPermissions: ['MANAGE_ATTENDANCE', 'MANAGE_MARKS', 'PUBLISH_DIARY', 'MANAGE_TIMETABLE'],
        assignedBatchesCount: 2,
        weeklyLectureCount: 12,
        assignedBatches: [
          { id: 'btc_jee_math_adv', name: 'JEE Advanced — Mathematics Alpha', code: 'JEE-MTH-ADV', subject: 'Higher Calculus & Vectors', gradeLevel: 'Class 12' },
          { id: 'btc_olympiad_math', name: 'Olympiad Foundation Mathematics', code: 'OLY-MTH-10', subject: 'Number Theory & Combinatorics', gradeLevel: 'Class 10' },
        ],
        emergencyContact: '+91 98220 99887 (Spouse)',
      },
      {
        id: 'fac_02',
        userId: 'usr_fac_verma',
        staffId: 'FAC-102',
        fullName: 'Dr. Sunita Verma',
        email: 'sunita.verma@apexacademy.edu.in',
        phone: '+91 98221 44556',
        designation: 'Associate Professor, Physics',
        employmentStatus: 'ACTIVE',
        compensationType: 'FIXED_MONTHLY',
        baseSalary: 68000,
        hourlyRate: 0,
        joiningDate: '2024-01-15T00:00:00.000Z',
        assignedSubjects: ['Physics', 'Thermodynamics', 'Electrodynamics'],
        delegatedPermissions: ['MANAGE_ATTENDANCE', 'MANAGE_MARKS', 'PUBLISH_DIARY'],
        assignedBatchesCount: 1,
        weeklyLectureCount: 8,
        assignedBatches: [
          { id: 'btc_neet_physics_core', name: 'Class 11 — Physics Core Batch', code: 'PHY-11-CORE', subject: 'Mechanics & Thermodynamics', gradeLevel: 'Class 11' },
        ],
        emergencyContact: '+91 98221 00112 (Brother)',
      },
      {
        id: 'fac_03',
        userId: 'usr_fac_mehta',
        staffId: 'FAC-103',
        fullName: 'Vikram Mehta',
        email: 'vikram.mehta@apexacademy.edu.in',
        phone: '+91 98223 77889',
        designation: 'Visiting Specialist, Organic Chemistry',
        employmentStatus: 'ACTIVE',
        compensationType: 'HOURLY_PER_CLASS',
        baseSalary: 0,
        hourlyRate: 1500,
        joiningDate: '2024-07-01T00:00:00.000Z',
        assignedSubjects: ['Organic Chemistry', 'Stereochemistry'],
        delegatedPermissions: ['MANAGE_ATTENDANCE', 'PUBLISH_DIARY'],
        assignedBatchesCount: 1,
        weeklyLectureCount: 6,
        emergencyContact: '+91 98223 11223 (Father)',
      },
    ];

    this.memSalaries = [
      {
        id: 'sal_rec_01',
        instituteId: 'inst_apex_academy',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        staffId: 'FAC-101',
        designation: 'Senior Faculty & HOD Mathematics',
        payPeriod: '2026-10',
        compensationModel: 'FIXED_MONTHLY',
        classesConducted: 26,
        baseAmount: 75000,
        additions: 5000,
        deductions: 2500,
        advances: 0,
        netPayable: 77500,
        status: 'APPROVED',
        createdAt: '2026-10-25T10:00:00.000Z',
        updatedAt: '2026-10-27T14:30:00.000Z',
        remarks: 'Includes special Sunday Advanced problem-solving bonus',
      },
      {
        id: 'sal_rec_02',
        instituteId: 'inst_apex_academy',
        facultyId: 'usr_fac_verma',
        facultyName: 'Dr. Sunita Verma',
        staffId: 'FAC-102',
        designation: 'Associate Professor, Physics',
        payPeriod: '2026-10',
        compensationModel: 'FIXED_MONTHLY',
        classesConducted: 22,
        baseAmount: 68000,
        additions: 2000,
        deductions: 2000,
        advances: 5000,
        netPayable: 63000,
        status: 'PAID',
        paymentDate: '2026-10-28T16:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: 'NEFT/HDFC/20261028/8877112',
        createdAt: '2026-10-25T10:00:00.000Z',
        updatedAt: '2026-10-28T16:00:00.000Z',
        remarks: 'Salary cleared via NEFT batch transfer',
      },
    ];

    this.memLeaves = [
      {
        id: 'leave_rec_01',
        instituteId: 'inst_apex_academy',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        staffId: 'FAC-101',
        leaveType: 'CASUAL',
        startDate: '2026-11-04T00:00:00.000Z',
        endDate: '2026-11-05T00:00:00.000Z',
        totalDays: 2,
        reason: 'Attending National Mathematics Teachers Symposium at IISc Bangalore.',
        status: 'PENDING',
        substituteFacultyId: 'usr_fac_verma',
        substituteFacultyName: 'Dr. Sunita Verma',
        createdAt: '2026-10-28T09:30:00.000Z',
      },
    ];

    this.memDiaries = [
      {
        id: 'diary_01',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        batchCode: 'JEE-MTH-ADV',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        lessonDate: '2026-10-29T00:00:00.000Z',
        sessionTime: '09:00 - 10:30',
        subject: 'Higher Calculus & Vectors',
        chapterTitle: 'Definite Integration & Leibniz Integral Rule',
        conceptsTaught: 'Properties of definite integrals, Leibniz differentiation under integral sign, and symmetric bounds.',
        learningObjectives: 'Students should master applying Leibniz theorem to multi-step JEE Advanced questions.',
        teachingMethods: 'Rigorous derivation followed by 4 live problem-solving models from past JEE Advanced papers.',
        durationMinutes: 90,
        homeworkAssigned: 'Solve Advanced DPP #14: Questions 1 to 18; verify symmetric bounds.',
        referenceLinks: ['https://mathworld.wolfram.com/LeibnizIntegralRule.html'],
        followUpPlan: 'Evaluate double integrals & area under curves in next lecture.',
        status: 'PUBLISHED',
        audience: 'BATCH',
        isCovered: true,
        createdAt: '2026-10-29T10:45:00.000Z',
        updatedAt: '2026-10-29T10:45:00.000Z',
      },
    ];

    this.memMaterials = [
      {
        id: 'mat_01',
        instituteId: 'inst_apex_academy',
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        title: 'Definite Integrals — Comprehensive Theory & 50 Solved JEE Advanced Models',
        category: 'CHAPTER_NOTES',
        subject: 'Higher Calculus & Vectors',
        chapter: 'Definite Integration',
        content: 'Complete analytical notes covering King property, Queen property, Leibniz integral rule, and Walli formula.',
        fileUrl: 'https://assets.padhaipilot.com/notes/math_adv_definite_integrals.pdf',
        fileName: 'Definite_Integrals_JEE_Adv_Notes.pdf',
        fileSize: '3.8 MB',
        status: 'PUBLISHED',
        isStudentVisible: true,
        downloadCount: 68,
        createdAt: '2026-10-28T10:00:00.000Z',
        updatedAt: '2026-10-28T10:00:00.000Z',
      },
    ];

    this.memFees = [
      {
        id: 'fee_rec_01',
        instituteId: 'inst_apex_academy',
        studentId: 'usr_std_01',
        studentName: 'Aarav Patel',
        rollNumber: 'JEE-26-001',
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        feeTitle: 'Term 2 Tuition & Test Series Fee',
        totalAmount: 35000,
        paidAmount: 20000,
        balanceDue: 15000,
        dueDate: '2026-10-15T00:00:00.000Z',
        status: 'OVERDUE',
        academicYear: '2026-2027',
        lastReminderSentAt: '2026-10-26T11:00:00.000Z',
        reminderCount: 2,
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ];
  }



  // ==========================================================================
  // 1. TUITION PROFILE & BRANDING
  // ==========================================================================

  async getBrandingProfile(instituteId: string): Promise<TuitionBrandingProfile> {
    if (!this.prisma.isConnected) return this.memGetBrandingProfile(instituteId);
    let institute = await this.prisma.institute.findUnique({
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
      if (instituteId === 'inst_apex_academy' && this.prisma.isConnected) {
        try {
          institute = await this.prisma.institute.create({
            data: {
              id: instituteId,
              name: this.memProfile.name || 'Apex IIT-JEE & Medical Academy',
              slug: 'apex-academy',
              logoUrl: this.memProfile.logoUrl,
              primaryColor: this.memProfile.primaryColor || '#1677FF',
              address: this.memProfile.address,
              contactPhone: this.memProfile.contactPhone,
              contactEmail: this.memProfile.contactEmail,
              website: this.memProfile.website,
              description: this.memProfile.description,
              footerText: this.memProfile.footerText,
              signatoryName: this.memProfile.signatoryName,
              signatoryTitle: this.memProfile.signatoryTitle,
              academicYear: this.memProfile.academicYear || '2026-2027',
            },
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
        } catch {
          // ignore error
        }
      }
      if (!institute) {
        throw new NotFoundException(`Institute with ID ${instituteId} not found.`);
      }
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
    if (!this.prisma.isConnected) return this.memUpdateBrandingProfile(instituteId, dto);
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
    if (!this.prisma.isConnected) return this.memGetFaculties(instituteId);
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
      weeklyLectureCount: p.user.teacherBatches.length * 4, // 4 periods per batch heuristic
      emergencyContact: p.emergencyContact || undefined,
    }));
  }

  async createFaculty(instituteId: string, dto: CreateFacultyDto): Promise<FacultyMember> {
    if (!this.prisma.isConnected) return this.memCreateFaculty(instituteId, dto);
    // Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          fullName: dto.fullName,
          phone: dto.phone,
          passwordHash: '$2b$10$epOzJ9GvP2uC7P5vS89tquPqfR8LqK4nNsm6oKj3F8B3h0O1vjY7i', // Temporary placeholder
          role: 'TEACHER',
        },
      });
    }

    // Ensure InstituteMembership exists
    await this.prisma.instituteMembership.upsert({
      where: {
        instituteId_userId: {
          instituteId,
          userId: user.id,
        },
      },
      update: { role: 'TEACHER' },
      create: {
        instituteId,
        userId: user.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

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
    if (!this.prisma.isConnected) return this.memUpdateFaculty(instituteId, facultyId, dto);
    const profile = await this.prisma.facultyProfile.findUnique({
      where: { id: facultyId },
      include: { user: true },
    });

    if (!profile || profile.instituteId !== instituteId) {
      throw new NotFoundException(`Faculty profile ${facultyId} not found.`);
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
    if (!this.prisma.isConnected) return this.memGetSalaryRecords(instituteId, payPeriod, facultyId);
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
    if (!this.prisma.isConnected) return this.memGenerateSalaryRecord(instituteId, dto);
    const additions = dto.additions || 0;
    const deductions = dto.deductions || 0;
    const advances = dto.advances || 0;
    const netPayable = Math.max(0, dto.baseAmount + additions - deductions - advances);

    const record = await this.prisma.salaryRecord.upsert({
      where: {
        instituteId_facultyId_payPeriod: {
          instituteId,
          facultyId: dto.facultyId,
          payPeriod: dto.payPeriod,
        },
      },
      update: {
        compensationModel: dto.compensationModel,
        classesConducted: dto.classesConducted || 0,
        baseAmount: dto.baseAmount,
        additions,
        deductions,
        advances,
        netPayable,
        remarks: dto.remarks,
      },
      create: {
        instituteId,
        facultyId: dto.facultyId,
        payPeriod: dto.payPeriod,
        compensationModel: dto.compensationModel,
        classesConducted: dto.classesConducted || 0,
        baseAmount: dto.baseAmount,
        additions,
        deductions,
        advances,
        netPayable,
        remarks: dto.remarks,
        status: 'DRAFT',
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
    });

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
    if (!this.prisma.isConnected) return this.memRecordSalaryPayment(instituteId, salaryRecordId, dto);
    const existing = await this.prisma.salaryRecord.findUnique({
      where: { id: salaryRecordId },
    });

    if (!existing || existing.instituteId !== instituteId) {
      throw new NotFoundException(`Salary record ${salaryRecordId} not found.`);
    }

    const updated = await this.prisma.salaryRecord.update({
      where: { id: salaryRecordId },
      data: {
        status: 'PAID',
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        paymentDate: new Date(dto.paymentDate),
        remarks: dto.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}${dto.remarks}` : existing.remarks,
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
  // 4. FACULTY LEAVE MANAGEMENT
  // ==========================================================================

  async getLeaveApplications(
    instituteId: string,
    facultyId?: string,
  ): Promise<FacultyLeaveItem[]> {
    if (!this.prisma.isConnected) return this.memGetLeaveApplications(instituteId, facultyId);
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
    if (!this.prisma.isConnected) return this.memApplyLeave(instituteId, facultyUserId, dto);
    if (dto.totalDays <= 0) {
      throw new BadRequestException('Leave total days must be greater than zero.');
    }

    const leave = await this.prisma.facultyLeaveApplication.create({
      data: {
        instituteId,
        facultyId: facultyUserId,
        leaveType: dto.leaveType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
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
    if (!this.prisma.isConnected) return this.memReviewLeave(instituteId, leaveId, reviewer, dto);
    const leave = await this.prisma.facultyLeaveApplication.findUnique({
      where: { id: leaveId },
    });

    if (!leave || leave.instituteId !== instituteId) {
      throw new NotFoundException(`Leave application ${leaveId} not found.`);
    }

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
    instituteId: string,
    batchId?: string,
    facultyId?: string,
  ): Promise<DailyTeachingDiaryEntry[]> {
    if (!this.prisma.isConnected) return this.memGetTeachingDiaries(instituteId, batchId, facultyId);
    const diaries = await this.prisma.dailyTeachingDiary.findMany({
      where: {
        instituteId,
        ...(batchId ? { batchId } : {}),
        ...(facultyId ? { facultyId } : {}),
      },
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
    if (!this.prisma.isConnected) return this.memGetTeachingDiaryOverview(instituteId);
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
    instituteId: string,
    facultyUserId: string,
    dto: CreateTeachingDiaryDto,
  ): Promise<DailyTeachingDiaryEntry> {
    if (!this.prisma.isConnected) return this.memCreateTeachingDiary(instituteId, facultyUserId, dto);
    const diary = await this.prisma.dailyTeachingDiary.create({
      data: {
        instituteId,
        batchId: dto.batchId,
        facultyId: facultyUserId,
        lessonDate: new Date(dto.lessonDate),
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
    if (!this.prisma.isConnected) return this.memUpdateTeachingDiary(instituteId, diaryId, user, dto);
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
    instituteId: string,
    batchId?: string,
  ): Promise<StudyMaterialItem[]> {
    if (!this.prisma.isConnected) return this.memGetStudyMaterials(instituteId, batchId);
    const materials = await this.prisma.studyMaterial.findMany({
      where: {
        instituteId,
        ...(batchId ? { batchId } : {}),
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
    if (!this.prisma.isConnected) {
      return this.memMaterials.filter((m) => {
        if (!m.isStudentVisible || m.status !== 'PUBLISHED') return false;
        if (batchId && m.batchId !== batchId) return false;
        return true;
      });
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: user.id,
        instituteId: user.instituteId,
      },
      select: { batchId: true },
    });
    const enrolledBatchIds = enrollments.map((e) => e.batchId);

    const materials = await this.prisma.studyMaterial.findMany({
      where: {
        instituteId: user.instituteId,
        isStudentVisible: true,
        status: 'PUBLISHED',
        ...(batchId
          ? { batchId }
          : enrolledBatchIds.length > 0
            ? { batchId: { in: enrolledBatchIds } }
            : {}),
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
    instituteId: string,
    facultyUserId: string,
    dto: CreateStudyMaterialDto,
  ): Promise<StudyMaterialItem> {
    if (!this.prisma.isConnected) return this.memCreateStudyMaterial(instituteId, facultyUserId, dto);
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

  // ==========================================================================
  // 7. STUDENT FEES & FEE REMINDERS
  // ==========================================================================

  async getFeeRecords(instituteId: string, batchId?: string): Promise<StudentFeeItem[]> {
    if (!this.prisma.isConnected) return this.memGetFeeRecords(instituteId, batchId);
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
        reminders: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { reminders: true },
        },
      },
      orderBy: { dueDate: 'asc' },
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
      academicYear: f.academicYear || '2026-2027',
      lastReminderSentAt: f.reminders[0]?.sentAt ? f.reminders[0].sentAt.toISOString() : undefined,
      reminderCount: f._count.reminders,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async getFeeSummary(instituteId: string): Promise<FeeSummaryOverview> {
    if (!this.prisma.isConnected) return this.memGetFeeSummary(instituteId);
    const fees = await this.prisma.studentFeeRecord.findMany({
      where: { instituteId },
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
    if (!this.prisma.isConnected) return this.memCreateFeeRecord(instituteId, dto);
    const created = await this.prisma.studentFeeRecord.create({
      data: {
        instituteId,
        studentId: dto.studentId,
        batchId: dto.batchId,
        feeTitle: dto.feeTitle,
        totalAmount: dto.totalAmount,
        paidAmount: dto.paidAmount || 0,
        dueDate: new Date(dto.dueDate),
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
    if (!this.prisma.isConnected) return this.memDispatchFeeReminder(instituteId, senderUserId, dto);
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

    const reminder = await this.prisma.studentFeeReminder.create({
      data: {
        feeRecordId: fee.id,
        studentId: fee.studentId,
        channel: dto.channel,
        message,
        status: 'SENT',
        sentById: senderUserId,
      },
    });

    return {
      success: true,
      message: `Reminder sent successfully via ${dto.channel} to ${fee.student.fullName}`,
      reminderId: reminder.id,
    };
  }


  // IN-MEMORY FALLBACK METHODS
  // ==========================================================================
  // 1. TUITION PROFILE & BRANDING
  // ==========================================================================

  private async memGetBrandingProfile(instituteId: string): Promise<TuitionBrandingProfile> {
    if (this.prisma.isConnected) {
      try {
        let institute = await this.prisma.institute.findUnique({
          where: { id: instituteId },
          include: {
            _count: {
              select: { facultyProfiles: true, batches: true, enrollments: true },
            },
          },
        });
        if (institute) {
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
      } catch {
        // Fall back to memory store
      }
    }
    return this.memProfile;
  }

  private async memUpdateBrandingProfile(
    instituteId: string,
    dto: UpdateTuitionProfileDto,
  ): Promise<TuitionBrandingProfile> {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.institute.update({
          where: { id: instituteId },
          data: { ...dto },
        });
        return this.getBrandingProfile(instituteId);
      } catch {
        // Fall back to memory store
      }
    }

    this.memProfile = {
      ...this.memProfile,
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
    };
    return this.memProfile;
  }

  // ==========================================================================
  // 2. FACULTY MANAGEMENT & WORKLOAD
  // ==========================================================================

  private async memGetFaculties(instituteId: string): Promise<FacultyMember[]> {
    if (this.prisma.isConnected) {
      try {
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
                  select: { id: true, name: true, code: true, subject: true, gradeLevel: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (profiles.length > 0) {
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
      } catch {
        // Fall back to memory store
      }
    }
    return this.memFaculties;
  }

  private async memCreateFaculty(instituteId: string, dto: CreateFacultyDto): Promise<FacultyMember> {
    const newMember: FacultyMember = {
      id: `fac_prof_${Date.now()}`,
      userId: `usr_fac_${Date.now()}`,
      staffId: dto.staffId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      designation: dto.designation,
      employmentStatus: 'ACTIVE',
      compensationType: dto.compensationType,
      baseSalary: dto.baseSalary,
      hourlyRate: dto.hourlyRate || 0,
      joiningDate: new Date().toISOString(),
      assignedSubjects: dto.assignedSubjects,
      delegatedPermissions: dto.delegatedPermissions || [],
      assignedBatchesCount: dto.batchIds?.length || 1,
      weeklyLectureCount: (dto.batchIds?.length || 1) * 4,
    };

    if (this.prisma.isConnected) {
      try {
        let user = await this.prisma.user.findUnique({
          where: { email: dto.email.toLowerCase().trim() },
        });
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email: dto.email.toLowerCase().trim(),
              fullName: dto.fullName,
              phone: dto.phone,
              passwordHash: '$2b$10$epOzJ9GvP2uC7P5vS89tquPqfR8LqK4nNsm6oKj3F8B3h0O1vjY7i',
              role: 'TEACHER',
            },
          });
        }
        await this.prisma.facultyProfile.create({
          data: {
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
      } catch {
        // Handled via memory
      }
    }

    this.memFaculties.unshift(newMember);
    return newMember;
  }

  private async memUpdateFaculty(
    instituteId: string,
    facultyId: string,
    dto: UpdateFacultyDto,
  ): Promise<FacultyMember> {
    const found = this.memFaculties.find((f) => f.id === facultyId);
    if (!found) throw new NotFoundException(`Faculty ${facultyId} not found`);
    const updated = { ...found, ...(dto as any) };
    this.memFaculties = this.memFaculties.map((f) => (f.id === facultyId ? updated : f));
    return updated;
  }

  // ==========================================================================
  // 3. SALARY & PAYROLL RECORDS
  // ==========================================================================

  private async memGetSalaryRecords(
    instituteId: string,
    payPeriod?: string,
    facultyId?: string,
  ): Promise<SalaryStatementItem[]> {
    let result = this.memSalaries;
    if (payPeriod) result = result.filter((s) => s.payPeriod === payPeriod);
    if (facultyId) result = result.filter((s) => s.facultyId === facultyId);
    return result;
  }

  private async memGenerateSalaryRecord(
    instituteId: string,
    dto: GenerateSalaryRecordDto,
  ): Promise<SalaryStatementItem> {
    const additions = dto.additions || 0;
    const deductions = dto.deductions || 0;
    const advances = dto.advances || 0;
    const netPayable = Math.max(0, dto.baseAmount + additions - deductions - advances);

    const faculty = this.memFaculties.find((f) => f.userId === dto.facultyId) || this.memFaculties[0];

    const record: SalaryStatementItem = {
      id: `sal_${Date.now()}`,
      instituteId,
      facultyId: dto.facultyId,
      facultyName: faculty.fullName,
      staffId: faculty.staffId,
      designation: faculty.designation,
      payPeriod: dto.payPeriod,
      compensationModel: dto.compensationModel,
      classesConducted: dto.classesConducted || 20,
      baseAmount: dto.baseAmount,
      additions,
      deductions,
      advances,
      netPayable,
      status: 'DRAFT',
      remarks: dto.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memSalaries = this.memSalaries.filter(
      (s) => !(s.facultyId === dto.facultyId && s.payPeriod === dto.payPeriod),
    );
    this.memSalaries.unshift(record);
    return record;
  }

  private async memRecordSalaryPayment(
    instituteId: string,
    salaryRecordId: string,
    dto: RecordPaymentDto,
  ): Promise<SalaryStatementItem> {
    const existing = this.memSalaries.find((s) => s.id === salaryRecordId);
    if (!existing) throw new NotFoundException(`Salary record ${salaryRecordId} not found`);

    const updated: SalaryStatementItem = {
      ...existing,
      status: 'PAID',
      paymentMethod: dto.paymentMethod,
      paymentReference: dto.paymentReference,
      paymentDate: dto.paymentDate,
      remarks: dto.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}${dto.remarks}` : existing.remarks,
      updatedAt: new Date().toISOString(),
    };

    this.memSalaries = this.memSalaries.map((s) => (s.id === salaryRecordId ? updated : s));
    return updated;
  }

  // ==========================================================================
  // 4. FACULTY LEAVE MANAGEMENT
  // ==========================================================================

  private async memGetLeaveApplications(
    instituteId: string,
    facultyId?: string,
  ): Promise<FacultyLeaveItem[]> {
    if (facultyId) {
      return this.memLeaves.filter((l) => l.facultyId === facultyId);
    }
    return this.memLeaves;
  }

  private async memApplyLeave(
    instituteId: string,
    facultyUserId: string,
    dto: ApplyFacultyLeaveDto,
  ): Promise<FacultyLeaveItem> {
    if (dto.totalDays <= 0) {
      throw new BadRequestException('Leave total days must be greater than zero.');
    }

    const faculty = this.memFaculties.find((f) => f.userId === facultyUserId) || this.memFaculties[0];
    const sub = this.memFaculties.find((f) => f.userId === dto.substituteFacultyId);

    const leave: FacultyLeaveItem = {
      id: `leave_${Date.now()}`,
      instituteId,
      facultyId: facultyUserId,
      facultyName: faculty.fullName,
      staffId: faculty.staffId,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays: dto.totalDays,
      reason: dto.reason,
      attachmentUrl: dto.attachmentUrl,
      status: 'PENDING',
      substituteFacultyId: dto.substituteFacultyId,
      substituteFacultyName: sub?.fullName,
      createdAt: new Date().toISOString(),
    };

    this.memLeaves.unshift(leave);
    return leave;
  }

  private async memReviewLeave(
    instituteId: string,
    leaveId: string,
    reviewer: AuthenticatedUser,
    dto: ReviewFacultyLeaveDto,
  ): Promise<FacultyLeaveItem> {
    const leave = this.memLeaves.find((l) => l.id === leaveId);
    if (!leave) throw new NotFoundException(`Leave ${leaveId} not found`);

    if (leave.facultyId === reviewer.id) {
      throw new BadRequestException('Faculty cannot review or approve their own leave application.');
    }

    const sub = this.memFaculties.find((f) => f.userId === dto.substituteFacultyId);

    const updated: FacultyLeaveItem = {
      ...leave,
      status: dto.status as any,
      reviewerRemarks: dto.reviewerRemarks,
      reviewedById: reviewer.id,
      reviewerName: reviewer.fullName,
      reviewedAt: new Date().toISOString(),
      substituteFacultyId: dto.substituteFacultyId || leave.substituteFacultyId,
      substituteFacultyName: sub?.fullName || leave.substituteFacultyName,
    };

    this.memLeaves = this.memLeaves.map((l) => (l.id === leaveId ? updated : l));
    return updated;
  }

  // ==========================================================================
  // 5. DAILY TEACHING DIARY (LESSON JOURNAL)
  // ==========================================================================

  private async memGetTeachingDiaries(
    instituteId: string,
    batchId?: string,
    facultyId?: string,
  ): Promise<DailyTeachingDiaryEntry[]> {
    let list = this.memDiaries;
    if (batchId) list = list.filter((d) => d.batchId === batchId);
    if (facultyId) list = list.filter((d) => d.facultyId === facultyId);
    return list;
  }

  private async memGetTeachingDiaryOverview(instituteId: string): Promise<TeachingDiaryOverview> {
    const subjectMap: Record<string, number> = {};
    this.memDiaries.forEach((d) => {
      subjectMap[d.subject] = (subjectMap[d.subject] || 0) + 1;
    });

    return {
      totalEntriesThisMonth: this.memDiaries.length,
      batchesCovered: new Set(this.memDiaries.map((d) => d.batchId)).size,
      activeFacultyCount: new Set(this.memDiaries.map((d) => d.facultyId)).size,
      recentEntries: this.memDiaries.slice(0, 10),
      subjectCoverageMap: subjectMap,
    };
  }

  private async memCreateTeachingDiary(
    instituteId: string,
    facultyUserId: string,
    dto: CreateTeachingDiaryDto,
  ): Promise<DailyTeachingDiaryEntry> {
    const faculty = this.memFaculties.find((f) => f.userId === facultyUserId) || this.memFaculties[0];
    const newEntry: DailyTeachingDiaryEntry = {
      id: `diary_${Date.now()}`,
      instituteId,
      batchId: dto.batchId,
      batchName: 'JEE Advanced — Mathematics Alpha',
      batchCode: 'JEE-MTH-ADV',
      facultyId: facultyUserId,
      facultyName: faculty.fullName,
      lessonDate: dto.lessonDate,
      sessionTime: dto.sessionTime || '09:00 - 10:30',
      subject: dto.subject,
      chapterTitle: dto.chapterTitle,
      conceptsTaught: dto.conceptsTaught,
      learningObjectives: dto.learningObjectives,
      teachingMethods: dto.teachingMethods || 'LECTURE',
      durationMinutes: dto.durationMinutes || 90,
      homeworkAssigned: dto.homeworkAssigned,
      referenceLinks: dto.referenceLinks || [],
      attachmentUrl: dto.attachmentUrl,
      followUpPlan: dto.followUpPlan,
      status: dto.status || 'PUBLISHED',
      audience: dto.audience || 'BATCH',
      isCovered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memDiaries.unshift(newEntry);
    return newEntry;
  }

  private async memUpdateTeachingDiary(
    instituteId: string,
    diaryId: string,
    user: AuthenticatedUser,
    dto: UpdateTeachingDiaryDto,
  ): Promise<DailyTeachingDiaryEntry> {
    const existing = this.memDiaries.find((d) => d.id === diaryId);
    if (!existing) throw new NotFoundException(`Teaching diary ${diaryId} not found`);

    if (user.role === 'TEACHER' && existing.facultyId !== user.id) {
      throw new ForbiddenException('You can only edit your own teaching diary entries.');
    }

    const updated: DailyTeachingDiaryEntry = {
      ...existing,
      ...(dto as any),
      updatedAt: new Date().toISOString(),
    };

    this.memDiaries = this.memDiaries.map((d) => (d.id === diaryId ? updated : d));
    return updated;
  }

  // ==========================================================================
  // 6. STUDY MATERIAL & NOTES
  // ==========================================================================

  private async memGetStudyMaterials(instituteId: string, batchId?: string): Promise<StudyMaterialItem[]> {
    if (batchId) {
      return this.memMaterials.filter((m) => m.batchId === batchId);
    }
    return this.memMaterials;
  }

  private async memCreateStudyMaterial(
    instituteId: string,
    facultyUserId: string,
    dto: CreateStudyMaterialDto,
  ): Promise<StudyMaterialItem> {
    const faculty = this.memFaculties.find((f) => f.userId === facultyUserId) || this.memFaculties[0];
    const created: StudyMaterialItem = {
      id: `mat_${Date.now()}`,
      instituteId,
      batchId: dto.batchId,
      batchName: 'JEE Advanced — Mathematics Alpha',
      facultyId: facultyUserId,
      facultyName: faculty.fullName,
      title: dto.title,
      category: dto.category,
      subject: dto.subject,
      chapter: dto.chapter,
      content: dto.content,
      fileUrl: dto.fileUrl || 'https://assets.padhaipilot.com/docs/sample.pdf',
      fileName: dto.fileName || `${dto.title.replace(/\s+/g, '_')}.pdf`,
      fileSize: dto.fileSize || '2.4 MB',
      status: dto.status || 'PUBLISHED',
      isStudentVisible: dto.isStudentVisible ?? true,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memMaterials.unshift(created);
    return created;
  }

  // ==========================================================================
  // 7. STUDENT FEES & FEE REMINDERS
  // ==========================================================================

  private async memGetFeeRecords(instituteId: string, batchId?: string): Promise<StudentFeeItem[]> {
    if (batchId) {
      return this.memFees.filter((f) => f.batchId === batchId);
    }
    return this.memFees;
  }

  private async memGetFeeSummary(instituteId: string): Promise<FeeSummaryOverview> {
    let totalReceivable = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    const now = new Date();

    this.memFees.forEach((f) => {
      totalReceivable += f.totalAmount;
      totalCollected += f.paidAmount;
      if (f.status === 'OVERDUE' || (f.balanceDue > 0 && new Date(f.dueDate) < now)) {
        overdueCount++;
      }
    });

    return {
      totalReceivable,
      totalCollected,
      totalPending: Math.max(0, totalReceivable - totalCollected),
      overdueCount,
      remindersSentThisMonth: 12,
    };
  }

  private async memCreateFeeRecord(
    instituteId: string,
    dto: CreateStudentFeeRecordDto,
  ): Promise<StudentFeeItem> {
    const created: StudentFeeItem = {
      id: `fee_${Date.now()}`,
      instituteId,
      studentId: dto.studentId,
      studentName: 'Student Name',
      rollNumber: 'JEE-26-099',
      batchId: dto.batchId,
      feeTitle: dto.feeTitle,
      totalAmount: dto.totalAmount,
      paidAmount: dto.paidAmount || 0,
      balanceDue: Math.max(0, dto.totalAmount - (dto.paidAmount || 0)),
      dueDate: dto.dueDate,
      status: (dto.paidAmount || 0) >= dto.totalAmount ? 'PAID' : (dto.paidAmount || 0) > 0 ? 'PARTIAL' : 'PENDING',
      academicYear: dto.academicYear || '2026-2027',
      reminderCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.memFees.unshift(created);
    return created;
  }

  private async memDispatchFeeReminder(
    instituteId: string,
    senderUserId: string,
    dto: DispatchFeeReminderDto,
  ): Promise<{ success: boolean; message: string; reminderId: string }> {
    const fee = this.memFees.find((f) => f.id === dto.feeRecordId);
    const studentName = fee ? fee.studentName : 'Student';
    return {
      success: true,
      message: `Reminder sent successfully via ${dto.channel} to ${studentName}`,
      reminderId: `rem_${Date.now()}`,
    };
  }
}
