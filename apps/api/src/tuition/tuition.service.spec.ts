import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TuitionService } from './tuition.service.js';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TuitionService', () => {
  let service: TuitionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      isConnected: true,
      institute: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      facultyProfile: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      instituteMembership: {
        upsert: vi.fn(),
      },
      batch: {
        updateMany: vi.fn(),
      },
      salaryRecord: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      facultyLeaveApplication: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      dailyTeachingDiary: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      studyMaterial: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      studentFeeRecord: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      studentFeeReminder: {
        count: vi.fn().mockResolvedValue(5),
        create: vi.fn().mockResolvedValue({ id: 'rem_1' }),
      },
    };

    service = new TuitionService(mockPrisma);
  });

  // --------------------------------------------------------------------------
  // 1. Branding & Tuition Profile
  // --------------------------------------------------------------------------
  describe('Branding Profile', () => {
    it('should return tuition branding profile with aggregate counts', async () => {
      mockPrisma.institute.findUnique.mockResolvedValue({
        id: 'inst_1',
        name: 'Apex Academy',
        slug: 'apex-academy',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#1677FF',
        address: '123 Education Lane',
        contactPhone: '+91 98765 43210',
        academicYear: '2026-2027',
        _count: {
          facultyProfiles: 8,
          batches: 12,
          enrollments: 140,
        },
      });

      const profile = await service.getBrandingProfile('inst_1');
      expect(profile.name).toBe('Apex Academy');
      expect(profile.totalFaculty).toBe(8);
      expect(profile.totalBatches).toBe(12);
      expect(profile.totalStudents).toBe(140);
    });

    it('should throw NotFoundException if institute does not exist', async () => {
      mockPrisma.institute.findUnique.mockResolvedValue(null);
      await expect(service.getBrandingProfile('inst_unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. Faculty Management
  // --------------------------------------------------------------------------
  describe('Faculty Management', () => {
    it('should list faculties with workload and assigned batches', async () => {
      mockPrisma.facultyProfile.findMany.mockResolvedValue([
        {
          id: 'fac_prof_1',
          userId: 'user_teach_1',
          staffId: 'FAC-101',
          designation: 'Senior Physics Faculty',
          employmentStatus: 'ACTIVE',
          compensationType: 'FIXED_MONTHLY',
          baseSalary: 65000,
          hourlyRate: 0,
          joiningDate: new Date('2025-01-01'),
          assignedSubjects: ['Physics'],
          delegatedPermissions: ['MANAGE_ATTENDANCE'],
          user: {
            fullName: 'Dr. Homi Bhabha',
            email: 'homi@example.com',
            teacherBatches: [{ id: 'b_1', name: 'Batch A', code: 'BA', subject: 'Physics', gradeLevel: '12' }],
          },
        },
      ]);

      const faculties = await service.getFaculties('inst_1');
      expect(faculties).toHaveLength(1);
      expect(faculties[0].fullName).toBe('Dr. Homi Bhabha');
      expect(faculties[0].weeklyLectureCount).toBe(4);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Salary & Payroll Calculations
  // --------------------------------------------------------------------------
  describe('Salary Calculations & Net Payable', () => {
    it('should calculate net payable correctly: base + additions - deductions - advances', async () => {
      mockPrisma.salaryRecord.upsert.mockResolvedValue({
        id: 'sal_1',
        instituteId: 'inst_1',
        facultyId: 'user_1',
        payPeriod: '2026-10',
        compensationModel: 'FIXED_MONTHLY',
        classesConducted: 20,
        baseAmount: 60000,
        additions: 5000,
        deductions: 2000,
        advances: 10000,
        netPayable: 53000, // 60000 + 5000 - 2000 - 10000
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        faculty: {
          fullName: 'Prof. Rajesh Sharma',
          facultyProfiles: [{ staffId: 'FAC-101', designation: 'Physics' }],
        },
      });

      const salary = await service.generateSalaryRecord('inst_1', {
        facultyId: 'user_1',
        payPeriod: '2026-10',
        compensationModel: 'FIXED_MONTHLY',
        baseAmount: 60000,
        additions: 5000,
        deductions: 2000,
        advances: 10000,
      });

      expect(salary.netPayable).toBe(53000);
      expect(salary.status).toBe('DRAFT');
    });

    it('should transition status to PAID when payment is recorded', async () => {
      mockPrisma.salaryRecord.findUnique.mockResolvedValue({
        id: 'sal_1',
        instituteId: 'inst_1',
        remarks: 'October Salary',
      });

      mockPrisma.salaryRecord.update.mockResolvedValue({
        id: 'sal_1',
        instituteId: 'inst_1',
        facultyId: 'user_1',
        payPeriod: '2026-10',
        compensationModel: 'FIXED_MONTHLY',
        classesConducted: 20,
        baseAmount: 60000,
        additions: 0,
        deductions: 0,
        advances: 0,
        netPayable: 60000,
        status: 'PAID',
        paymentMethod: 'UPI',
        paymentReference: 'UPI/20261029/987654',
        paymentDate: new Date('2026-10-29'),
        remarks: 'October Salary | Paid on time',
        createdAt: new Date(),
        updatedAt: new Date(),
        faculty: {
          fullName: 'Prof. Rajesh Sharma',
          facultyProfiles: [{ staffId: 'FAC-101', designation: 'Physics' }],
        },
      });

      const updated = await service.recordSalaryPayment('inst_1', 'sal_1', {
        paymentMethod: 'UPI',
        paymentReference: 'UPI/20261029/987654',
        paymentDate: '2026-10-29',
        remarks: 'Paid on time',
      });

      expect(updated.status).toBe('PAID');
      expect(updated.paymentMethod).toBe('UPI');
      expect(updated.paymentReference).toBe('UPI/20261029/987654');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Faculty Leave Rules
  // --------------------------------------------------------------------------
  describe('Leave Management & Self-Approval Prevention', () => {
    it('should enforce that a faculty cannot review or approve their own leave application', async () => {
      mockPrisma.facultyLeaveApplication.findUnique.mockResolvedValue({
        id: 'leave_1',
        instituteId: 'inst_1',
        facultyId: 'user_same_id', // same applicant
        status: 'PENDING',
      });

      const reviewerUser: any = {
        id: 'user_same_id', // same as applicant!
        email: 'applicant@example.com',
        role: 'TUITION_OWNER',
        instituteId: 'inst_1',
      };

      await expect(
        service.reviewLeave('inst_1', 'leave_1', reviewerUser, {
          status: 'APPROVED',
          reviewerRemarks: 'Approved self leave',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully approve leave when reviewer is different user', async () => {
      mockPrisma.facultyLeaveApplication.findUnique.mockResolvedValue({
        id: 'leave_1',
        instituteId: 'inst_1',
        facultyId: 'user_faculty_1',
        status: 'PENDING',
        substituteFacultyId: null,
      });

      mockPrisma.facultyLeaveApplication.update.mockResolvedValue({
        id: 'leave_1',
        instituteId: 'inst_1',
        facultyId: 'user_faculty_1',
        leaveType: 'CASUAL',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-02'),
        totalDays: 2,
        reason: 'Family event',
        status: 'APPROVED',
        reviewedById: 'owner_user_id',
        reviewerRemarks: 'Approved with substitute assigned',
        reviewedAt: new Date(),
        substituteFacultyId: 'substitute_user_2',
        createdAt: new Date(),
        faculty: {
          fullName: 'Prof. Rajesh Sharma',
          facultyProfiles: [{ staffId: 'FAC-101' }],
        },
        reviewedBy: {
          fullName: 'Director Sharma',
        },
      });

      const reviewerUser: any = {
        id: 'owner_user_id',
        email: 'owner@apex.com',
        role: 'TUITION_OWNER',
        instituteId: 'inst_1',
      };

      const result = await service.reviewLeave('inst_1', 'leave_1', reviewerUser, {
        status: 'APPROVED',
        reviewerRemarks: 'Approved with substitute assigned',
        substituteFacultyId: 'substitute_user_2',
      });

      expect(result.status).toBe('APPROVED');
      expect(result.reviewerName).toBe('Director Sharma');
      expect(result.substituteFacultyId).toBe('substitute_user_2');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Daily Teaching Diary (Lesson Journal)
  // --------------------------------------------------------------------------
  describe('Daily Teaching Diary', () => {
    it('should create teaching diary with chapter, concepts, and homework', async () => {
      mockPrisma.dailyTeachingDiary.create.mockResolvedValue({
        id: 'diary_1',
        instituteId: 'inst_1',
        batchId: 'batch_1',
        facultyId: 'faculty_1',
        lessonDate: new Date('2026-10-29'),
        subject: 'Physics',
        chapterTitle: 'Rotational Dynamics',
        conceptsTaught: 'Moment of Inertia of Rigid Bodies, Parallel Axis Theorem',
        durationMinutes: 90,
        homeworkAssigned: 'Solve HC Verma Exercises 1 to 15',
        referenceLinks: ['https://example.com/physics-notes'],
        status: 'PUBLISHED',
        audience: 'BATCH',
        isCovered: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        batch: { id: 'batch_1', name: 'JEE Advanced Physics', code: 'PHY-ADV' },
        faculty: { id: 'faculty_1', fullName: 'Prof. Rajesh Sharma' },
      });

      const diary = await service.createTeachingDiary('inst_1', 'faculty_1', {
        batchId: 'batch_1',
        lessonDate: '2026-10-29',
        subject: 'Physics',
        chapterTitle: 'Rotational Dynamics',
        conceptsTaught: 'Moment of Inertia of Rigid Bodies, Parallel Axis Theorem',
        durationMinutes: 90,
        homeworkAssigned: 'Solve HC Verma Exercises 1 to 15',
        referenceLinks: ['https://example.com/physics-notes'],
        audience: 'BATCH',
      });

      expect(diary.chapterTitle).toBe('Rotational Dynamics');
      expect(diary.batchName).toBe('JEE Advanced Physics');
      expect(diary.status).toBe('PUBLISHED');
      expect(diary.audience).toBe('BATCH');
    });

    it('should prevent teacher from updating another teachers diary entry', async () => {
      mockPrisma.dailyTeachingDiary.findUnique.mockResolvedValue({
        id: 'diary_2',
        instituteId: 'inst_1',
        facultyId: 'faculty_other', // written by someone else
      });

      const teacherUser: any = {
        id: 'faculty_me',
        role: 'TEACHER',
        instituteId: 'inst_1',
      };

      await expect(
        service.updateTeachingDiary('inst_1', 'diary_2', teacherUser, {
          chapterTitle: 'Hacked Chapter',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Fees & Reminders
  // --------------------------------------------------------------------------
  describe('Fees & Reminders', () => {
    it('should dispatch fee reminder and record reminder entry', async () => {
      mockPrisma.studentFeeRecord.findUnique.mockResolvedValue({
        id: 'fee_1',
        instituteId: 'inst_1',
        studentId: 'stud_1',
        feeTitle: 'Term 2 Tuition Fee',
        totalAmount: 25000,
        paidAmount: 10000,
        dueDate: new Date('2026-10-15'),
        student: { fullName: 'Aarav Patel', email: 'aarav@example.com' },
      });

      const result = await service.dispatchFeeReminder('inst_1', 'owner_1', {
        feeRecordId: 'fee_1',
        channel: 'SMS',
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.studentFeeReminder.create).toHaveBeenCalled();
    });
  });
});

