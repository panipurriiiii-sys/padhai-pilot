import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccessService } from '../common/access/access.service.js';
import { isManagement } from '../common/security/roles.js';
import { LOGO_EXTENSIONS, validateMediaUrl } from '../common/security/media-url.js';
import type { AuthenticatedUser } from '../common/types.js';
import type { InstituteLetterhead } from '@padhai-pilot/shared';
import { calculateGradeAndPercentage } from '@padhai-pilot/shared';
import { renderDocument, type DocSpec } from './pdf-layout.js';
import {
  attendanceBatchSpec,
  attendanceStudentSpec,
  feeReceiptSpec,
  reportCardSpec,
  resultSheetSpec,
  salarySlipSpec,
} from './document-specs.js';
import { toLetterhead } from '../finance/branding.service.js';
import { parseDay } from '../finance/fee-core.js';

export interface PdfResult {
  bytes: Uint8Array;
  fileName: string;
}

const MAX_LOGO_BYTES = 1_500_000;
const logoCache = new Map<string, { at: number; bytes: Uint8Array | null }>();
const day = (d: Date): string => d.toISOString().slice(0, 10);
const safeName = (s: string): string => s.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 80);

/** Fetches the institute logo (allowed media host only, 3s, 1.5 MB cap). Any failure -> no logo, never an error. */
export async function fetchLogoBytes(url: string | undefined, fetchImpl: typeof fetch = fetch): Promise<Uint8Array | undefined> {
  if (!url) return undefined;
  let safe: string | undefined;
  try {
    safe = validateMediaUrl(url, 'logoUrl', LOGO_EXTENSIONS);
  } catch {
    return undefined;
  }
  if (!safe) return undefined;
  const hit = logoCache.get(safe);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.bytes ?? undefined;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 3000);
  try {
    const res = await fetchImpl(safe, { signal: ctl.signal, redirect: 'error' });
    const len = Number(res.headers.get('content-length') ?? 0);
    if (!res.ok || len > MAX_LOGO_BYTES) throw new Error('logo unavailable');
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > MAX_LOGO_BYTES) throw new Error('logo too large');
    logoCache.set(safe, { at: Date.now(), bytes: buf });
    if (logoCache.size > 20) logoCache.delete(logoCache.keys().next().value as string);
    return buf;
  } catch {
    logoCache.set(safe, { at: Date.now(), bytes: null });
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

@Injectable()
export class DocumentsService {
  constructor(@Inject(AccessService) private readonly access: AccessService) {}

  private async brand(instituteId: string): Promise<InstituteLetterhead> {
    const db = this.access.db();
    const i = await db.institute.findUnique({
      where: { id: instituteId },
      select: { name: true, logoUrl: true, address: true, contactPhone: true, contactEmail: true, website: true, footerText: true, signatoryName: true, signatoryTitle: true, primaryColor: true },
    });
    if (!i) throw new NotFoundException('Institute not found.');
    return toLetterhead(i as Record<string, string | null>);
  }

  private async render(user: AuthenticatedUser, spec: DocSpec): Promise<Uint8Array> {
    const brand = await this.brand(user.instituteId);
    const logo = await fetchLogoBytes(brand.logoUrl);
    return (await renderDocument(spec, brand, logo)).bytes;
  }

  private isStaff(user: AuthenticatedUser): boolean {
    return user.role !== 'STUDENT';
  }

  // ------------------------------------------------------------------ fee receipt
  async feeReceipt(user: AuthenticatedUser, paymentId: string): Promise<PdfResult> {
    const db = this.access.db();
    const p = await db.feePayment.findFirst({
      where: { id: paymentId, instituteId: user.instituteId },
      include: { feeRecord: { include: { batch: { select: { name: true } } } } },
    });
    if (!p) throw new NotFoundException('Receipt not found.');
    if (this.isStaff(user)) {
      if (p.feeRecord.batchId) await this.access.assertBatchAccess(user, p.feeRecord.batchId);
      else if (!isManagement(user.role)) throw new ForbiddenException();
    } else if (p.studentId !== user.id) {
      throw new NotFoundException('Receipt not found.');
    }
    const [student, enrol, recorder] = await Promise.all([
      db.user.findUnique({ where: { id: p.studentId }, select: { fullName: true } }),
      p.feeRecord.batchId
        ? db.enrollment.findFirst({ where: { batchId: p.feeRecord.batchId, studentId: p.studentId }, select: { rollNumber: true } })
        : Promise.resolve(null),
      db.user.findUnique({ where: { id: p.recordedById }, select: { fullName: true } }),
    ]);
    const spec = feeReceiptSpec({
      receiptNumber: p.receiptNumber,
      paidOn: day(p.paidOn),
      amount: p.amount,
      mode: p.mode,
      reference: p.reference ?? undefined,
      voided: p.status === 'VOIDED',
      voidReason: p.voidReason ?? undefined,
      studentName: student?.fullName ?? 'Student',
      rollNumber: enrol?.rollNumber,
      batchName: p.feeRecord.batch?.name,
      feeTitle: p.feeRecord.feeTitle,
      feeTotal: p.feeRecord.totalAmount,
      paidToDate: p.feeRecord.paidAmount,
      academicYear: p.feeRecord.academicYear ?? undefined,
      receivedBy: recorder?.fullName,
    });
    return { bytes: await this.render(user, spec), fileName: `Receipt-${safeName(p.receiptNumber)}.pdf` };
  }

  // ------------------------------------------------------------------ report card
  async reportCard(user: AuthenticatedUser, studentIdParam: string, batchId: string): Promise<PdfResult> {
    const db = this.access.db();
    const studentId = this.isStaff(user) ? studentIdParam : user.id;
    if (this.isStaff(user)) await this.access.assertBatchAccess(user, batchId);
    else await this.access.assertStudentInBatch(user, batchId);
    const enrol = await db.enrollment.findFirst({
      where: { instituteId: user.instituteId, batchId, studentId },
      select: { rollNumber: true, student: { select: { fullName: true } }, batch: { select: { name: true } } },
    });
    if (!enrol) throw new NotFoundException('Student is not enrolled in this batch.');
    const [marks, institute, att] = await Promise.all([
      db.assessmentMark.findMany({
        where: { studentId, isPublished: true, assessment: { instituteId: user.instituteId, batchId, status: 'PUBLISHED' } },
        include: { assessment: { select: { title: true, subject: true, assessmentDate: true, maxMarks: true } } },
        orderBy: { assessment: { assessmentDate: 'asc' } },
        take: 200,
      }),
      db.institute.findUnique({ where: { id: user.instituteId }, select: { academicYear: true } }),
      db.attendanceRecord.groupBy({
        by: ['status'],
        where: { studentId, session: { batchId, instituteId: user.instituteId } },
        _count: { _all: true },
      }),
    ]);
    const attTotal = att.reduce((a, r) => a + r._count._all, 0);
    const attOk = att.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').reduce((a, r) => a + r._count._all, 0);
    const spec = reportCardSpec({
      studentName: enrol.student.fullName,
      rollNumber: enrol.rollNumber,
      batchName: enrol.batch.name,
      academicYear: institute?.academicYear ?? undefined,
      attendancePct: attTotal ? Math.round((attOk / attTotal) * 1000) / 10 : undefined,
      rows: marks.map((m) => ({
        title: m.assessment.title,
        subject: m.assessment.subject,
        date: day(m.assessment.assessmentDate),
        max: m.assessment.maxMarks,
        obtained: m.resultStatus === 'SCORED' ? m.obtainedMarks : null,
        pct: m.percentage ?? null,
        grade: m.grade ?? null,
        status: m.resultStatus === 'ABSENT' ? 'Absent' : m.resultStatus === 'EXCUSED' ? 'Excused' : 'Pending',
      })),
    });
    return { bytes: await this.render(user, spec), fileName: `ReportCard-${safeName(enrol.rollNumber)}.pdf` };
  }

  // ------------------------------------------------------------------ salary slip
  async salarySlip(user: AuthenticatedUser, recordId: string): Promise<PdfResult> {
    const db = this.access.db();
    const rec = await db.salaryRecord.findFirst({
      where: { id: recordId, instituteId: user.instituteId },
      include: { faculty: { select: { fullName: true } } },
    });
    if (!rec) throw new NotFoundException('Salary record not found.');
    if (!isManagement(user.role) && rec.facultyId !== user.id) throw new NotFoundException('Salary record not found.');
    if (user.role === 'STUDENT') throw new ForbiddenException();
    if (rec.status === 'DRAFT' && !isManagement(user.role)) throw new NotFoundException('Salary record not found.');
    const profile = await db.facultyProfile.findFirst({
      where: { instituteId: user.instituteId, userId: rec.facultyId },
      select: { designation: true },
    });
    const spec = salarySlipSpec({
      facultyName: rec.faculty.fullName,
      designation: profile?.designation,
      payPeriod: rec.payPeriod,
      compensationModel: rec.compensationModel,
      classesConducted: rec.classesConducted,
      baseAmount: rec.baseAmount,
      additions: rec.additions,
      deductions: rec.deductions,
      advances: rec.advances,
      netPayable: rec.netPayable,
      status: rec.status,
      paymentDate: rec.paymentDate ? day(rec.paymentDate) : undefined,
      paymentMethod: rec.paymentMethod ?? undefined,
      paymentReference: rec.paymentReference ?? undefined,
      remarks: rec.remarks ?? undefined,
    });
    return { bytes: await this.render(user, spec), fileName: `SalarySlip-${safeName(rec.payPeriod)}.pdf` };
  }

  // ------------------------------------------------------------------ attendance report
  async attendance(user: AuthenticatedUser, q: { batchId?: string; studentId?: string; from?: string; to?: string }): Promise<PdfResult> {
    const db = this.access.db();
    const to = q.to ? parseDay(q.to, 'to') : parseDay(day(new Date()), 'to');
    const from = q.from ? parseDay(q.from, 'from') : new Date(to.getTime() - 29 * 86_400_000);
    if (from > to) throw new BadRequestException('from must not be after to.');
    if (to.getTime() - from.getTime() > 366 * 86_400_000) throw new BadRequestException('Range is limited to one year.');

    let batchId = q.batchId;
    let studentId = q.studentId;
    if (!this.isStaff(user)) {
      studentId = user.id;
      if (!batchId) {
        const ids = await this.access.studentBatchIds(user);
        if (ids.length !== 1) throw new BadRequestException('batchId is required.');
        batchId = ids[0];
      } else await this.access.assertStudentInBatch(user, batchId);
    } else {
      if (!batchId) throw new BadRequestException('batchId is required.');
      await this.access.assertBatchAccess(user, batchId);
    }
    const batch = await db.batch.findFirst({ where: { id: batchId, instituteId: user.instituteId }, select: { name: true } });
    if (!batch) throw new NotFoundException('Batch not found.');

    const records = await db.attendanceRecord.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        session: { batchId, instituteId: user.instituteId, date: { gte: from, lte: to } },
      },
      select: { studentId: true, status: true, note: true, session: { select: { date: true } } },
      orderBy: { session: { date: 'asc' } },
      take: 20000,
    });
    const enrolls = await db.enrollment.findMany({
      where: { instituteId: user.instituteId, batchId, status: 'ACTIVE', ...(studentId ? { studentId } : {}) },
      select: { studentId: true, rollNumber: true, student: { select: { fullName: true } } },
      orderBy: { rollNumber: 'asc' },
      take: 2000,
    });
    let spec: DocSpec;
    if (studentId) {
      const e = enrolls[0];
      if (!e) throw new NotFoundException('Student is not enrolled in this batch.');
      spec = attendanceStudentSpec({
        studentName: e.student.fullName,
        rollNumber: e.rollNumber,
        batchName: batch.name,
        from: day(from),
        to: day(to),
        records: records.map((r) => ({ date: day(r.session.date), status: r.status, note: r.note ?? undefined })),
      });
    } else {
      const sessions = await db.attendanceSession.count({ where: { batchId, instituteId: user.instituteId, date: { gte: from, lte: to } } });
      const tally = new Map<string, { present: number; absent: number; late: number; excused: number }>();
      for (const r of records) {
        const t = tally.get(r.studentId) ?? { present: 0, absent: 0, late: 0, excused: 0 };
        if (r.status === 'PRESENT') t.present++;
        else if (r.status === 'ABSENT') t.absent++;
        else if (r.status === 'LATE') t.late++;
        else t.excused++;
        tally.set(r.studentId, t);
      }
      spec = attendanceBatchSpec({
        batchName: batch.name,
        from: day(from),
        to: day(to),
        sessions,
        rows: enrolls.map((e) => ({ roll: e.rollNumber, name: e.student.fullName, ...(tally.get(e.studentId) ?? { present: 0, absent: 0, late: 0, excused: 0 }) })),
      });
    }
    return { bytes: await this.render(user, spec), fileName: `Attendance-${safeName(batch.name)}.pdf` };
  }

  // ------------------------------------------------------------------ result sheet (staff)
  async resultSheet(user: AuthenticatedUser, assessmentId: string): Promise<PdfResult> {
    const db = this.access.db();
    const a = await db.classroomAssessment.findFirst({
      where: { id: assessmentId, instituteId: user.instituteId },
      include: { batch: { select: { name: true } } },
    });
    if (!a) throw new NotFoundException('Assessment not found.');
    await this.access.assertBatchAccess(user, a.batchId);
    const marks = await db.assessmentMark.findMany({
      where: { assessmentId },
      include: { student: { select: { fullName: true, enrollments: { where: { batchId: a.batchId }, select: { rollNumber: true }, take: 1 } } } },
      take: 2000,
    });
    const rows = marks
      .map((m) => {
        const calc = m.obtainedMarks !== null && m.obtainedMarks !== undefined ? calculateGradeAndPercentage(m.obtainedMarks, a.maxMarks) : { percentage: null, grade: null };
        return {
          roll: m.student.enrollments[0]?.rollNumber ?? '-',
          name: m.student.fullName,
          obtained: m.resultStatus === 'SCORED' ? m.obtainedMarks : null,
          pct: m.percentage ?? calc.percentage,
          grade: m.grade ?? calc.grade,
          status: m.resultStatus === 'ABSENT' ? 'Absent' : m.resultStatus === 'EXCUSED' ? 'Excused' : 'Pending',
        };
      })
      .sort((x, y) => x.roll.localeCompare(y.roll, undefined, { numeric: true }));
    const spec = resultSheetSpec({
      title: a.title,
      subject: a.subject,
      batchName: a.batch.name,
      date: day(a.assessmentDate),
      maxMarks: a.maxMarks,
      passingMarks: a.passingMarks ?? undefined,
      published: a.status === 'PUBLISHED',
      rows,
    });
    return { bytes: await this.render(user, spec), fileName: `ResultSheet-${safeName(a.title)}.pdf` };
  }
}
