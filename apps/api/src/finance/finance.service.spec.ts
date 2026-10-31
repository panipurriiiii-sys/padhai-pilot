import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FinanceService } from './finance.service.js';
import { StudentLeavesService } from './leaves.service.js';
import type { AuthenticatedUser } from '../common/types.js';

const teacher: AuthenticatedUser = { id: 't1', email: 't@x.in', fullName: 'Teacher One', role: 'TEACHER', instituteId: 'inst1', instituteName: 'Apex' };
const student: AuthenticatedUser = { id: 's1', email: 's@x.in', fullName: 'Stu One', role: 'STUDENT', instituteId: 'inst1', instituteName: 'Apex' };

function makeDb(over: Record<string, any> = {}) {
  const db: any = {
    isConnected: true,
    batchFeeStructure: { create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'fs1', createdAt: new Date(), status: 'ACTIVE', ...data })) },
    enrollment: { findMany: vi.fn().mockResolvedValue([{ studentId: 's1' }, { studentId: 's2' }]) },
    studentFeeRecord: {
      createMany: vi.fn().mockResolvedValue({ count: 4 }),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    feePayment: { create: vi.fn(), updateMany: vi.fn(), aggregate: vi.fn(), findFirst: vi.fn() },
    instituteCounter: { upsert: vi.fn().mockResolvedValue({ value: 7 }) },
    notification: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    studentFeeReminder: { createMany: vi.fn() },
    auditLog: { create: vi.fn() },
    ...over,
  };
  db.$transaction = vi.fn(async (fn: any) => fn(db));
  return db;
}
function makeSvc(db: any) {
  const access: any = {
    db: () => db,
    assertActiveMembership: vi.fn(),
    assertBatchAccess: vi.fn().mockResolvedValue({ id: 'b1', name: 'Batch' }),
    staffBatchIds: vi.fn().mockResolvedValue(['b1']),
    studentBatchIds: vi.fn().mockResolvedValue(['b1']),
  };
  return { svc: new FinanceService(access), access };
}

describe('FinanceService.createStructure', () => {
  it('creates a PENDING record per enrolled student per instalment and audits it', async () => {
    const db = makeDb();
    const { svc, access } = makeSvc(db);
    const out = await svc.createStructure(teacher, 'b1', {
      title: 'Tuition 2026',
      instalments: [{ amount: 1000, dueDate: '2026-12-01' }, { amount: 500, dueDate: '2027-01-01' }],
    });
    expect(access.assertBatchAccess).toHaveBeenCalledWith(teacher, 'b1');
    const rows = db.studentFeeRecord.createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(4);
    expect(rows.every((r: any) => r.status === 'PENDING' && r.paidAmount === 0 && r.instituteId === 'inst1')).toBe(true);
    expect(rows[0].feeTitle).toBe('Tuition 2026 - Instalment 1');
    expect(out.totalPerStudent).toBe(1500);
    expect(db.auditLog.create).toHaveBeenCalled();
  });
  it('rejects invalid amounts before touching the db', async () => {
    const db = makeDb();
    const { svc } = makeSvc(db);
    await expect(svc.createStructure(teacher, 'b1', { title: 'x', amount: 0, dueDate: '2026-12-01' })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.batchFeeStructure.create).not.toHaveBeenCalled();
  });
});

describe('FinanceService.recordPayment', () => {
  let db: any;
  const fee = { id: 'f1', instituteId: 'inst1', studentId: 's1', batchId: 'b1', feeTitle: 'Tuition', totalAmount: 1000, paidAmount: 0, dueDate: new Date('2026-12-01'), voidedAt: null };
  beforeEach(() => {
    db = makeDb();
    db.studentFeeRecord.findFirst.mockResolvedValue(fee);
    db.studentFeeRecord.findUnique.mockResolvedValue(fee);
    db.feePayment.create.mockImplementation(async ({ data }: any) => ({ id: 'p1', status: 'ISSUED', createdAt: new Date(), ...data }));
  });

  it('issues a numbered receipt, updates paid/status, notifies the student with a dedupe key', async () => {
    const { svc } = makeSvc(db);
    const out = await svc.recordPayment(teacher, 'f1', { amount: 400, paidOn: '2026-11-01', mode: 'upi', reference: 'UTR1' });
    expect(out.receiptNumber).toBe('RCT-2026-00007');
    expect(out.mode).toBe('UPI');
    expect(db.studentFeeRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'f1', paidAmount: 0 }, data: expect.objectContaining({ paidAmount: 400, status: 'PARTIAL' }) }),
    );
    const n = db.notification.createMany.mock.calls[0][0];
    expect(n.data[0]).toMatchObject({ userId: 's1', type: 'FEE_PAYMENT', dedupeKey: 'fee-payment:p1' });
    expect(n.skipDuplicates).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalled();
  });

  it('marks PAID when the balance is cleared', async () => {
    const { svc } = makeSvc(db);
    await svc.recordPayment(teacher, 'f1', { amount: 1000, paidOn: '2026-11-01', mode: 'CASH' });
    expect(db.studentFeeRecord.updateMany.mock.calls[0][0].data.status).toBe('PAID');
  });

  it('rejects overpayment, bad mode and future dates', async () => {
    const { svc } = makeSvc(db);
    await expect(svc.recordPayment(teacher, 'f1', { amount: 1000.01, paidOn: '2026-11-01', mode: 'CASH' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.recordPayment(teacher, 'f1', { amount: 10, paidOn: '2026-11-01', mode: 'BITCOIN' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.recordPayment(teacher, 'f1', { amount: 10, paidOn: '2099-01-01', mode: 'CASH' })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.feePayment.create).not.toHaveBeenCalled();
  });

  it('retries a lost optimistic-lock race and then reports a conflict', async () => {
    db.studentFeeRecord.updateMany.mockResolvedValue({ count: 0 });
    const { svc } = makeSvc(db);
    await expect(svc.recordPayment(teacher, 'f1', { amount: 10, paidOn: '2026-11-01', mode: 'CASH' })).rejects.toBeInstanceOf(ConflictException);
    expect(db.studentFeeRecord.updateMany).toHaveBeenCalledTimes(3);
    expect(db.feePayment.create).not.toHaveBeenCalled();
  });

  it('cross-tenant fee id is a 404', async () => {
    db.studentFeeRecord.findFirst.mockResolvedValue(null);
    const { svc } = makeSvc(db);
    await expect(svc.recordPayment(teacher, 'other', { amount: 10, paidOn: '2026-11-01', mode: 'CASH' })).rejects.toBeInstanceOf(NotFoundException);
    expect(db.studentFeeRecord.findFirst).toHaveBeenCalledWith({ where: { id: 'other', instituteId: 'inst1' } });
  });
});

describe('FinanceService.voidPayment', () => {
  it('flags the payment VOIDED (row kept), recomputes paid from live payments, needs a reason', async () => {
    const db = makeDb();
    const pay = { id: 'p1', instituteId: 'inst1', feeRecordId: 'f1', studentId: 's1', amount: 400, receiptNumber: 'RCT-2026-00007', status: 'ISSUED', paidOn: new Date('2026-11-01'), createdAt: new Date(), mode: 'CASH', feeRecord: { id: 'f1', batchId: 'b1', totalAmount: 1000, paidAmount: 400, dueDate: new Date('2026-12-01'), voidedAt: null } };
    db.feePayment.findFirst.mockResolvedValue(pay);
    db.feePayment.updateMany.mockResolvedValue({ count: 1 });
    db.feePayment.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const { svc } = makeSvc(db);
    await expect(svc.voidPayment(teacher, 'p1', '')).rejects.toBeInstanceOf(BadRequestException);
    const out = await svc.voidPayment(teacher, 'p1', 'wrong student');
    expect(out.status).toBe('VOIDED');
    expect(db.feePayment.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'p1', status: 'ISSUED' } }));
    expect(db.studentFeeRecord.update.mock.calls[0][0].data).toMatchObject({ paidAmount: 0, status: 'PENDING' });
    expect(db.notification.createMany.mock.calls[0][0].data[0].dedupeKey).toBe('fee-payment-void:p1');
  });
});

describe('FinanceService.sendReminders', () => {
  const open = [
    { id: 'f1', studentId: 's1', feeTitle: 'Tuition', totalAmount: 1000, paidAmount: 0, dueDate: new Date('2020-01-01') },
    { id: 'f2', studentId: 's2', feeTitle: 'Tuition', totalAmount: 1000, paidAmount: 1000, dueDate: new Date('2020-01-01') },
  ];
  it('IN_APP creates notifications; EMAIL/SMS are recorded NOT_SENT; paid fees are skipped; duplicates counted', async () => {
    const db = makeDb();
    db.studentFeeRecord.findMany.mockResolvedValue(open);
    db.studentFeeReminder.createMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const { svc } = makeSvc(db);
    const res = await svc.sendReminders(teacher, { batchId: 'b1', channels: ['IN_APP', 'EMAIL'] });
    expect(res).toEqual({ considered: 1, inAppCreated: 1, externalNotSent: 0, skippedDuplicates: 1 });
    const inApp = db.studentFeeReminder.createMany.mock.calls[0][0];
    const email = db.studentFeeReminder.createMany.mock.calls[1][0];
    expect(inApp.data[0]).toMatchObject({ channel: 'IN_APP', status: 'DELIVERED' });
    expect(email.data[0]).toMatchObject({ channel: 'EMAIL', status: 'NOT_SENT' });
    expect(email.skipDuplicates).toBe(true);
    const notif = db.notification.createMany.mock.calls[0][0];
    expect(notif.data[0].dedupeKey).toMatch(/^fee-reminder:f1:\d{4}-\d{2}-\d{2}$/);
    expect(notif.data[0].title).toBe('Fee overdue');
  });
  it('external-only reminders never create in-app rows and are never reported as delivered', async () => {
    const db = makeDb();
    db.studentFeeRecord.findMany.mockResolvedValue(open);
    db.studentFeeReminder.createMany.mockResolvedValue({ count: 1 });
    const { svc } = makeSvc(db);
    const res = await svc.sendReminders(teacher, { batchId: 'b1', channels: ['SMS'] });
    expect(res.inAppCreated).toBe(0);
    expect(res.externalNotSent).toBe(1);
    expect(db.notification.createMany).not.toHaveBeenCalled();
  });
});

describe('FinanceService.studentLedger', () => {
  it('scopes by JWT student + institute and computes balance/overdue', async () => {
    const db = makeDb();
    db.studentFeeRecord.findMany.mockResolvedValue([
      { id: 'f1', studentId: 's1', batchId: 'b1', feeTitle: 'A', totalAmount: 1000, paidAmount: 400, dueDate: new Date('2020-01-01'), voidedAt: null, instalmentNo: 1, batch: { name: 'B' }, payments: [{ id: 'p1', feeRecordId: 'f1', studentId: 's1', amount: 400, paidOn: new Date('2026-01-01'), mode: 'CASH', receiptNumber: 'RCT-2026-00001', status: 'ISSUED', createdAt: new Date() }] },
    ]);
    const { svc } = makeSvc(db);
    const out = await svc.studentLedger(student);
    expect(db.studentFeeRecord.findMany.mock.calls[0][0].where).toMatchObject({ studentId: 's1', instituteId: 'inst1', voidedAt: null });
    expect(out).toMatchObject({ totalFees: 1000, paidAmount: 400, balanceDue: 600, overdueAmount: 600, status: 'OVERDUE' });
    expect(out.receipts[0].receiptNumber).toBe('RCT-2026-00001');
  });
});

describe('StudentLeavesService', () => {
  function leaveSvc(db: any, access: any = {}) {
    const a: any = { db: () => db, assertActiveMembership: vi.fn(), assertBatchAccess: vi.fn().mockResolvedValue({}), studentBatchIds: vi.fn().mockResolvedValue(['b1']), staffBatchIds: vi.fn().mockResolvedValue(['b1']), ...access };
    return new StudentLeavesService(a);
  }
  const base = () => {
    const db: any = {
      studentLeaveApplication: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      batch: { findFirst: vi.fn().mockResolvedValue({ teacherId: 't1' }), findMany: vi.fn().mockResolvedValue([{ id: 'b1', name: 'B' }]) },
      notification: { createMany: vi.fn() },
      user: { findMany: vi.fn().mockResolvedValue([{ id: 's1', fullName: 'Stu' }]) },
      enrollment: { findMany: vi.fn().mockResolvedValue([]) },
      auditLog: { create: vi.fn() },
    };
    db.$transaction = vi.fn(async (fn: any) => fn(db));
    return db;
  };
  it('student applies: institute/student from JWT, days computed, teacher notified', async () => {
    const db = base();
    db.studentLeaveApplication.create.mockImplementation(async ({ data }: any) => ({ id: 'l1', status: 'PENDING', createdAt: new Date(), ...data }));
    const out = await leaveSvc(db).apply(student, { startDate: '2026-11-10', endDate: '2026-11-12', reason: 'Fever', instituteId: 'EVIL', studentId: 'EVIL' });
    const data = db.studentLeaveApplication.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ instituteId: 'inst1', studentId: 's1', batchId: 'b1', totalDays: 3 });
    expect(out.status).toBe('PENDING');
    expect(db.notification.createMany.mock.calls[0][0].data[0]).toMatchObject({ userId: 't1', type: 'STUDENT_LEAVE' });
  });
  it('rejects reversed dates, overlaps and a batch the student is not in', async () => {
    const db = base();
    const svc = leaveSvc(db);
    await expect(svc.apply(student, { startDate: '2026-11-12', endDate: '2026-11-10', reason: 'x' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.apply(student, { startDate: '2026-11-10', endDate: '2026-11-10', reason: 'x', batchId: 'zzz' })).rejects.toBeInstanceOf(NotFoundException);
    db.studentLeaveApplication.findFirst.mockResolvedValue({ id: 'old' });
    await expect(svc.apply(student, { startDate: '2026-11-10', endDate: '2026-11-10', reason: 'x' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('staff review: needs batch access, only PENDING, rejection needs remark, student notified', async () => {
    const db = base();
    const leave = { id: 'l1', instituteId: 'inst1', studentId: 's1', batchId: 'b1', startDate: new Date('2026-11-10'), endDate: new Date('2026-11-11') };
    db.studentLeaveApplication.findFirst.mockResolvedValue(leave);
    db.studentLeaveApplication.updateMany.mockResolvedValue({ count: 1 });
    db.studentLeaveApplication.findUniqueOrThrow.mockResolvedValue({ ...leave, status: 'REJECTED', totalDays: 2, reason: 'r', createdAt: new Date(), reviewedById: 't1', reviewerRemarks: 'No exams', reviewedAt: new Date() });
    const svc = leaveSvc(db);
    await expect(svc.review(teacher, 'l1', { status: 'REJECTED' })).rejects.toBeInstanceOf(BadRequestException);
    const out = await svc.review(teacher, 'l1', { status: 'REJECTED', remarks: 'No exams' });
    expect(out.status).toBe('REJECTED');
    expect(db.notification.createMany.mock.calls[0][0].data[0]).toMatchObject({ userId: 's1', dedupeKey: 'student-leave-review:l1' });
    db.studentLeaveApplication.updateMany.mockResolvedValue({ count: 0 });
    await expect(svc.review(teacher, 'l1', { status: 'APPROVED' })).rejects.toBeInstanceOf(ConflictException);
  });
});
