import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AuthenticatedUser } from '../common/types.js';

interface InMemoryStore {
  batches: any[];
  students: any[];
  enrollments: any[];
  invitations: any[];
  attendanceSessions: any[];
  attendanceRecords: any[];
  assignments: any[];
  submissions: any[];
  tests: any[];
  testAttempts: any[];
  lessonPlans: any[];
  timetable: any[];
  announcements: any[];
  auditLogs: any[];
}

@Injectable()
export class TeacherService {
  private memoryStore: InMemoryStore;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {
    this.memoryStore = this.initializeSeedData();
  }

  // -------------------------------------------------------------
  // SEED DATA INITIALIZER
  // -------------------------------------------------------------
  private initializeSeedData(): InMemoryStore {
    const instituteId = 'inst_apex_academy';
    const teacherId = 'usr_teacher_sharma';

    const batches = [
      {
        id: 'btc_jee_math_adv',
        instituteId,
        teacherId,
        name: 'JEE Advanced — Mathematics Alpha',
        code: 'JEE-MTH-ADV',
        subject: 'Higher Calculus & Vectors',
        gradeLevel: 'Class 12 / Repeaters',
        room: 'Room 302, Academic Block B',
        studentCount: 28,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'btc_neet_physics_core',
        instituteId,
        teacherId,
        name: 'Class 11 — Physics Core Batch',
        code: 'PHY-11-CORE',
        subject: 'Mechanics & Thermodynamics',
        gradeLevel: 'Class 11',
        room: 'Lecture Hall 1',
        studentCount: 34,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'btc_foundations_math_10',
        instituteId,
        teacherId,
        name: 'Olympiad Foundation Mathematics',
        code: 'OLY-MTH-10',
        subject: 'Combinatorics & Number Theory',
        gradeLevel: 'Class 10',
        room: 'Seminar Room 4',
        studentCount: 22,
        createdAt: new Date().toISOString(),
      },
    ];

    const students = [
      { id: 'std_01', fullName: 'Aarav Patel', rollNumber: 'APX-2026-001', email: 'aarav.patel@example.com', attendanceRate: 96 },
      { id: 'std_02', fullName: 'Diya Sen', rollNumber: 'APX-2026-002', email: 'diya.sen@example.com', attendanceRate: 92 },
      { id: 'std_03', fullName: 'Kabir Verma', rollNumber: 'APX-2026-003', email: 'kabir.verma@example.com', attendanceRate: 88 },
      { id: 'std_04', fullName: 'Ananya Iyer', rollNumber: 'APX-2026-004', email: 'ananya.iyer@example.com', attendanceRate: 100 },
      { id: 'std_05', fullName: 'Rohan Deshmukh', rollNumber: 'APX-2026-005', email: 'rohan.deshmukh@example.com', attendanceRate: 84 },
      { id: 'std_06', fullName: 'Meera Kulkarni', rollNumber: 'APX-2026-006', email: 'meera.kulkarni@example.com', attendanceRate: 94 },
      { id: 'std_07', fullName: 'Ishaan Gupta', rollNumber: 'APX-2026-007', email: 'ishaan.gupta@example.com', attendanceRate: 78 },
      { id: 'std_08', fullName: 'Sanya Malhotra', rollNumber: 'APX-2026-008', email: 'sanya.malhotra@example.com', attendanceRate: 91 },
    ];

    const enrollments = students.map((s, idx) => ({
      id: `enr_${idx + 1}`,
      instituteId,
      batchId: 'btc_jee_math_adv',
      studentId: s.id,
      rollNumber: s.rollNumber,
      status: 'ACTIVE',
      joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    }));

    const invitations = [
      {
        id: 'inv_01',
        code: 'APX-JEE-9842',
        instituteId,
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        issuerId: teacherId,
        issuerName: 'Prof. Rajesh Sharma',
        maxUses: 40,
        usedCount: 28,
        expiresAt: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(),
        isRevoked: false,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'inv_02',
        code: 'APX-PHY-3310',
        instituteId,
        batchId: 'btc_neet_physics_core',
        batchName: 'Class 11 — Physics Core Batch',
        issuerId: teacherId,
        issuerName: 'Prof. Rajesh Sharma',
        maxUses: 50,
        usedCount: 34,
        expiresAt: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
        isRevoked: false,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    const todayDate = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];

    const attendanceSessions = [
      {
        id: 'att_sess_01',
        instituteId,
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId,
        date: pastDate,
        sessionTime: '09:00 - 10:30 AM',
        totalPresent: 7,
        totalAbsent: 1,
        totalLate: 0,
        totalExcused: 0,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ];

    const attendanceRecords = students.map((s, idx) => ({
      id: `rec_${idx + 1}`,
      sessionId: 'att_sess_01',
      studentId: s.id,
      studentName: s.fullName,
      rollNumber: s.rollNumber,
      status: idx === 6 ? 'ABSENT' : 'PRESENT',
      note: idx === 6 ? 'Uninformed leave' : undefined,
    }));

    const assignments = [
      {
        id: 'asg_01',
        instituteId,
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId,
        title: 'Problem Set 4: Definite Integrals & Riemann Sums',
        instructions: 'Solve all questions from Section 4.2 to 4.5. Submit detailed step-by-step proofs for problems 12 and 18.',
        subject: 'Mathematics',
        dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
        maxMarks: 50,
        status: 'PUBLISHED',
        submissionCount: 19,
        totalStudents: 28,
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'asg_02',
        instituteId,
        batchId: 'btc_neet_physics_core',
        batchName: 'Class 11 — Physics Core Batch',
        teacherId,
        title: 'Rotational Dynamics & Moment of Inertia Worksheet',
        instructions: 'Calculate moment of inertia for composite geometries. Reference standard planar laminas.',
        subject: 'Physics',
        dueDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
        maxMarks: 40,
        status: 'PUBLISHED',
        submissionCount: 26,
        totalStudents: 34,
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    const submissions = [
      {
        id: 'sub_01',
        assignmentId: 'asg_01',
        studentId: 'std_01',
        studentName: 'Aarav Patel',
        rollNumber: 'APX-2026-001',
        submittedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        content: 'Completed problems 1 through 20. Proofs handwritten and attached.',
        status: 'SUBMITTED',
        marksObtained: undefined,
        feedback: undefined,
      },
      {
        id: 'sub_02',
        assignmentId: 'asg_01',
        studentId: 'std_02',
        studentName: 'Diya Sen',
        rollNumber: 'APX-2026-002',
        submittedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
        content: 'All derivations verified with limits.',
        status: 'GRADED',
        marksObtained: 48,
        feedback: 'Flawless evaluation of the second fundamental theorem step.',
      },
    ];

    const tests = [
      {
        id: 'tst_01',
        instituteId,
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId,
        title: 'Differential Calculus Assessment Quiz #1',
        subject: 'Mathematics',
        durationMinutes: 45,
        totalMarks: 30,
        status: 'PUBLISHED',
        resultsReleased: true,
        scheduledDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        questions: [
          {
            id: 'q1',
            text: 'What is the limit of (sin x) / x as x approaches 0?',
            type: 'MCQ',
            options: ['0', '1', 'Infinity', 'Undefined'],
            correctOptionIndex: 1,
            marks: 5,
          },
          {
            id: 'q2',
            text: 'If f(x) = e^(2x), what is f\'\'(x)?',
            type: 'MCQ',
            options: ['2e^(2x)', '4e^(2x)', 'e^(2x)', '4e^x'],
            correctOptionIndex: 1,
            marks: 5,
          },
          {
            id: 'q3',
            text: 'State Rolle\'s Theorem and its physical significance in velocity curves.',
            type: 'TEXT',
            marks: 20,
          },
        ],
        attemptCount: 24,
        averageScore: 23.5,
        createdAt: new Date().toISOString(),
      },
    ];

    const lessonPlans = [
      {
        id: 'lp_01',
        instituteId,
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId,
        title: 'Integral Calculus Mastery: Week 4',
        topic: 'Integration by Parts & Partial Fractions',
        subject: 'Mathematics',
        weekNumber: 4,
        content: 'Cover reduction formulas for trigonometric functions. Focus on standard competitive examination tricks.',
        resources: [
          { title: 'Standard Trigonometric Integral Reduction PDF', type: 'PDF', url: 'https://cdn.padhaipilot.com/docs/reduction-formulas.pdf' },
          { title: 'JEE Advanced 2018–2025 Calculus Questions Archive', type: 'LINK', url: 'https://padhaipilot.com/archives/calculus' },
        ],
        isCompleted: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lp_02',
        instituteId,
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId,
        title: 'Definite Integrals & Areas under Curves: Week 5',
        topic: 'Area bounded by parabolas, ellipses, and piecewise functions',
        subject: 'Mathematics',
        weekNumber: 5,
        content: 'Derive area of standard bounded regions. Coordinate geometry linkage.',
        resources: [],
        isCompleted: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const timetable = [
      {
        id: 'slot_01',
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        subject: 'Calculus',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 302',
      },
      {
        id: 'slot_02',
        batchId: 'btc_neet_physics_core',
        batchName: 'Class 11 — Physics Core Batch',
        subject: 'Physics',
        dayOfWeek: 'MONDAY',
        startTime: '11:00',
        endTime: '12:30',
        room: 'Lecture Hall 1',
      },
      {
        id: 'slot_03',
        batchId: 'btc_foundations_math_10',
        batchName: 'Olympiad Foundation Mathematics',
        subject: 'Number Theory',
        dayOfWeek: 'TUESDAY',
        startTime: '14:00',
        endTime: '15:30',
        room: 'Seminar Room 4',
      },
      {
        id: 'slot_04',
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        subject: 'Vectors & 3D Geometry',
        dayOfWeek: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 302',
      },
      {
        id: 'slot_05',
        batchId: 'btc_neet_physics_core',
        batchName: 'Class 11 — Physics Core Batch',
        subject: 'Mechanics',
        dayOfWeek: 'THURSDAY',
        startTime: '11:00',
        endTime: '12:30',
        room: 'Lecture Hall 1',
      },
    ];

    const announcements = [
      {
        id: 'anc_01',
        instituteId,
        batchId: 'btc_jee_math_adv',
        batchName: 'JEE Advanced — Mathematics Alpha',
        authorId: teacherId,
        authorName: 'Prof. Rajesh Sharma',
        authorRole: 'TEACHER',
        title: 'Special Sunday Problem Solving Session on Advanced Calculus',
        content: 'We will conduct a 2-hour intensive doubt clearance session this Sunday at 10:00 AM in Room 302. Bring past 10-year JEE papers.',
        priority: 'URGENT',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    return {
      batches,
      students,
      enrollments,
      invitations,
      attendanceSessions,
      attendanceRecords,
      assignments,
      submissions,
      tests,
      testAttempts: [],
      lessonPlans,
      timetable,
      announcements,
      auditLogs: [],
    };
  }

  // -------------------------------------------------------------
  // 1. DASHBOARD OVERVIEW (With Redis Caching)
  // -------------------------------------------------------------
  async getDashboardMetrics(user: AuthenticatedUser) {
    const cached = await this.redis.getTeacherDashboard<any>(user.instituteId, user.id);
    if (cached) {
      return cached;
    }

    const batches = this.memoryStore.batches.filter(
      (b) => b.teacherId === user.id && b.instituteId === user.instituteId,
    );

    const totalStudents = batches.reduce((sum, b) => sum + (b.studentCount || 0), 0);
    const pendingReviews = this.memoryStore.submissions.filter(
      (s) => s.status === 'SUBMITTED',
    ).length;

    const today = new Date().toISOString().split('T')[0];
    const recordedBatchIdsToday = new Set(
      this.memoryStore.attendanceSessions
        .filter((s) => s.date === today && s.teacherId === user.id)
        .map((s) => s.batchId),
    );
    const pendingAttendanceCount = batches.filter((b) => !recordedBatchIdsToday.has(b.id)).length;

    const todayDayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
      new Date().getDay()
    ];
    const todaySchedule = this.memoryStore.timetable.filter((t) => t.dayOfWeek === todayDayName);

    const metrics = {
      todayClassesCount: todaySchedule.length,
      assignedBatchesCount: batches.length,
      totalStudentsCount: totalStudents,
      pendingAttendanceCount,
      pendingReviewsCount: pendingReviews,
      recentAnnouncements: this.memoryStore.announcements.slice(0, 3),
      todaySchedule,
      activeBatches: batches,
    };

    // Cache in Redis with isolated tenant-scoped key
    await this.redis.setTeacherDashboard(user.instituteId, user.id, metrics);
    return metrics;
  }

  // -------------------------------------------------------------
  // 2. BATCHES & STUDENT ROSTER
  // -------------------------------------------------------------
  async getBatches(user: AuthenticatedUser) {
    return this.memoryStore.batches.filter(
      (b) => b.teacherId === user.id && b.instituteId === user.instituteId,
    );
  }

  async getBatchRoster(batchId: string, user: AuthenticatedUser) {
    const batch = this.memoryStore.batches.find(
      (b) => b.id === batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
    );

    if (!batch) {
      throw new ForbiddenException('Batch not found or unauthorized for this teacher.');
    }

    return {
      batch,
      students: this.memoryStore.students,
    };
  }

  async createBatch(
    data: { name: string; code: string; subject: string; gradeLevel: string; room?: string },
    user: AuthenticatedUser,
  ) {
    if (!data.name || !data.subject) {
      throw new BadRequestException('Batch name and subject are required.');
    }

    const newBatch = {
      id: `btc_${Date.now()}`,
      instituteId: user.instituteId,
      teacherId: user.id,
      name: data.name,
      code: data.code || `BTC-${Date.now().toString().slice(-4)}`,
      subject: data.subject,
      gradeLevel: data.gradeLevel || 'Standard',
      room: data.room || 'General Classroom',
      studentCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.memoryStore.batches.push(newBatch);
    // Invalidate dashboard cache
    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);
    return newBatch;
  }

  // -------------------------------------------------------------
  // 3. STUDENT INVITATION CODES
  // -------------------------------------------------------------
  async getInvitations(user: AuthenticatedUser) {
    return this.memoryStore.invitations.filter(
      (i) => i.issuerId === user.id && i.instituteId === user.instituteId,
    );
  }

  async createInvitation(
    data: { batchId?: string; maxUses?: number; expiryDays?: number },
    user: AuthenticatedUser,
  ) {
    let batchName: string | undefined;
    if (data.batchId) {
      const batch = this.memoryStore.batches.find(
        (b) => b.id === data.batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
      );
      if (!batch) {
        throw new ForbiddenException('Cannot issue invitation code for unauthorized batch.');
      }
      batchName = batch.name;
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `APX-${randomSuffix.slice(0, 3)}-${randomSuffix.slice(3, 6)}`;
    const expiryDays = data.expiryDays || 14;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 3600 * 1000).toISOString();

    const invitation = {
      id: `inv_${Date.now()}`,
      code,
      instituteId: user.instituteId,
      batchId: data.batchId,
      batchName,
      issuerId: user.id,
      issuerName: user.fullName,
      maxUses: data.maxUses || 50,
      usedCount: 0,
      expiresAt,
      isRevoked: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.memoryStore.invitations.unshift(invitation);
    return invitation;
  }

  async revokeInvitation(code: string, user: AuthenticatedUser) {
    const inv = this.memoryStore.invitations.find(
      (i) => i.code === code && i.issuerId === user.id && i.instituteId === user.instituteId,
    );

    if (!inv) {
      throw new NotFoundException('Invitation code not found or unauthorized.');
    }

    inv.isRevoked = true;
    inv.status = 'REVOKED';
    return { success: true, message: `Code ${code} successfully revoked.` };
  }

  async validateCodePublic(code: string, ip: string = '127.0.0.1') {
    // Rate limit check: max 10 code validations per minute per IP to prevent automated token enumeration
    await this.redis.enforceRateLimit(ip, 'invitationValidate');

    const inv = this.memoryStore.invitations.find((i) => i.code === code);
    if (!inv || inv.isRevoked || new Date(inv.expiresAt) < new Date() || inv.usedCount >= inv.maxUses) {
      throw new BadRequestException('This invitation code is invalid, expired, or has reached maximum usage.');
    }

    return {
      valid: true,
      batchName: inv.batchName || 'General Institute Admission',
      instituteName: 'Apex IIT-JEE & Medical Academy',
    };
  }

  // -------------------------------------------------------------
  // 4. ATTENDANCE WORKFLOWS
  // -------------------------------------------------------------
  async getAttendanceSession(batchId: string, date: string, user: AuthenticatedUser) {
    const batch = this.memoryStore.batches.find(
      (b) => b.id === batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
    );

    if (!batch) {
      throw new ForbiddenException('Batch unauthorized.');
    }

    const session = this.memoryStore.attendanceSessions.find(
      (s) => s.batchId === batchId && s.date === date,
    );

    if (!session) {
      const defaultRecords = this.memoryStore.students.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        rollNumber: s.rollNumber,
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

    const records = this.memoryStore.attendanceRecords.filter((r) => r.sessionId === session.id);
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
    const batch = this.memoryStore.batches.find(
      (b) => b.id === data.batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
    );
    if (!batch) {
      throw new ForbiddenException('Unauthorized batch.');
    }

    let session = this.memoryStore.attendanceSessions.find(
      (s) => s.batchId === data.batchId && s.date === data.date,
    );

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

    if (session) {
      session.totalPresent = present;
      session.totalAbsent = absent;
      session.totalLate = late;
      session.totalExcused = excused;
      session.updatedAt = new Date().toISOString();

      this.memoryStore.attendanceRecords = this.memoryStore.attendanceRecords.filter(
        (r) => r.sessionId !== session.id,
      );
    } else {
      session = {
        id: `att_sess_${Date.now()}`,
        instituteId: user.instituteId,
        batchId: data.batchId,
        batchName: batch.name,
        teacherId: user.id,
        date: data.date,
        sessionTime: 'Regular Class',
        totalPresent: present,
        totalAbsent: absent,
        totalLate: late,
        totalExcused: excused,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.memoryStore.attendanceSessions.push(session);
    }

    data.records.forEach((r, idx) => {
      const student = this.memoryStore.students.find((s) => s.id === r.studentId);
      this.memoryStore.attendanceRecords.push({
        id: `rec_${Date.now()}_${idx}`,
        sessionId: session.id,
        studentId: r.studentId,
        studentName: student?.fullName || 'Student',
        rollNumber: student?.rollNumber || '',
        status: r.status,
        note: r.note,
      });
    });

    // Invalidate dashboard cache
    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);

    return {
      success: true,
      message: `Attendance for ${batch.name} (${data.date}) saved successfully.`,
      session,
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

    const record = this.memoryStore.attendanceRecords.find((r) => r.id === recordId);
    if (!record) {
      throw new NotFoundException('Attendance record not found.');
    }

    record.status = data.status;
    record.correctionReason = data.reason;
    record.updatedBy = user.id;

    return { success: true, record };
  }

  // -------------------------------------------------------------
  // 5. ASSIGNMENTS & HOMEWORK
  // -------------------------------------------------------------
  async getAssignments(user: AuthenticatedUser) {
    return this.memoryStore.assignments.filter(
      (a) => a.teacherId === user.id && a.instituteId === user.instituteId,
    );
  }

  async createAssignment(
    data: {
      batchId: string;
      title: string;
      instructions: string;
      subject: string;
      dueDate: string;
      maxMarks?: number;
    },
    user: AuthenticatedUser,
  ) {
    const batch = this.memoryStore.batches.find(
      (b) => b.id === data.batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
    );
    if (!batch) {
      throw new ForbiddenException('Unauthorized batch.');
    }

    const assignment = {
      id: `asg_${Date.now()}`,
      instituteId: user.instituteId,
      batchId: data.batchId,
      batchName: batch.name,
      teacherId: user.id,
      title: data.title,
      instructions: data.instructions,
      subject: data.subject,
      dueDate: data.dueDate,
      maxMarks: data.maxMarks || 100,
      status: 'PUBLISHED',
      submissionCount: 0,
      totalStudents: batch.studentCount || 28,
      createdAt: new Date().toISOString(),
    };

    this.memoryStore.assignments.unshift(assignment);
    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);
    return assignment;
  }

  async getSubmissions(assignmentId: string, user: AuthenticatedUser) {
    const assignment = this.memoryStore.assignments.find(
      (a) => a.id === assignmentId && a.teacherId === user.id && a.instituteId === user.instituteId,
    );
    if (!assignment) {
      throw new ForbiddenException('Unauthorized assignment.');
    }

    const subs = this.memoryStore.submissions.filter((s) => s.assignmentId === assignmentId);
    return {
      assignment,
      submissions: subs,
    };
  }

  async gradeSubmission(
    submissionId: string,
    data: { marksObtained: number; feedback?: string; resubmit?: boolean },
    user: AuthenticatedUser,
  ) {
    const sub = this.memoryStore.submissions.find((s) => s.id === submissionId);
    if (!sub) {
      throw new NotFoundException('Submission not found.');
    }

    sub.marksObtained = data.marksObtained;
    sub.feedback = data.feedback;
    sub.status = data.resubmit ? 'RESUBMIT' : 'GRADED';
    sub.gradedAt = new Date().toISOString();
    sub.gradedBy = user.id;

    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);
    return { success: true, submission: sub };
  }

  // -------------------------------------------------------------
  // 6. TESTS & QUIZZES (Assessment Engine)
  // -------------------------------------------------------------
  async getTests(user: AuthenticatedUser) {
    return this.memoryStore.tests.filter(
      (t) => t.teacherId === user.id && t.instituteId === user.instituteId,
    );
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
    const batch = this.memoryStore.batches.find(
      (b) => b.id === data.batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
    );
    if (!batch) {
      throw new ForbiddenException('Unauthorized batch.');
    }

    const totalMarks = data.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

    const test = {
      id: `tst_${Date.now()}`,
      instituteId: user.instituteId,
      batchId: data.batchId,
      batchName: batch.name,
      teacherId: user.id,
      title: data.title,
      subject: data.subject,
      durationMinutes: data.durationMinutes || 45,
      totalMarks: totalMarks || 30,
      status: 'PUBLISHED',
      resultsReleased: false,
      scheduledDate: data.scheduledDate,
      questions: data.questions,
      attemptCount: 0,
      averageScore: 0,
      createdAt: new Date().toISOString(),
    };

    this.memoryStore.tests.unshift(test);
    return test;
  }

  async toggleTestResults(testId: string, user: AuthenticatedUser) {
    const test = this.memoryStore.tests.find(
      (t) => t.id === testId && t.teacherId === user.id && t.instituteId === user.instituteId,
    );
    if (!test) throw new NotFoundException('Test not found.');

    test.resultsReleased = !test.resultsReleased;
    return { success: true, resultsReleased: test.resultsReleased };
  }

  // -------------------------------------------------------------
  // 7. LESSON PLANS & SYLLABUS TOPICS
  // -------------------------------------------------------------
  async getLessonPlans(user: AuthenticatedUser) {
    return this.memoryStore.lessonPlans.filter(
      (lp) => lp.teacherId === user.id && lp.instituteId === user.instituteId,
    );
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
    const batch = this.memoryStore.batches.find(
      (b) => b.id === data.batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
    );
    if (!batch) throw new ForbiddenException('Unauthorized batch.');

    const plan = {
      id: `lp_${Date.now()}`,
      instituteId: user.instituteId,
      batchId: data.batchId,
      batchName: batch.name,
      teacherId: user.id,
      title: data.title,
      topic: data.topic,
      subject: data.subject,
      weekNumber: data.weekNumber || 1,
      content: data.content,
      resources: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    this.memoryStore.lessonPlans.push(plan);
    return plan;
  }

  async toggleLessonPlanStatus(planId: string, user: AuthenticatedUser) {
    const plan = this.memoryStore.lessonPlans.find(
      (lp) => lp.id === planId && lp.teacherId === user.id && lp.instituteId === user.instituteId,
    );
    if (!plan) throw new NotFoundException('Lesson plan not found.');

    plan.isCompleted = !plan.isCompleted;
    return { success: true, isCompleted: plan.isCompleted };
  }

  // -------------------------------------------------------------
  // 8. TIMETABLE
  // -------------------------------------------------------------
  async getTimetable(user: AuthenticatedUser) {
    return this.memoryStore.timetable;
  }

  // -------------------------------------------------------------
  // 9. ANNOUNCEMENTS
  // -------------------------------------------------------------
  async getAnnouncements(user: AuthenticatedUser) {
    return this.memoryStore.announcements.filter(
      (a) => a.instituteId === user.instituteId,
    );
  }

  async createAnnouncement(
    data: { batchId?: string; title: string; content: string; priority?: 'NORMAL' | 'URGENT' },
    user: AuthenticatedUser,
  ) {
    let batchName = 'All Batches';
    if (data.batchId) {
      const batch = this.memoryStore.batches.find(
        (b) => b.id === data.batchId && b.teacherId === user.id && b.instituteId === user.instituteId,
      );
      if (batch) batchName = batch.name;
    }

    const announcement = {
      id: `anc_${Date.now()}`,
      instituteId: user.instituteId,
      batchId: data.batchId,
      batchName,
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      title: data.title,
      content: data.content,
      priority: data.priority || 'NORMAL',
      createdAt: new Date().toISOString(),
    };

    this.memoryStore.announcements.unshift(announcement);
    await this.redis.invalidateTeacherDashboard(user.instituteId, user.id);
    return announcement;
  }

  // -------------------------------------------------------------
  // 10. TEACHER ANALYTICS & REPORTS
  // -------------------------------------------------------------
  async getReports(user: AuthenticatedUser) {
    const batches = await this.getBatches(user);
    const totalStudents = batches.reduce((sum, b) => sum + (b.studentCount || 0), 0);

    return {
      attendanceTrends: [
        { label: 'Week 1', rate: 94 },
        { label: 'Week 2', rate: 91 },
        { label: 'Week 3', rate: 95 },
        { label: 'Week 4', rate: 92 },
      ],
      submissionMetrics: {
        totalAssigned: this.memoryStore.assignments.length,
        submittedCount: 45,
        gradedCount: 38,
        pendingReviewCount: 7,
      },
      batchPerformance: batches.map((b) => ({
        batchName: b.name,
        code: b.code,
        studentCount: b.studentCount,
        averageAttendance: 93,
        assignmentTurnaround: '94%',
      })),
      summary: {
        totalBatches: batches.length,
        totalStudents,
        averageClassAttendance: '93.2%',
        totalTestsConducted: this.memoryStore.tests.length,
      },
    };
  }
}
