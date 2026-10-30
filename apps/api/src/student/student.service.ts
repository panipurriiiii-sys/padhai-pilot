import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssessmentService } from '../assessment/assessment.service.js';
import { TuitionService } from '../tuition/tuition.service.js';
import type { AuthenticatedUser } from '../common/types.js';

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

@Injectable()
export class StudentService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AssessmentService) private readonly assessmentService: AssessmentService,
    @Inject(TuitionService) private readonly tuitionService: TuitionService,
  ) {}

  async getDashboard(user: AuthenticatedUser) {
    const [results, materials, attendance, announcements, fees] = await Promise.all([
      this.assessmentService.getStudentPublishedResults(user),
      this.assessmentService.getStudentStudyMaterials(user),
      this.getAttendance(user),
      this.getAnnouncements(user),
      this.getFees(user),
    ]);

    const scoredResults = results.filter((r) => r.resultStatus === 'SCORED' && r.percentage !== null);
    const avgScore =
      scoredResults.length > 0
        ? Math.round(
            scoredResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
              scoredResults.length,
          )
        : 0;

    return {
      student: {
        id: user.id,
        fullName: user.fullName || 'Student',
        email: user.email,
        rollNumber: 'APX-2026-001',
        instituteName: user.instituteName || 'Apex IIT-JEE & Medical Academy',
        batchName: 'JEE Advanced — Mathematics Alpha',
      },
      stats: {
        totalTests: results.length,
        avgPercentage: avgScore,
        attendanceRate: attendance.percentage,
        totalMaterials: materials.length,
        feeBalance: fees.balanceDue,
      },
      recentResults: results.slice(0, 3),
      recentMaterials: materials.slice(0, 3),
      announcements: announcements.slice(0, 2),
      timetable: [
        { time: '09:00 AM - 10:30 AM', subject: 'Mathematics (Calculus)', room: 'Lecture Hall 2', faculty: 'Prof. Rajesh Sharma' },
        { time: '11:00 AM - 12:30 PM', subject: 'Physics (Optics)', room: 'Physics Lab A', faculty: 'Dr. Alok Verma' },
        { time: '02:00 PM - 03:30 PM', subject: 'Daily Problem Practice (DPP)', room: 'Study Wing 3', faculty: 'Faculty Assistant' },
      ],
    };
  }

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

    // High fidelity realistic mock attendance for student
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

  async getResults(user: AuthenticatedUser) {
    return this.assessmentService.getStudentPublishedResults(user);
  }

  async getMaterials(user: AuthenticatedUser, batchId?: string, category?: string) {
    return this.assessmentService.getStudentStudyMaterials(user, batchId, category);
  }

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

  async getAnnouncements(user: AuthenticatedUser): Promise<StudentAnnouncementItem[]> {
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
}
