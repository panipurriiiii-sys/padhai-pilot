import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccessService } from '../common/access/access.service.js';
import { clampLimit, optionalString, requireString } from '../common/db/db.js';
import type { AuthenticatedUser } from '../common/types.js';
import type {
  BatchFeeStructureItem,
  BatchFeeSummary,
  FeeLedgerItem,
  FeePaymentItem,
  PaymentMode,
  SendFeeRemindersResult,
  StudentFeeLedger,
} from '@padhai-pilot/shared';
import {
  buildSchedule,
  computeFeeStatus,
  inheritBatchFees,
  parseAmount,
  parseDay,
  recordTitle,
  round2,
  type ScheduleEntry,
} from './fee-core.js';

const MODES: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER'];
const dayStr = (d: Date): string => d.toISOString().slice(0, 10);

const toPayment = (p: any, recordedByName?: string): FeePaymentItem => ({
  id: p.id,
  feeRecordId: p.feeRecordId,
  studentId: p.studentId,
  amount: p.amount,
  paidOn: dayStr(p.paidOn),
  mode: p.mode,
  reference: p.reference ?? undefined,
  note: p.note ?? undefined,
  receiptNumber: p.receiptNumber,
  status: p.status,
  voidReason: p.voidReason ?? undefined,
  voidedAt: p.voidedAt ? p.voidedAt.toISOString() : undefined,
  recordedByName,
  createdAt: p.createdAt.toISOString(),
});

const toLedger = (r: any, now: Date): FeeLedgerItem => ({
  id: r.id,
  studentId: r.studentId,
  studentName: r.student?.fullName,
  rollNumber: r.student?.enrollments?.[0]?.rollNumber,
  batchId: r.batchId ?? undefined,
  batchName: r.batch?.name,
  structureId: r.structureId ?? undefined,
  feeTitle: r.feeTitle,
  instalmentNo: r.instalmentNo ?? 1,
  totalAmount: r.totalAmount,
  paidAmount: r.paidAmount,
  balanceDue: round2(Math.max(0, r.totalAmount - r.paidAmount)),
  dueDate: dayStr(r.dueDate),
  status: computeFeeStatus(r, now),
  academicYear: r.academicYear ?? undefined,
  payments: (r.payments ?? []).map((p: any) => toPayment(p)),
});

/**
 * Batch fees, manual payments, receipts, reminders. Tenant id and user id always come from the verified
 * JWT; staff authority over a batch comes from AccessService.assertBatchAccess.
 */
@Injectable()
export class FinanceService {
  constructor(@Inject(AccessService) private readonly access: AccessService) {}

  // ------------------------------------------------------------------ structures
  async createStructure(user: AuthenticatedUser, batchId: string, body: any): Promise<BatchFeeStructureItem> {
    const db = this.access.db();
    await this.access.assertActiveMembership(user);
    const batch = await this.access.assertBatchAccess(user, batchId);
    const title = requireString(body?.title, 'title', 120);
    const academicYear = optionalString(body?.academicYear, 'academicYear', 20);
    const schedule = buildSchedule(body ?? {});

    return db.$transaction(async (tx: any) => {
      const structure = await tx.batchFeeStructure.create({
        data: { instituteId: user.instituteId, batchId: batch.id, title, academicYear, schedule, createdById: user.id },
      });
      const enrolled = await tx.enrollment.findMany({
        where: { instituteId: user.instituteId, batchId: batch.id, status: 'ACTIVE' },
        select: { studentId: true },
        take: 2000,
      });
      const data = enrolled.flatMap((e: { studentId: string }) =>
        schedule.map((entry, idx) => ({
          instituteId: user.instituteId,
          studentId: e.studentId,
          batchId: batch.id,
          structureId: structure.id,
          instalmentNo: idx + 1,
          feeTitle: recordTitle(title, entry, schedule.length),
          totalAmount: entry.amount,
          paidAmount: 0,
          dueDate: new Date(`${entry.dueDate}T00:00:00.000Z`),
          status: 'PENDING',
          academicYear,
        })),
      );
      if (data.length) await tx.studentFeeRecord.createMany({ data, skipDuplicates: true });
      await tx.auditLog.create({
        data: {
          instituteId: user.instituteId,
          userId: user.id,
          actorEmail: user.email,
          action: 'FEE_STRUCTURE_CREATED',
          resourceType: 'BatchFeeStructure',
          resourceId: structure.id,
          metadata: { batchId: batch.id, title, schedule, students: enrolled.length },
        },
      });
      return this.toStructure(structure, schedule, enrolled.length);
    });
  }

  private toStructure(s: any, schedule: ScheduleEntry[], students: number): BatchFeeStructureItem {
    return {
      id: s.id,
      batchId: s.batchId,
      title: s.title,
      academicYear: s.academicYear ?? undefined,
      status: s.status,
      schedule: schedule.map((e, i) => ({ ...e, label: e.label || (schedule.length > 1 ? `Instalment ${i + 1}` : s.title) })),
      totalPerStudent: round2(schedule.reduce((a, e) => a + e.amount, 0)),
      studentsCharged: students,
      createdAt: s.createdAt.toISOString(),
    };
  }

  async listStructures(user: AuthenticatedUser, batchId: string): Promise<BatchFeeStructureItem[]> {
    const db = this.access.db();
    await this.access.assertBatchAccess(user, batchId);
    const rows = await db.batchFeeStructure.findMany({
      where: { instituteId: user.instituteId, batchId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const counts = await db.studentFeeRecord.groupBy({
      by: ['structureId'],
      where: { instituteId: user.instituteId, structureId: { in: rows.map((r) => r.id) }, instalmentNo: 1 },
      _count: { _all: true },
    });
    const byId = new Map(counts.map((c) => [c.structureId, c._count._all]));
    return rows.map((r) => this.toStructure(r, r.schedule as unknown as ScheduleEntry[], byId.get(r.id) ?? 0));
  }

  /** Voids a plan and its records. Refused when any live payment exists (void those payments first). */
  async voidStructure(user: AuthenticatedUser, id: string, reasonRaw: unknown): Promise<{ success: true }> {
    const db = this.access.db();
    await this.access.assertActiveMembership(user);
    const reason = requireString(reasonRaw, 'reason', 300);
    const s = await db.batchFeeStructure.findFirst({ where: { id, instituteId: user.instituteId } });
    if (!s) throw new NotFoundException('Fee structure not found.');
    await this.access.assertBatchAccess(user, s.batchId);
    const live = await db.feePayment.count({
      where: { instituteId: user.instituteId, status: 'ISSUED', feeRecord: { structureId: id } },
    });
    if (live > 0) throw new ConflictException('Payments exist against this fee. Void those payments first.');
    const now = new Date();
    await db.$transaction(async (tx: any) => {
      await tx.batchFeeStructure.update({ where: { id }, data: { status: 'VOID', voidedAt: now, voidReason: reason } });
      await tx.studentFeeRecord.updateMany({
        where: { structureId: id, instituteId: user.instituteId },
        data: { voidedAt: now, voidReason: reason },
      });
      await tx.auditLog.create({
        data: {
          instituteId: user.instituteId,
          userId: user.id,
          actorEmail: user.email,
          action: 'FEE_STRUCTURE_VOIDED',
          resourceType: 'BatchFeeStructure',
          resourceId: id,
          details: reason,
        },
      });
    });
    return { success: true };
  }

  // ------------------------------------------------------------------ ledger + summary
  async batchLedger(user: AuthenticatedUser, batchId: string, studentId?: string): Promise<FeeLedgerItem[]> {
    const db = this.access.db();
    await this.access.assertBatchAccess(user, batchId);
    const rows = await db.studentFeeRecord.findMany({
      where: { instituteId: user.instituteId, batchId, voidedAt: null, ...(studentId ? { studentId } : {}) },
      include: {
        student: { select: { fullName: true, enrollments: { where: { batchId }, select: { rollNumber: true }, take: 1 } } },
        batch: { select: { name: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      take: 2000,
    });
    const now = new Date();
    return rows.map((r) => toLedger(r, now));
  }

  async batchSummary(user: AuthenticatedUser, batchId: string): Promise<BatchFeeSummary> {
    const db = this.access.db();
    await this.access.assertBatchAccess(user, batchId);
    const rows = await db.studentFeeRecord.findMany({
      where: { instituteId: user.instituteId, batchId, voidedAt: null },
      select: { studentId: true, totalAmount: true, paidAmount: true, dueDate: true, voidedAt: true },
      take: 5000,
    });
    const now = new Date();
    const s: BatchFeeSummary = {
      batchId,
      totalReceivable: 0,
      totalCollected: 0,
      totalPending: 0,
      overdueAmount: 0,
      studentCount: new Set(rows.map((r) => r.studentId)).size,
      paidCount: 0,
      partialCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    };
    for (const r of rows) {
      const st = computeFeeStatus(r, now);
      const bal = Math.max(0, r.totalAmount - r.paidAmount);
      s.totalReceivable += r.totalAmount;
      s.totalCollected += r.paidAmount;
      s.totalPending += bal;
      if (st === 'PAID') s.paidCount++;
      else if (st === 'PARTIAL') s.partialCount++;
      else if (st === 'OVERDUE') {
        s.overdueCount++;
        s.overdueAmount += bal;
      } else s.pendingCount++;
    }
    s.totalReceivable = round2(s.totalReceivable);
    s.totalCollected = round2(s.totalCollected);
    s.totalPending = round2(s.totalPending);
    s.overdueAmount = round2(s.overdueAmount);
    return s;
  }

  // ------------------------------------------------------------------ payments
  async recordPayment(user: AuthenticatedUser, feeRecordId: string, body: any): Promise<FeePaymentItem> {
    const db = this.access.db();
    await this.access.assertActiveMembership(user);
    const amount = parseAmount(body?.amount, 'amount');
    const paidOn = parseDay(body?.paidOn, 'paidOn');
    if (paidOn.getTime() > Date.now() + 24 * 3600 * 1000) throw new BadRequestException('paidOn cannot be in the future.');
    const mode = String(body?.mode ?? '').toUpperCase() as PaymentMode;
    if (!MODES.includes(mode)) throw new BadRequestException(`mode must be one of ${MODES.join(', ')}.`);
    const reference = optionalString(body?.reference, 'reference', 120);
    const note = optionalString(body?.note, 'note', 500);

    const fee = await db.studentFeeRecord.findFirst({ where: { id: feeRecordId, instituteId: user.instituteId } });
    if (!fee || !fee.batchId) throw new NotFoundException('Fee record not found.');
    await this.access.assertBatchAccess(user, fee.batchId);
    if (fee.voidedAt) throw new ConflictException('This fee has been voided.');

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await db.$transaction(async (tx: any) => {
          const current = await tx.studentFeeRecord.findUnique({ where: { id: fee.id } });
          if (!current || current.voidedAt) throw new ConflictException('This fee has been voided.');
          const balance = round2(current.totalAmount - current.paidAmount);
          if (amount > balance) {
            throw new BadRequestException(`Payment exceeds the outstanding balance (${balance.toFixed(2)}).`);
          }
          const newPaid = round2(current.paidAmount + amount);
          // Optimistic concurrency: only succeeds if nobody changed paidAmount since we read it.
          const upd = await tx.studentFeeRecord.updateMany({
            where: { id: current.id, paidAmount: current.paidAmount },
            data: { paidAmount: newPaid, status: computeFeeStatus({ ...current, paidAmount: newPaid }) },
          });
          if (upd.count !== 1) throw new ConflictException('RETRY');
          const counter = await tx.instituteCounter.upsert({
            where: { instituteId_key: { instituteId: user.instituteId, key: 'receipt' } },
            create: { instituteId: user.instituteId, key: 'receipt', value: 1 },
            update: { value: { increment: 1 } },
          });
          const receiptNumber = `RCT-${paidOn.getUTCFullYear()}-${String(counter.value).padStart(5, '0')}`;
          const payment = await tx.feePayment.create({
            data: {
              instituteId: user.instituteId,
              feeRecordId: current.id,
              studentId: current.studentId,
              amount,
              paidOn,
              mode,
              reference,
              note,
              receiptNumber,
              recordedById: user.id,
            },
          });
          await tx.notification.createMany({
            data: [
              {
                instituteId: user.instituteId,
                userId: current.studentId,
                title: 'Fee payment received',
                message: `Payment of Rs. ${amount.toFixed(2)} received for "${current.feeTitle}" (receipt ${receiptNumber}). Balance: Rs. ${round2(balance - amount).toFixed(2)}.`,
                type: 'FEE_PAYMENT',
                link: '/student/fees',
                dedupeKey: `fee-payment:${payment.id}`,
              },
            ],
            skipDuplicates: true,
          });
          await tx.auditLog.create({
            data: {
              instituteId: user.instituteId,
              userId: user.id,
              actorEmail: user.email,
              action: 'FEE_PAYMENT_RECORDED',
              resourceType: 'FeePayment',
              resourceId: payment.id,
              metadata: { feeRecordId: current.id, amount, mode, reference, receiptNumber },
            },
          });
          return toPayment(payment, user.fullName);
        });
      } catch (err) {
        if ((err as Error)?.message === 'RETRY' && attempt < 2) continue;
        if ((err as Error)?.message === 'RETRY') throw new ConflictException('Fee record was updated concurrently. Please retry.');
        throw err;
      }
    }
    throw new ConflictException('Fee record was updated concurrently. Please retry.');
  }

  /** The payment row stays (receipt numbers are never reused); it is flagged VOIDED with reason + actor. */
  async voidPayment(user: AuthenticatedUser, paymentId: string, reasonRaw: unknown): Promise<FeePaymentItem> {
    const db = this.access.db();
    await this.access.assertActiveMembership(user);
    const reason = requireString(reasonRaw, 'reason', 300);
    const p = await db.feePayment.findFirst({
      where: { id: paymentId, instituteId: user.instituteId },
      include: { feeRecord: true },
    });
    if (!p) throw new NotFoundException('Payment not found.');
    if (!p.feeRecord.batchId) throw new NotFoundException('Payment not found.');
    await this.access.assertBatchAccess(user, p.feeRecord.batchId);
    if (p.status === 'VOIDED') throw new ConflictException('Payment is already voided.');
    const now = new Date();
    return db.$transaction(async (tx: any) => {
      const claimed = await tx.feePayment.updateMany({
        where: { id: p.id, status: 'ISSUED' },
        data: { status: 'VOIDED', voidedAt: now, voidedById: user.id, voidReason: reason },
      });
      if (claimed.count !== 1) throw new ConflictException('Payment is already voided.');
      const agg = await tx.feePayment.aggregate({
        where: { feeRecordId: p.feeRecordId, status: 'ISSUED' },
        _sum: { amount: true },
      });
      const paid = round2(agg._sum.amount ?? 0);
      await tx.studentFeeRecord.update({
        where: { id: p.feeRecordId },
        data: { paidAmount: paid, status: computeFeeStatus({ ...p.feeRecord, paidAmount: paid }) },
      });
      await tx.notification.createMany({
        data: [
          {
            instituteId: user.instituteId,
            userId: p.studentId,
            title: 'Fee payment entry corrected',
            message: `Receipt ${p.receiptNumber} (Rs. ${p.amount.toFixed(2)}) was cancelled: ${reason}`,
            type: 'FEE_PAYMENT_VOID',
            link: '/student/fees',
            dedupeKey: `fee-payment-void:${p.id}`,
          },
        ],
        skipDuplicates: true,
      });
      await tx.auditLog.create({
        data: {
          instituteId: user.instituteId,
          userId: user.id,
          actorEmail: user.email,
          action: 'FEE_PAYMENT_VOIDED',
          resourceType: 'FeePayment',
          resourceId: p.id,
          details: reason,
          metadata: { receiptNumber: p.receiptNumber, amount: p.amount },
        },
      });
      return toPayment({ ...p, status: 'VOIDED', voidedAt: now, voidReason: reason }, undefined);
    });
  }

  // ------------------------------------------------------------------ reminders (on demand, deduped)
  async sendReminders(user: AuthenticatedUser, body: any): Promise<SendFeeRemindersResult> {
    const db = this.access.db();
    await this.access.assertActiveMembership(user);
    const daysBefore = Math.min(30, Math.max(0, Number.isFinite(Number(body?.daysBefore)) ? Math.floor(Number(body.daysBefore)) : 3));
    const channels: string[] = Array.isArray(body?.channels) && body.channels.length ? body.channels : ['IN_APP'];
    for (const c of channels) if (!['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'].includes(c)) throw new BadRequestException(`Unknown channel ${c}.`);
    const custom = optionalString(body?.customMessage, 'customMessage', 400);

    let batchIds: string[];
    if (typeof body?.batchId === 'string' && body.batchId) {
      await this.access.assertBatchAccess(user, body.batchId);
      batchIds = [body.batchId];
    } else {
      const scoped = await this.access.staffBatchIds(user);
      batchIds = scoped ?? [];
      if (scoped === null) {
        const all = await db.batch.findMany({ where: { instituteId: user.instituteId, isActive: true }, select: { id: true }, take: 500 });
        batchIds = all.map((b) => b.id);
      }
    }
    const horizon = new Date(Date.now() + daysBefore * 24 * 3600 * 1000);
    const ids: string[] | undefined = Array.isArray(body?.feeRecordIds) ? body.feeRecordIds.filter((x: unknown) => typeof x === 'string').slice(0, 500) : undefined;
    const records = await db.studentFeeRecord.findMany({
      where: {
        instituteId: user.instituteId,
        batchId: { in: batchIds },
        voidedAt: null,
        dueDate: { lte: horizon },
        ...(ids ? { id: { in: ids } } : {}),
      },
      take: 500,
    });
    const open = records.filter((r) => r.paidAmount < r.totalAmount);
    const day = new Date().toISOString().slice(0, 10);
    const result: SendFeeRemindersResult = { considered: open.length, inAppCreated: 0, externalNotSent: 0, skippedDuplicates: 0 };
    if (open.length === 0) return result;

    const now = new Date();
    const message = (r: (typeof open)[number]) => {
      const bal = round2(r.totalAmount - r.paidAmount).toFixed(2);
      const status = computeFeeStatus(r, now);
      return (
        custom ??
        (status === 'OVERDUE'
          ? `Your fee "${r.feeTitle}" is overdue (due ${dayStr(r.dueDate)}). Balance: Rs. ${bal}.`
          : `Reminder: fee "${r.feeTitle}" is due on ${dayStr(r.dueDate)}. Balance: Rs. ${bal}.`)
      );
    };

    await db.$transaction(async (tx: any) => {
      for (const channel of channels) {
        const created = await tx.studentFeeReminder.createMany({
          data: open.map((r) => ({
            feeRecordId: r.id,
            studentId: r.studentId,
            channel,
            message: message(r),
            // Truthful state: only IN_APP is actually delivered; there is no email/SMS/WhatsApp provider.
            status: channel === 'IN_APP' ? 'DELIVERED' : 'NOT_SENT',
            sentById: user.id,
            dedupeKey: `${channel}:${day}`,
          })),
          skipDuplicates: true,
        });
        result.skippedDuplicates += open.length - created.count;
        if (channel === 'IN_APP') {
          result.inAppCreated += created.count;
          await tx.notification.createMany({
            data: open.map((r) => ({
              instituteId: user.instituteId,
              userId: r.studentId,
              title: computeFeeStatus(r, now) === 'OVERDUE' ? 'Fee overdue' : 'Fee due soon',
              message: message(r),
              type: 'FEE_REMINDER',
              link: '/student/fees',
              dedupeKey: `fee-reminder:${r.id}:${day}`,
            })),
            skipDuplicates: true,
          });
        } else {
          result.externalNotSent += created.count;
        }
      }
    });
    return result;
  }

  // ------------------------------------------------------------------ student side
  async studentLedger(user: AuthenticatedUser): Promise<StudentFeeLedger> {
    const db = this.access.db();
    if (!user.instituteId) {
      return { totalFees: 0, paidAmount: 0, balanceDue: 0, overdueAmount: 0, status: 'PAID', fees: [], receipts: [] };
    }
    const rows = await db.studentFeeRecord.findMany({
      where: { studentId: user.id, instituteId: user.instituteId, voidedAt: null },
      include: {
        batch: { select: { name: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
      orderBy: { dueDate: 'asc' },
      take: clampLimit(100, 100, 200),
    });
    const now = new Date();
    const fees = rows.map((r) => toLedger(r, now));
    let total = 0;
    let paid = 0;
    let overdue = 0;
    for (const f of fees) {
      total += f.totalAmount;
      paid += f.paidAmount;
      if (f.status === 'OVERDUE') overdue += f.balanceDue;
    }
    const balance = round2(Math.max(0, total - paid));
    return {
      totalFees: round2(total),
      paidAmount: round2(paid),
      balanceDue: balance,
      overdueAmount: round2(overdue),
      status: balance <= 0 ? 'PAID' : overdue > 0 ? 'OVERDUE' : paid > 0 ? 'PARTIAL' : 'PENDING',
      fees,
      receipts: fees.flatMap((f) => f.payments).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  }

  /** Re-exported so enrolment flows (join code, roster add, batch promotion) can reuse one implementation. */
  inheritForEnrollment = inheritBatchFees;
}
