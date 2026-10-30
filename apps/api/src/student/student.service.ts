import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssessmentService } from '../assessment/assessment.service.js';
import { TuitionService } from '../tuition/tuition.service.js';
import type { AuthenticatedUser } from '../common/types.js';
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

export interface StudentAttendanceSummary {
  totalClasses: number;
  attended: number;
  absent: number;
  late: number;
  percentage: number;
  records: Array<{
    id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    subjectName?: string;
    remarks?: string;
  }>;
}

export interface StudentFeeSummary {
  totalFees: number;
  paidAmount: number;
  balanceDue: number;
  status: 'PAID' | 'PARTIAL' | 'OVERDUE';
  receipts: Array<{
    id: string;
    title: string;
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    paidDate?: string;
    receiptNumber?: string;
  }>;
}

export interface StudentAnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'NORMAL' | 'URGENT';
  authorName?: string;
}

export interface StudentTeachingDiaryItem {
  id: string;
  lessonDate: string;
  sessionTime?: string;
  subject: string;
  facultyName: string;
  batchName: string;
  chapterTitle: string;
  conceptsTaught: string;
  learningObjectives?: string;
  homeworkAssigned?: string;
  attachmentUrl?: string;
  referenceLinks?: string[];
  createdAt: string;
}

export interface StudentAssignmentItem {
  id: string;
  title: string;
  instructions: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT';
  submission?: {
    submittedAt: string;
    content?: string;
    attachmentUrl?: string;
    marksObtained?: number;
    feedback?: string;
  };
}

export interface StudentTestItem {
  id: string;
  title: string;
  instructions?: string;
  subject: string;
  scheduledDate: string;
  durationMinutes: number;
  totalMarks: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  attempt?: {
    submittedAt: string;
    score: number;
    status: string;
    feedback?: string;
  };
}

export interface AcademicQueryItem {
  id: string;
  subject: string;
  topic?: string;
  questionText: string;
  attachmentUrl?: string;
  status: 'PENDING' | 'ANSWERED';
  facultyReply?: string;
  repliedAt?: string;
  facultyName?: string;
  createdAt: string;
}

export interface PersonalStudyTaskItem {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  priority: 'NORMAL' | 'HIGH' | 'LOW';
  isCompleted: boolean;
  createdAt: string;
}

export interface StudentDocumentItem {
  id: string;
  title: string;
  category: 'REPORT_CARD' | 'FEE_RECEIPT' | 'STUDY_MATERIAL' | 'TIMETABLE_SCHEDULE' | 'CERTIFICATE';
  issueDate: string;
  academicPeriod: string;
  downloadUrl: string;
  fileSize?: string;
}

@Injectable()
export class StudentService {
  // In-memory persistent stores for offline / local mode
  private memSubmissions = new Map<string, any>();
  private memTestAttempts = new Map<string, any>();
  private memAttendanceCorrections: any[] = [];
  private memAcademicQueries: AcademicQueryItem[] = [
    {
      id: 'query_01',
      subject: 'Mathematics',
      topic: 'Definite Integration — King Property',
      questionText: 'Sir, when integrating sin(x)/(sin(x)+cos(x)) from 0 to pi/2, how do we prove the equivalence before adding the two integral equations?',
      status: 'ANSWERED',
      facultyReply: 'Apply the substitution x = (a+b) - t. Here a+b = pi/2, so sin(pi/2 - t) becomes cos(t). Then 2I = integral of 1 dt.',
      repliedAt: '2026-10-29T14:30:00Z',
      facultyName: 'Prof. Rajesh Sharma',
      createdAt: '2026-10-29T11:00:00Z',
    },
  ];
  private memStudyTasks: PersonalStudyTaskItem[] = [
    {
      id: 'task_01',
      title: 'Solve 25 Problems from DPP #14 (Definite Integrals)',
      subject: 'Mathematics',
      dueDate: '2026-10-31',
      priority: 'HIGH',
      isCompleted: false,
      createdAt: '2026-10-29T10:00:00Z',
    },
    {
      id: 'task_02',
      title: 'Review Ray Optics Sign Conventions and Mirror Formula',
      subject: 'Physics',
      dueDate: '2026-11-01',
      priority: 'NORMAL',
      isCompleted: true,
      createdAt: '2026-10-28T09:00:00Z',
    },
    {
      id: 'task_03',
      title: 'Memorize Thermodynamic State Functions & Carnot Efficiency',
      subject: 'Physics',
      dueDate: '2026-11-02',
      priority: 'NORMAL',
      isCompleted: false,
      createdAt: '2026-10-29T15:00:00Z',
    },
  ];
  private memSupportRequests: any[] = [];

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AssessmentService) private readonly assessmentService: AssessmentService,
    @Inject(TuitionService) private readonly tuitionService: TuitionService,
  ) {}

  // ==========================================================================
  // 1. DASHBOARD
  // ==========================================================================
  async getDashboard(user: AuthenticatedUser) {
    const [results, materials, attendance, announcements, fees, diaries, assignments] =
      await Promise.all([
        this.assessmentService.getStudentPublishedResults(user),
        this.assessmentService.getStudentStudyMaterials(user),
        this.getAttendance(user),
        this.getAnnouncements(user),
        this.getFees(user),
        this.getTeachingDiaries(user),
        this.getAssignments(user),
      ]);

    const scoredResults = results.filter((r) => r.resultStatus === 'SCORED' && r.percentage !== null);
    const avgScore =
      scoredResults.length > 0
        ? Math.round(
            scoredResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
              scoredResults.length,
          )
        : 0;

    const pendingAssignments = assignments.filter((a) => a.status === 'PENDING').length;

    return {
      student: {
        id: user.id,
        fullName: user.fullName || 'Student',
        email: user.email,
        rollNumber: 'APX-2026-001',
        instituteName: user.instituteName || 'Apex IIT-JEE & Medical Academy',
        batchName: 'JEE Advanced — Mathematics Alpha',
        academicYear: '2026-2027',
      },
      stats: {
        totalTests: results.length,
        avgPercentage: avgScore,
        attendanceRate: attendance.percentage,
        totalMaterials: materials.length,
        pendingAssignments,
        feeBalance: fees.balanceDue,
      },
      recentResults: results.slice(0, 3),
      recentMaterials: materials.slice(0, 3),
      recentDiaries: diaries.slice(0, 2),
      upcomingAssignments: assignments.slice(0, 3),
      announcements: announcements.slice(0, 2),
      timetable: [
        { time: '09:00 AM - 10:30 AM', subject: 'Mathematics (Calculus)', room: 'Lecture Hall 2', faculty: 'Prof. Rajesh Sharma' },
        { time: '11:00 AM - 12:30 PM', subject: 'Physics (Optics)', room: 'Physics Lab A', faculty: 'Dr. Alok Verma' },
        { time: '02:00 PM - 03:30 PM', subject: 'Daily Problem Practice (DPP)', room: 'Study Wing 3', faculty: 'Faculty Assistant' },
      ],
    };
  }

  // ==========================================================================
  // 2. INVITATION & BATCH ENROLLMENT
  // ==========================================================================
  async validateInvitation(code: string) {
    if (!code || !code.trim()) {
      throw new BadRequestException('Invitation code is required.');
    }
    const cleanCode = code.trim();

    if (this.prisma.isConnected) {
      const inv = await this.prisma.invitationCode.findUnique({
        where: { code: cleanCode },
        include: { institute: true, batch: true },
      });

      if (!inv || inv.isRevoked || new Date(inv.expiresAt) < new Date() || inv.usedCount >= inv.maxUses) {
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
        expiresAt: inv.expiresAt.toISOString(),
      };
    }

    // In-memory realistic validation
    return {
      valid: true,
      code: cleanCode,
      instituteId: 'inst_apex_academy',
      instituteName: 'Apex IIT-JEE & Medical Academy',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      subject: 'Mathematics',
      gradeLevel: 'Grade 12 / Repeaters',
      expiresAt: '2027-03-31T23:59:59Z',
    };
  }

  async joinInstitute(user: AuthenticatedUser, code: string) {
    const invData = await this.validateInvitation(code);

    if (this.prisma.isConnected) {
      // Upsert membership
      await this.prisma.instituteMembership.upsert({
        where: {
          instituteId_userId: {
            instituteId: invData.instituteId,
            userId: user.id,
          },
        },
        create: {
          instituteId: invData.instituteId,
          userId: user.id,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
        update: {
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      // If batch is assigned, enroll student
      if (invData.batchId) {
        await this.prisma.enrollment.upsert({
          where: {
            batchId_studentId: {
              batchId: invData.batchId,
              studentId: user.id,
            },
          },
          create: {
            instituteId: invData.instituteId,
            batchId: invData.batchId,
            studentId: user.id,
            rollNumber: `APX-${Date.now().toString().slice(-4)}`,
            status: 'ACTIVE',
          },
          update: {
            status: 'ACTIVE',
          },
        });
      }

      // Increment usage count
      await this.prisma.invitationCode.updateMany({
        where: { code: invData.code },
        data: { usedCount: { increment: 1 } },
      });
    }

    return {
      success: true,
      message: `Successfully enrolled in ${invData.instituteName} — ${invData.batchName}!`,
      instituteName: invData.instituteName,
      batchName: invData.batchName,
    };
  }

  // ==========================================================================
  // 3. STUDENT PROFILE
  // ==========================================================================
  async getStudentProfile(user: AuthenticatedUser) {
    if (this.prisma.isConnected) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          enrollments: {
            include: {
              batch: true,
              institute: true,
            },
          },
        },
      });

      if (dbUser) {
        const firstEnrollment = dbUser.enrollments[0];
        return {
          id: dbUser.id,
          fullName: dbUser.fullName,
          email: dbUser.email,
          phone: dbUser.phone || '+91 98765 43210',
          avatarUrl: dbUser.avatarUrl || null,
          role: 'STUDENT',
          rollNumber: firstEnrollment?.rollNumber || 'APX-2026-001',
          instituteId: firstEnrollment?.instituteId || user.instituteId,
          instituteName: firstEnrollment?.institute?.name || user.instituteName || 'Apex IIT-JEE & Medical Academy',
          batchId: firstEnrollment?.batchId || 'btc_jee_math_adv',
          batchName: firstEnrollment?.batch?.name || 'JEE Advanced — Mathematics Alpha',
          subject: firstEnrollment?.batch?.subject || 'Mathematics',
          academicYear: '2026-2027',
          joinedAt: dbUser.createdAt.toISOString(),
          notificationPreferences: {
            email: true,
            sms: true,
            inApp: true,
            results: true,
            fees: true,
          },
        };
      }
    }

    return {
      id: user.id,
      fullName: user.fullName || 'Aarav Patel',
      email: user.email,
      phone: '+91 98765 43210',
      avatarUrl: null,
      role: 'STUDENT',
      rollNumber: 'APX-2026-001',
      instituteId: user.instituteId || 'inst_apex_academy',
      instituteName: user.instituteName || 'Apex IIT-JEE & Medical Academy',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      subject: 'Mathematics',
      academicYear: '2026-2027',
      joinedAt: '2026-08-01T00:00:00Z',
      notificationPreferences: {
        email: true,
        sms: true,
        inApp: true,
        results: true,
        fees: true,
      },
    };
  }

  async updateStudentProfile(user: AuthenticatedUser, dto: UpdateStudentProfileDto) {
    if (this.prisma.isConnected) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: dto.fullName?.trim() || undefined,
          phone: dto.phone?.trim() || undefined,
          avatarUrl: dto.avatarUrl || undefined,
        },
      });
    }

    return {
      success: true,
      message: 'Profile updated successfully.',
    };
  }

  // ==========================================================================
  // 4. DAILY TEACHING DIARY (STUDENT VIEW)
  // ==========================================================================
  async getTeachingDiaries(
    user: AuthenticatedUser,
    query?: { subject?: string; search?: string },
  ): Promise<StudentTeachingDiaryItem[]> {
    if (this.prisma.isConnected) {
      // Find batches student is enrolled in
      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: { batchId: true },
      });
      const batchIds = enrollments.map((e) => e.batchId);

      const diaries = await this.prisma.dailyTeachingDiary.findMany({
        where: {
          status: 'PUBLISHED',
          audience: 'BATCH',
          ...(batchIds.length > 0 ? { batchId: { in: batchIds } } : {}),
          ...(query?.subject && query.subject !== 'ALL' ? { subject: query.subject } : {}),
        },
        include: {
          faculty: { select: { fullName: true } },
          batch: { select: { name: true } },
        },
        orderBy: { lessonDate: 'desc' },
      });

      if (diaries.length > 0) {
        return diaries.map((d) => ({
          id: d.id,
          lessonDate: d.lessonDate.toISOString().split('T')[0],
          sessionTime: d.sessionTime || '09:00 - 10:30',
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
    }

    // High fidelity realistic mock diaries
    const allDiaries: StudentTeachingDiaryItem[] = [
      {
        id: 'diary_01',
        lessonDate: '2026-10-29',
        sessionTime: '09:00 - 10:30',
        subject: 'Mathematics',
        facultyName: 'Prof. Rajesh Sharma',
        batchName: 'JEE Advanced — Mathematics Alpha',
        chapterTitle: 'Definite Integration & King Property Applications',
        conceptsTaught: 'Proved Leibniz integral rule, Walli formula, and substitution tricks for symmetric boundaries. Demonstrated 5 JEE Advanced 2024 problem models.',
        learningObjectives: 'Master King Property transformations in non-standard trigonometric integrals.',
        homeworkAssigned: 'Complete DPP #14 Problems 1 to 25. Upload answers to Study Material vault before Friday.',
        attachmentUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
        referenceLinks: ['https://mathworld.wolfram.com/DefiniteIntegral.html'],
        createdAt: '2026-10-29T11:00:00Z',
      },
      {
        id: 'diary_02',
        lessonDate: '2026-10-28',
        sessionTime: '11:00 - 12:30',
        subject: 'Physics',
        facultyName: 'Dr. Alok Verma',
        batchName: 'JEE Advanced — Physics Prime',
        chapterTitle: 'Wave Optics & Youngs Double Slit Interference',
        conceptsTaught: 'Fringe width derivation, path difference in presence of thin glass slab, phase difference, and intensity distribution on screen.',
        learningObjectives: 'Solve interference problems with multi-wavelength laser sources.',
        homeworkAssigned: 'Sheet #8 numericals 1 to 15.',
        attachmentUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793338782614.json',
        referenceLinks: [],
        createdAt: '2026-10-28T13:00:00Z',
      },
      {
        id: 'diary_03',
        lessonDate: '2026-10-26',
        sessionTime: '09:00 - 10:30',
        subject: 'Mathematics',
        facultyName: 'Prof. Rajesh Sharma',
        batchName: 'JEE Advanced — Mathematics Alpha',
        chapterTitle: 'Indefinite Integrals & Partial Fractions',
        conceptsTaught: 'Linear and quadratic irreducible factors in rational functions. Standard substitutions for quadratic surds.',
        learningObjectives: 'Convert complex rational expressions into integrable standard forms in under 2 minutes.',
        homeworkAssigned: 'Exercises 7.4 and 7.5 from standard advanced reference book.',
        createdAt: '2026-10-26T11:00:00Z',
      },
    ];

    if (query?.subject && query.subject !== 'ALL') {
      return allDiaries.filter((d) => d.subject.toLowerCase() === query.subject?.toLowerCase());
    }
    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase();
      return allDiaries.filter(
        (d) =>
          d.chapterTitle.toLowerCase().includes(q) ||
          d.conceptsTaught.toLowerCase().includes(q) ||
          d.subject.toLowerCase().includes(q),
      );
    }
    return allDiaries;
  }

  // ==========================================================================
  // 5. TIMETABLE
  // ==========================================================================
  async getTimetable(_user: AuthenticatedUser) {
    return [
      {
        day: 'Monday',
        slots: [
          { time: '09:00 AM - 10:30 AM', subject: 'Mathematics', topic: 'Calculus', room: 'Hall 2', faculty: 'Prof. Rajesh Sharma' },
          { time: '11:00 AM - 12:30 PM', subject: 'Physics', topic: 'Electromagnetism', room: 'Lab A', faculty: 'Dr. Alok Verma' },
          { time: '02:00 PM - 03:30 PM', subject: 'Chemistry', topic: 'Coordination Compounds', room: 'Hall 1', faculty: 'Dr. Meera Iyer' },
        ],
      },
      {
        day: 'Tuesday',
        slots: [
          { time: '09:00 AM - 10:30 AM', subject: 'Mathematics', topic: 'Differential Equations', room: 'Hall 2', faculty: 'Prof. Rajesh Sharma' },
          { time: '11:00 AM - 12:30 PM', subject: 'Physics', topic: 'Wave Optics', room: 'Lab A', faculty: 'Dr. Alok Verma' },
          { time: '02:00 PM - 03:30 PM', subject: 'Daily Problem Practice', topic: 'DPP Discussion', room: 'Study Wing 3', faculty: 'Faculty Assistant' },
        ],
      },
      {
        day: 'Wednesday',
        slots: [
          { time: '09:00 AM - 10:30 AM', subject: 'Mathematics', topic: 'Probability & Permutations', room: 'Hall 2', faculty: 'Prof. Rajesh Sharma' },
          { time: '11:00 AM - 12:30 PM', subject: 'Chemistry', topic: 'Thermodynamics', room: 'Hall 1', faculty: 'Dr. Meera Iyer' },
        ],
      },
      {
        day: 'Thursday',
        slots: [
          { time: '09:00 AM - 10:30 AM', subject: 'Physics', topic: 'Modern Physics', room: 'Lab A', faculty: 'Dr. Alok Verma' },
          { time: '11:00 AM - 12:30 PM', subject: 'Mathematics', topic: 'Definite Integrals', room: 'Hall 2', faculty: 'Prof. Rajesh Sharma' },
          { time: '02:00 PM - 03:30 PM', subject: 'Doubt Clearing Clinic', topic: 'Open Faculty Session', room: 'Faculty Room 4', faculty: 'All Faculty' },
        ],
      },
      {
        day: 'Friday',
        slots: [
          { time: '09:00 AM - 10:30 AM', subject: 'Mathematics', topic: 'Vector 3D Geometry', room: 'Hall 2', faculty: 'Prof. Rajesh Sharma' },
          { time: '11:00 AM - 12:30 PM', subject: 'Physics', topic: 'Rotational Motion', room: 'Lab A', faculty: 'Dr. Alok Verma' },
          { time: '02:00 PM - 04:00 PM', subject: 'Weekly Assessment', topic: 'Full 100-Mark Model Exam', room: 'Main Exam Hall', faculty: 'Invigilator' },
        ],
      },
      {
        day: 'Saturday',
        slots: [
          { time: '10:00 AM - 01:00 PM', subject: 'All Subjects', topic: 'JEE Advanced Paper Discussion & Doubt Clinic', room: 'Auditorium', faculty: 'Prof. Sharma & Dr. Verma' },
        ],
      },
    ];
  }

  // ==========================================================================
  // 6. ATTENDANCE & CORRECTION REQUESTS
  // ==========================================================================
  async getAttendance(user: AuthenticatedUser): Promise<StudentAttendanceSummary> {
    if (this.prisma.isConnected) {
      const records = await this.prisma.attendanceRecord.findMany({
        where: { studentId: user.id },
        include: { session: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      if (records.length > 0) {
        const total = records.length;
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;
        const pct = Math.round(((present + late * 0.5) / total) * 100);

        return {
          totalClasses: total,
          attended: present,
          absent,
          late,
          percentage: pct,
          records: records.map((r) => ({
            id: r.id,
            date: r.session.date ? r.session.date.toISOString().split('T')[0] : r.createdAt.toISOString().split('T')[0],
            status: r.status as any,
            subjectName: 'JEE Mathematics',
            remarks: r.note || undefined,
          })),
        };
      }
    }

    const mockDates = [
      { date: '2026-10-29', status: 'PRESENT' as const, remarks: 'On time, active participation' },
      { date: '2026-10-28', status: 'PRESENT' as const, remarks: 'Verified present' },
      { date: '2026-10-27', status: 'LATE' as const, remarks: 'Arrived 10 mins late' },
      { date: '2026-10-26', status: 'PRESENT' as const, remarks: 'Full lecture attended' },
      { date: '2026-10-25', status: 'PRESENT' as const, remarks: 'Sunday special test session' },
      { date: '2026-10-24', status: 'PRESENT' as const, remarks: 'DPP discussion attended' },
      { date: '2026-10-23', status: 'ABSENT' as const, remarks: 'Medical leave submitted' },
      { date: '2026-10-22', status: 'PRESENT' as const, remarks: 'Verified present' },
      { date: '2026-10-21', status: 'PRESENT' as const, remarks: 'Verified present' },
      { date: '2026-10-20', status: 'PRESENT' as const, remarks: 'On time' },
    ];

    const total = 24;
    const present = 22;
    const absent = 1;
    const late = 1;

    return {
      totalClasses: total,
      attended: present,
      absent,
      late,
      percentage: Math.round(((present + late * 0.5) / total) * 100),
      records: mockDates.map((item, idx) => ({
        id: `att_rec_${idx + 1}`,
        date: item.date,
        status: item.status,
        subjectName: 'Mathematics Alpha',
        remarks: item.remarks,
      })),
    };
  }

  async submitAttendanceCorrection(user: AuthenticatedUser, dto: AttendanceCorrectionRequestDto) {
    if (!dto.date || !dto.reason.trim()) {
      throw new BadRequestException('Session date and reason for correction are required.');
    }

    this.memAttendanceCorrections.push({
      id: `att_corr_${Date.now()}`,
      studentId: user.id,
      studentName: user.fullName,
      date: dto.date,
      reason: dto.reason.trim(),
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Attendance correction request submitted to academic faculty for review.',
      status: 'PENDING',
    };
  }

  // ==========================================================================
  // 7. HOMEWORK & ASSIGNMENTS
  // ==========================================================================
  async getAssignments(user: AuthenticatedUser): Promise<StudentAssignmentItem[]> {
    const list: StudentAssignmentItem[] = [
      {
        id: 'asg_01',
        title: 'Definite Integration & Walli Formula — DPP 14',
        instructions: 'Solve all 25 problems with handwritten step-by-step calculus proofs. Submit scanned PDF or high-resolution images.',
        subject: 'Mathematics',
        dueDate: '2026-11-02T23:59:59Z',
        maxMarks: 100,
        attachmentUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
        status: 'PENDING',
      },
      {
        id: 'asg_02',
        title: 'Wave Optics Interference Fringe Calculations',
        instructions: 'Calculate fringe width, optical path change with mica sheet, and maximum orders visible in standard double-slit geometry.',
        subject: 'Physics',
        dueDate: '2026-10-31T18:00:00Z',
        maxMarks: 50,
        status: 'SUBMITTED',
        submission: {
          submittedAt: '2026-10-29T16:20:00Z',
          content: 'Uploaded solved worksheet with 12 completed derivations.',
          attachmentUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793338782614.json',
          marksObtained: 46,
          feedback: 'Excellent work on the mica sheet path difference question! Clean diagrams.',
        },
      },
      {
        id: 'asg_03',
        title: 'Thermodynamics State Functions Problem Set',
        instructions: '15 numericals on adiabatic expansions and Carnot cycle efficiency.',
        subject: 'Physics',
        dueDate: '2026-10-25T23:59:59Z',
        maxMarks: 50,
        status: 'GRADED',
        submission: {
          submittedAt: '2026-10-24T20:00:00Z',
          content: 'Completed all 15 questions.',
          marksObtained: 48,
          feedback: 'Accurate Carnot calculations. Neat handwriting.',
        },
      },
    ];

    // Check in-memory submissions
    for (const item of list) {
      const key = `${user.id}_${item.id}`;
      if (this.memSubmissions.has(key)) {
        const sub = this.memSubmissions.get(key);
        item.status = sub.status;
        item.submission = sub;
      }
    }

    return list;
  }

  async submitAssignment(user: AuthenticatedUser, assignmentId: string, dto: SubmitAssignmentDto) {
    if (!dto.content?.trim() && !dto.attachmentUrl?.trim()) {
      throw new BadRequestException('Please provide written notes or upload an attachment document.');
    }

    const key = `${user.id}_${assignmentId}`;
    const submissionRecord = {
      submittedAt: new Date().toISOString(),
      content: dto.content?.trim(),
      attachmentUrl: dto.attachmentUrl?.trim(),
      status: dto.isDraft ? 'PENDING' : 'SUBMITTED',
      marksObtained: null,
      feedback: dto.isDraft ? 'Draft saved.' : 'Submitted for faculty evaluation.',
    };

    this.memSubmissions.set(key, submissionRecord);

    return {
      success: true,
      message: dto.isDraft ? 'Assignment draft saved successfully.' : 'Assignment submitted successfully to faculty!',
      status: submissionRecord.status,
    };
  }

  // ==========================================================================
  // 8. TESTS, QUIZZES & EXAMINATIONS
  // ==========================================================================
  async getTests(user: AuthenticatedUser): Promise<StudentTestItem[]> {
    const list: StudentTestItem[] = [
      {
        id: 'tst_01',
        title: 'JEE Advanced Calculus & Definite Integrals Speed Quiz',
        instructions: '10 Questions. 30 Minutes. Correct Answer +4, Incorrect -1. Server-side countdown.',
        subject: 'Mathematics',
        scheduledDate: '2026-10-31T10:00:00Z',
        durationMinutes: 30,
        totalMarks: 40,
        status: 'ACTIVE',
      },
      {
        id: 'tst_02',
        title: 'Wave Optics & Ray Optics Combined Test',
        instructions: 'Comprehensive 15-question numerical and conceptual assessment.',
        subject: 'Physics',
        scheduledDate: '2026-11-05T09:00:00Z',
        durationMinutes: 60,
        totalMarks: 60,
        status: 'UPCOMING',
      },
      {
        id: 'tst_03',
        title: 'Vector Algebra & 3D Geometry Unit Test',
        instructions: 'Test completed on 2026-10-20.',
        subject: 'Mathematics',
        scheduledDate: '2026-10-20T09:00:00Z',
        durationMinutes: 45,
        totalMarks: 50,
        status: 'COMPLETED',
        attempt: {
          submittedAt: '2026-10-20T09:42:00Z',
          score: 44,
          status: 'GRADED',
          feedback: 'Outstanding spatial analysis in planes and shortest distance.',
        },
      },
    ];

    for (const test of list) {
      const key = `${user.id}_${test.id}`;
      if (this.memTestAttempts.has(key)) {
        const att = this.memTestAttempts.get(key);
        test.status = 'COMPLETED';
        test.attempt = att;
      }
    }

    return list;
  }

  async getTestDetails(_user: AuthenticatedUser, testId: string) {
    if (testId === 'tst_01') {
      return {
        id: 'tst_01',
        title: 'JEE Advanced Calculus & Definite Integrals Speed Quiz',
        instructions: '10 Multiple Choice Questions. Read each question carefully. Correct: +4, Negative: -1.',
        subject: 'Mathematics',
        durationMinutes: 30,
        totalMarks: 40,
        questions: [
          {
            id: 'q1',
            text: 'Evaluate the definite integral of sin(x) / (sin(x) + cos(x)) from 0 to pi/2.',
            options: ['pi / 4', 'pi / 2', '1', '0'],
            marks: 4,
          },
          {
            id: 'q2',
            text: 'What is the value of the integral from -1 to 1 of x^3 * cos(x) dx?',
            options: ['0', 'pi', '2', '1/2'],
            marks: 4,
          },
          {
            id: 'q3',
            text: 'Using King Property, the integral from a to b of f(x) dx equals the integral from a to b of:',
            options: ['f(a + b - x) dx', 'f(x - a - b) dx', 'f(a - b + x) dx', 'f(2x) dx'],
            marks: 4,
          },
          {
            id: 'q4',
            text: 'Evaluate the integral from 0 to 1 of x * (1 - x)^99 dx.',
            options: ['1 / 10100', '1 / 100', '1 / 9900', '1 / 200'],
            marks: 4,
          },
        ],
      };
    }

    return {
      id: testId,
      title: 'Classroom Assessment',
      instructions: 'Standard assessment guidelines apply.',
      subject: 'Mathematics',
      durationMinutes: 45,
      totalMarks: 40,
      questions: [
        {
          id: 'q1',
          text: 'Find the derivative of f(x) = e^(2x) * cos(x).',
          options: ['e^(2x) * (2cos(x) - sin(x))', '2e^(2x) * sin(x)', 'e^(2x) * (cos(x) + sin(x))', 'cos(2x)'],
          marks: 4,
        },
      ],
    };
  }

  async submitTestAttempt(user: AuthenticatedUser, testId: string, answers: TestAnswerItemDto[]) {
    let score = 0;
    const totalMarks = 40;

    // Server-side scoring for tst_01
    const correctMap: Record<string, number> = {
      q1: 0, // pi/4
      q2: 0, // 0 (odd function)
      q3: 0, // f(a+b-x)
      q4: 0, // 1/10100
    };

    for (const ans of answers) {
      if (correctMap[ans.questionId] !== undefined) {
        if (ans.selectedOptionIndex === correctMap[ans.questionId]) {
          score += 4;
        } else if (ans.selectedOptionIndex !== undefined) {
          score -= 1; // Negative marking
        }
      }
    }

    if (score < 0) score = 0;

    const attemptRecord = {
      submittedAt: new Date().toISOString(),
      score,
      totalMarks,
      percentage: Math.round((score / totalMarks) * 100),
      status: 'GRADED',
      feedback: `Online assessment verified. Score: ${score}/${totalMarks} (${Math.round((score / totalMarks) * 100)}%).`,
    };

    const key = `${user.id}_${testId}`;
    this.memTestAttempts.set(key, attemptRecord);

    return {
      success: true,
      score,
      totalMarks,
      percentage: attemptRecord.percentage,
      feedback: attemptRecord.feedback,
      submittedAt: attemptRecord.submittedAt,
    };
  }

  // ==========================================================================
  // 9. RESULTS & STUDY MATERIALS
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
    if (this.prisma.isConnected) {
      const records = await this.prisma.studentFeeRecord.findMany({
        where: { studentId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (records.length > 0) {
        const total = records.reduce((s, r) => s + r.totalAmount, 0);
        const paid = records.reduce((s, r) => s + r.paidAmount, 0);
        const balance = total - paid;
        return {
          totalFees: total,
          paidAmount: paid,
          balanceDue: balance,
          status: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OVERDUE',
          receipts: records.map((r) => ({
            id: r.id,
            title: r.feeTitle,
            dueDate: r.dueDate ? r.dueDate.toISOString().split('T')[0] : '2026-11-15',
            amount: r.totalAmount,
            paidAmount: r.paidAmount,
            status: r.status as any,
            receiptNumber: `REC-${r.id.slice(-6).toUpperCase()}`,
          })),
        };
      }
    }

    return {
      totalFees: 35000,
      paidAmount: 20000,
      balanceDue: 15000,
      status: 'PARTIAL',
      receipts: [
        {
          id: 'rec_01',
          title: 'Term 1 Tuition & Comprehensive Test Series',
          dueDate: '2026-08-15',
          amount: 20000,
          paidAmount: 20000,
          status: 'PAID',
          paidDate: '2026-08-10',
          receiptNumber: 'REC-2026-0941',
        },
        {
          id: 'rec_02',
          title: 'Term 2 Study Vault & Advanced Problem Practice',
          dueDate: '2026-11-15',
          amount: 15000,
          paidAmount: 0,
          status: 'PENDING',
          receiptNumber: 'INV-2026-1102',
        },
      ],
    };
  }

  async getAnnouncements(_user: AuthenticatedUser): Promise<StudentAnnouncementItem[]> {
    return [
      {
        id: 'ann_01',
        title: 'JEE Advanced Full Syllabus Mock Test #4 Scheduled',
        content: 'The 4th full-length JEE Advanced test is scheduled for this coming Sunday at 09:00 AM. Formulas and DPPs are available in your Study Materials vault.',
        date: '2026-10-29',
        priority: 'URGENT',
        authorName: 'Academic Directorate',
      },
      {
        id: 'ann_02',
        title: 'Definite Integration & Vector Calculus Question Bank Uploaded',
        content: 'Prof. Sharma has released 50 high-yield solved advanced questions. Check the Study Materials tab to download PDF notes directly from the media CDN.',
        date: '2026-10-28',
        priority: 'NORMAL',
        authorName: 'Prof. Rajesh Sharma',
      },
      {
        id: 'ann_03',
        title: 'National Science & Olympiad Practice Lab Timings',
        content: 'Physics lab will remain open until 06:00 PM every weekday for JEE aspirants practicing ray optics and mechanics apparatus.',
        date: '2026-10-25',
        priority: 'NORMAL',
        authorName: 'Physics Department',
      },
    ];
  }

  // ==========================================================================
  // 11. ACADEMIC QUERIES & DOUBTS
  // ==========================================================================
  async getAcademicQueries(_user: AuthenticatedUser): Promise<AcademicQueryItem[]> {
    return this.memAcademicQueries;
  }

  async submitAcademicQuery(user: AuthenticatedUser, dto: CreateAcademicQueryDto) {
    if (!dto.subject || !dto.questionText.trim()) {
      throw new BadRequestException('Subject and question description are required.');
    }

    const query: AcademicQueryItem = {
      id: `query_${Date.now()}`,
      subject: dto.subject,
      topic: dto.topic?.trim() || undefined,
      questionText: dto.questionText.trim(),
      attachmentUrl: dto.attachmentUrl || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.memAcademicQueries.unshift(query);

    return {
      success: true,
      message: 'Your academic question has been submitted to faculty.',
      query,
    };
  }

  // ==========================================================================
  // 12. STUDY PLANNER & PERSONAL TASKS
  // ==========================================================================
  async getStudyTasks(_user: AuthenticatedUser): Promise<PersonalStudyTaskItem[]> {
    return this.memStudyTasks;
  }

  async createStudyTask(_user: AuthenticatedUser, dto: CreateStudyTaskDto) {
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Task title is required.');
    }

    const task: PersonalStudyTaskItem = {
      id: `task_${Date.now()}`,
      title: dto.title.trim(),
      subject: dto.subject || 'General Study',
      dueDate: dto.dueDate || undefined,
      priority: dto.priority || 'NORMAL',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    this.memStudyTasks.unshift(task);
    return task;
  }

  async updateStudyTask(_user: AuthenticatedUser, taskId: string, dto: UpdateStudyTaskDto) {
    const task = this.memStudyTasks.find((t) => t.id === taskId);
    if (!task) throw new NotFoundException('Task not found.');

    if (dto.isCompleted !== undefined) task.isCompleted = dto.isCompleted;
    if (dto.title !== undefined) task.title = dto.title.trim();

    return task;
  }

  async deleteStudyTask(_user: AuthenticatedUser, taskId: string) {
    this.memStudyTasks = this.memStudyTasks.filter((t) => t.id !== taskId);
    return { success: true, message: 'Task deleted.' };
  }

  // ==========================================================================
  // 13. STUDENT DOCUMENTS & PDF CENTER
  // ==========================================================================
  async getDocuments(_user: AuthenticatedUser): Promise<StudentDocumentItem[]> {
    return [
      {
        id: 'doc_01',
        title: 'Term 1 Official Academic Report Card & Cumulative Marks Sheet',
        category: 'REPORT_CARD',
        issueDate: '2026-10-15',
        academicPeriod: 'Term 1 (2026-2027)',
        downloadUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
        fileSize: '1.8 MB',
      },
      {
        id: 'doc_02',
        title: 'Tuition Fee Payment Official Receipt #REC-2026-0941',
        category: 'FEE_RECEIPT',
        issueDate: '2026-08-10',
        academicPeriod: 'Term 1 Fee Settlement',
        downloadUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793338782614.json',
        fileSize: '650 KB',
      },
      {
        id: 'doc_03',
        title: 'JEE Advanced Definite Integrals Comprehensive Notes & Formulas',
        category: 'STUDY_MATERIAL',
        issueDate: '2026-10-28',
        academicPeriod: 'Calculus Module',
        downloadUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793338881129.txt',
        fileSize: '3.4 MB',
      },
      {
        id: 'doc_04',
        title: 'Academic Timetable & Classroom Wing Allocation Schedule',
        category: 'TIMETABLE_SCHEDULE',
        issueDate: '2026-10-01',
        academicPeriod: 'Autumn Term 2026',
        downloadUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793338917831.txt',
        fileSize: '420 KB',
      },
    ];
  }

  // ==========================================================================
  // 14. SUPPORT & HELP REQUESTS
  // ==========================================================================
  async submitSupportRequest(user: AuthenticatedUser, dto: CreateSupportRequestDto) {
    if (!dto.subject || !dto.description.trim()) {
      throw new BadRequestException('Subject and description are required.');
    }

    const ticket = {
      id: `supp_${Date.now()}`,
      studentId: user.id,
      studentName: user.fullName,
      category: dto.category,
      subject: dto.subject.trim(),
      description: dto.description.trim(),
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };

    this.memSupportRequests.push(ticket);

    return {
      success: true,
      ticketId: ticket.id,
      message: 'Support request submitted. Academic desk will update you within 24 hours.',
    };
  }
}
