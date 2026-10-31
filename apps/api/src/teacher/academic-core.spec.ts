import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessService } from '../common/access/access.service.js';
import { BatchesService } from './batches.service.js';
import { EnrollmentCodesService, codeStatus, generateCode } from './enrollment-codes.service.js';
import { TimetableService, overlaps, toMinutes } from './timetable.service.js';
import { BroadcastService } from './broadcast.service.js';
import { TeacherService } from './teacher.service.js';
import type { AuthenticatedUser } from '../common/types.js';

const owner = { id: 'own1', role: 'TUITION_OWNER', instituteId: 'i1', instituteName: 'Apex', fullName: 'Owner', email: 'o@x.in' } as AuthenticatedUser;
const lead = { id: 'fac1', role: 'FACULTY', instituteId: 'i1', instituteName: 'Apex', fullName: 'Lead', email: 'l@x.in' } as AuthenticatedUser;
const other = { id: 'fac2', role: 'FACULTY', instituteId: 'i1', instituteName: 'Apex', fullName: 'Other', email: 'f@x.in' } as AuthenticatedUser;
const foreignOwner = { ...owner, id: 'own9', instituteId: 'i2' } as AuthenticatedUser;

const batchRow = (over: Record<string, unknown> = {}) => ({
  id: 'b1', instituteId: 'i1', name: 'JEE 11', code: 'J11', subject: 'Maths', gradeLevel: '11', room: 'R1',
  teacherId: 'fac1', isActive: true, schedule: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date(),
  ...over,
});

/** Batch lookup double that honours tenant scoping like the real where clause. */
function batchStore(rows: any[], assigned: Array<{ batchId: string; facultyId: string }> = []) {
  return {
    batch: {
      findFirst: vi.fn(async ({ where }: any) => {
        const r = rows.find((b) => b.id === where.id && b.instituteId === where.instituteId && (!where.code || String(b.code).toLowerCase() === String(where.code.equals).toLowerCase()));
        return r ?? null;
      }),
      findMany: vi.fn(async () => rows),
      update: vi.fn(async ({ where, data }: any) => ({ ...rows.find((b) => b.id === where.id), ...data, _count: { enrollments: 0 } })),
      create: vi.fn(async ({ data }: any) => ({ ...batchRow(), ...data, id: 'bNew' })),
    },
    batchFaculty: {
      findFirst: vi.fn(async ({ where }: any) => assigned.find((a) => a.batchId === where.batchId && a.facultyId === where.facultyId) ?? null),
      findMany: vi.fn(async () => assigned.map((a) => ({ batchId: a.batchId }))),
    },
  };
}

describe('batch access and tenant isolation', () => {
  it('returns 404 for a batch of another institute and 403 for an unassigned faculty member', async () => {
    const db: any = { isConnected: true, ...batchStore([batchRow()]) };
    const svc = new BatchesService(db, undefined, new AccessService(db));
    await expect(svc.update('b1', { name: 'X' }, foreignOwner)).rejects.toThrow(NotFoundException);
    await expect(svc.update('b1', { name: 'X' }, other)).rejects.toThrow(ForbiddenException);
  });

  it('lets only the lead teacher or management edit; assigned faculty is read-only', async () => {
    const db: any = { isConnected: true, ...batchStore([batchRow()], [{ batchId: 'b1', facultyId: 'fac2' }]) };
    const svc = new BatchesService(db, undefined, new AccessService(db));
    await expect(svc.update('b1', { name: 'X' }, other)).rejects.toThrow(ForbiddenException);
    const updated = await svc.update('b1', { name: 'JEE 11 Evening', room: null, schedule: 'Mon/Wed 6pm' }, lead);
    expect(updated.name).toBe('JEE 11 Evening');
    expect(db.batch.update.mock.calls[0][0].data).toMatchObject({ name: 'JEE 11 Evening', room: null, schedule: 'Mon/Wed 6pm' });
    await expect(svc.update('b1', {}, owner)).rejects.toThrow(BadRequestException);
  });

  it('rejects a duplicate batch code in the same institute', async () => {
    const db: any = { isConnected: true, ...batchStore([batchRow()]) };
    db.batch.findFirst = vi.fn(async () => ({ id: 'bX' }));
    const svc = new BatchesService(db, undefined, new AccessService(db));
    await expect(svc.create({ name: 'A', subject: 'B', code: 'J11' }, owner)).rejects.toThrow(ConflictException);
  });
});

describe('enrollment code lifecycle', () => {
  const baseCode = (over: Record<string, unknown> = {}) => ({
    id: 'c1', code: 'ABCD-EF23', instituteId: 'i1', batchId: 'b1', issuerId: 'fac1', label: null, maxUses: 100, usedCount: 3,
    expiresAt: null, isRevoked: false, createdAt: new Date(), updatedAt: new Date(), batch: { name: 'JEE 11' }, issuer: { fullName: 'Lead' }, ...over,
  });

  function codesDb(row: any) {
    const db: any = {
      isConnected: true,
      ...batchStore([batchRow()]),
      invitationCode: {
        create: vi.fn(async ({ data }: any) => ({ ...baseCode(), ...data, usedCount: 0 })),
        findFirst: vi.fn(async ({ where }: any) => (where.instituteId === row.instituteId ? row : null)),
        update: vi.fn(async ({ data }: any) => ({ ...row, ...data })),
      },
    };
    return db;
  }

  it('creates a code with no expiry by default and a ready-to-share message', async () => {
    const db = codesDb(baseCode());
    const svc = new EnrollmentCodesService(db, undefined, new AccessService(db));
    const created = await svc.create({ batchId: 'b1' }, lead);
    expect(created.expiresAt).toBeNull();
    expect(created.maxUses).toBe(100);
    expect(created.status).toBe('ACTIVE');
    expect(created.shareText).toContain(created.code);
    expect(created.shareLink).toContain(`code=${created.code}`);
    expect(db.invitationCode.create.mock.calls[0][0].data.expiresAt).toBeNull();
  });

  it('requires a batch for faculty, but not for management', async () => {
    const db = codesDb(baseCode());
    const svc = new EnrollmentCodesService(db, undefined, new AccessService(db));
    await expect(svc.create({}, lead)).rejects.toThrow(BadRequestException);
    await expect(svc.create({}, owner)).resolves.toBeTruthy();
  });

  it('updates max uses (not below usage), sets and clears expiry', async () => {
    const db = codesDb(baseCode({ expiresAt: new Date(Date.now() + 86_400_000) }));
    const svc = new EnrollmentCodesService(db, undefined, new AccessService(db));
    await expect(svc.update('c1', { maxUses: 2 }, lead)).rejects.toThrow(BadRequestException);
    await expect(svc.update('c1', { expiresAt: new Date(Date.now() - 1000).toISOString() }, lead)).rejects.toThrow(BadRequestException);
    const cleared = await svc.update('c1', { maxUses: 250, expiresAt: null }, lead);
    expect(cleared.maxUses).toBe(250);
    expect(cleared.expiresAt).toBeNull();
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const set = await svc.update('c1', { expiresAt: future }, lead);
    expect(set.expiresAt).toBe(future);
  });

  it('revokes, reactivates and regenerates; foreign tenants get 404', async () => {
    const db = codesDb(baseCode());
    const svc = new EnrollmentCodesService(db, undefined, new AccessService(db));
    const revoked = await svc.revoke('c1', lead);
    expect(revoked.code.status).toBe('REVOKED');
    const back = await svc.reactivate('c1', lead);
    expect(back.status).toBe('ACTIVE');
    const regen = await svc.regenerate('c1', lead);
    expect(regen.code).not.toBe('ABCD-EF23');
    expect(regen.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    await expect(svc.revoke('c1', foreignOwner)).rejects.toThrow(NotFoundException);
  });

  it('derives status correctly', () => {
    const now = new Date();
    expect(codeStatus({ isRevoked: true, expiresAt: null, usedCount: 0, maxUses: 5 })).toBe('REVOKED');
    expect(codeStatus({ isRevoked: false, expiresAt: new Date(now.getTime() - 1), usedCount: 0, maxUses: 5 })).toBe('EXPIRED');
    expect(codeStatus({ isRevoked: false, expiresAt: null, usedCount: 5, maxUses: 5 })).toBe('EXHAUSTED');
    expect(codeStatus({ isRevoked: false, expiresAt: null, usedCount: 4, maxUses: 5 })).toBe('ACTIVE');
    expect(new Set(Array.from({ length: 50 }, generateCode)).size).toBe(50);
  });
});

describe('promote batch to next class', () => {
  function promoteDb() {
    const enrollments: any[] = [
      { id: 'e1', instituteId: 'i1', batchId: 'b1', studentId: 's1', rollNumber: '1', status: 'ACTIVE' },
      { id: 'e2', instituteId: 'i1', batchId: 'b1', studentId: 's2', rollNumber: '2', status: 'ACTIVE' },
      { id: 'e3', instituteId: 'i1', batchId: 'b2', studentId: 's2', rollNumber: '9', status: 'ACTIVE' }, // already in target
    ];
    const promotions: any[] = [];
    const batches = [batchRow(), batchRow({ id: 'b2', name: 'JEE 12', code: 'J12' })];
    const match = (e: any, w: any) =>
      (!w.batchId || e.batchId === w.batchId) && (!w.status || e.status === w.status) && (!w.instituteId || e.instituteId === w.instituteId) &&
      (!w.studentId?.in || w.studentId.in.includes(e.studentId));
    const tx: any = {
      enrollment: {
        findMany: vi.fn(async ({ where }: any) => enrollments.filter((e) => match(e, where))),
        count: vi.fn(async ({ where }: any) => enrollments.filter((e) => match(e, where)).length),
        create: vi.fn(async ({ data }: any) => { enrollments.push({ id: `n${enrollments.length}`, ...data }); }),
        update: vi.fn(async ({ where, data }: any) => { Object.assign(enrollments.find((e) => e.id === where.id), data); }),
      },
      batchPromotion: { create: vi.fn(async ({ data }: any) => { promotions.push(data); return { id: `p${promotions.length}` }; }) },
      batch: { update: vi.fn(async ({ where, data }: any) => Object.assign(batches.find((b) => b.id === where.id)!, data)) },
    };
    const db: any = { isConnected: true, ...batchStore(batches), $transaction: async (fn: any) => fn(tx) };
    return { db, enrollments, promotions };
  }

  it('moves active students once, keeps history, and is idempotent', async () => {
    const { db, enrollments, promotions } = promoteDb();
    const svc = new BatchesService(db, undefined, new AccessService(db));
    const first = await svc.promote('b1', { targetBatchId: 'b2', archiveSource: true }, lead);
    expect(first).toMatchObject({ movedCount: 1, skippedCount: 1, alreadyPromoted: false, sourceArchived: true });
    expect(enrollments.filter((e) => e.batchId === 'b1').every((e) => e.status === 'PROMOTED' && e.endedAt)).toBe(true);
    const moved = enrollments.find((e) => e.batchId === 'b2' && e.studentId === 's1');
    expect(moved).toMatchObject({ status: 'ACTIVE', promotedFromBatchId: 'b1' });
    expect(enrollments.filter((e) => e.batchId === 'b2' && e.studentId === 's2')).toHaveLength(1);
    expect(promotions).toHaveLength(1);

    const second = await svc.promote('b1', { targetBatchId: 'b2' }, lead);
    expect(second).toMatchObject({ movedCount: 0, alreadyPromoted: true, promotionId: null });
    expect(enrollments).toHaveLength(4);
    expect(promotions).toHaveLength(1);
  });

  it('validates the target and refuses foreign tenants', async () => {
    const { db } = promoteDb();
    const svc = new BatchesService(db, undefined, new AccessService(db));
    await expect(svc.promote('b1', {}, lead)).rejects.toThrow(BadRequestException);
    await expect(svc.promote('b1', { targetBatchId: 'b1' }, lead)).rejects.toThrow(BadRequestException);
    await expect(svc.promote('b1', { targetBatchId: 'b2' }, foreignOwner)).rejects.toThrow(NotFoundException);
    await expect(svc.promote('b1', { targetBatchId: 'b2' }, other)).rejects.toThrow(ForbiddenException);
  });
});

describe('weekly timetable conflicts', () => {
  const existing = [
    { id: 's1', instituteId: 'i1', batchId: 'b1', teacherId: 'fac1', dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '11:00', room: 'R1', batch: { name: 'JEE 11' } },
  ];
  function ttDb() {
    return {
      isConnected: true,
      ...batchStore([batchRow(), batchRow({ id: 'b2', name: 'NEET', code: 'N1', teacherId: 'fac1' })]),
      timetableSlot: {
        findMany: vi.fn(async ({ where }: any) => existing.filter((s) => s.dayOfWeek === where.dayOfWeek && s.instituteId === where.instituteId && s.id !== where.id?.not)),
        create: vi.fn(async ({ data }: any) => ({ id: 'sNew', createdAt: new Date(), updatedAt: new Date(), batch: { name: 'x' }, teacher: { fullName: 'Lead' }, notes: null, ...data })),
      },
    } as any;
  }

  it('rejects a teacher clash, a room clash and a batch clash with 409 details', async () => {
    const db = ttDb();
    const svc = new TimetableService(db, new AccessService(db));
    const slot = { subject: 'Physics', dayOfWeek: 'MONDAY', startTime: '10:30', endTime: '11:30' };
    await expect(svc.create('b2', { ...slot, room: 'R9' }, lead)).rejects.toMatchObject({ response: { conflicts: [{ kind: 'TEACHER' }] } });
    await expect(svc.create('b2', { ...slot, room: 'r1', teacherId: 'fac1' }, owner)).rejects.toThrow(ConflictException);
    await expect(svc.create('b1', slot, lead)).rejects.toThrow(ConflictException);
  });

  it('allows back-to-back slots and validates times', async () => {
    const db = ttDb();
    const svc = new TimetableService(db, new AccessService(db));
    await expect(svc.create('b2', { subject: 'Bio', dayOfWeek: 'MONDAY', startTime: '11:00', endTime: '12:00', room: 'R2' }, lead)).resolves.toMatchObject({ startTime: '11:00' });
    await expect(svc.create('b2', { subject: 'Bio', dayOfWeek: 'MONDAY', startTime: '12:00', endTime: '11:00' }, lead)).rejects.toThrow(BadRequestException);
    await expect(svc.create('b2', { subject: 'Bio', dayOfWeek: 'FUNDAY', startTime: '09:00', endTime: '10:00' }, lead)).rejects.toThrow(BadRequestException);
    await expect(svc.create('b2', { subject: 'Bio', dayOfWeek: 'TUESDAY', startTime: '25:00', endTime: '26:00' }, lead)).rejects.toThrow(BadRequestException);
    expect(overlaps(toMinutes('10:00'), toMinutes('11:00'), toMinutes('11:00'), toMinutes('12:00'))).toBe(false);
  });

  it('hides slots of batches the faculty does not teach', async () => {
    const db = ttDb();
    const svc = new TimetableService(db, new AccessService(db));
    await expect(svc.create('b1', { subject: 'x', dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '10:00' }, other)).rejects.toThrow(ForbiddenException);
    await expect(svc.create('b1', { subject: 'x', dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '10:00' }, foreignOwner)).rejects.toThrow(NotFoundException);
  });
});

describe('academic broadcast', () => {
  function bDb() {
    return {
      isConnected: true,
      ...batchStore([batchRow()]),
      announcement: {
        create: vi.fn(async ({ data }: any) => ({ id: 'a1', createdAt: new Date(), ...data })),
        findFirst: vi.fn(async ({ where }: any) => (where.instituteId === 'i1' ? { id: 'a1', batchId: 'b1', authorId: 'fac1' } : null)),
        delete: vi.fn(async () => ({})),
      },
      enrollment: { findMany: vi.fn(async () => [{ studentId: 's1' }, { studentId: 's2' }, { studentId: 's1' }]) },
      instituteMembership: { findMany: vi.fn(async () => [{ userId: 's1' }]) },
      notification: {
        createMany: vi.fn(async ({ data }: any) => ({ count: data.length })),
        deleteMany: vi.fn(async () => ({ count: 2 })),
      },
      $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
    } as any;
  }

  it('notifies each enrolled student once with a dedupe key', async () => {
    const db = bDb();
    const svc = new BroadcastService(db, undefined, new AccessService(db));
    const res = await svc.create({ batchId: 'b1', title: 'Test on Friday', content: 'Chapter 4', priority: 'URGENT' }, lead);
    expect(res.notifiedCount).toBe(2);
    const call = db.notification.createMany.mock.calls[0][0];
    expect(call.skipDuplicates).toBe(true);
    expect(call.data.every((n: any) => n.dedupeKey === 'announcement:a1' && n.type === 'ANNOUNCEMENT')).toBe(true);
    expect(call.data.map((n: any) => n.userId)).toEqual(['s1', 's2']);
  });

  it('allows institute-wide broadcast only for management and enforces ownership on delete', async () => {
    const db = bDb();
    const svc = new BroadcastService(db, undefined, new AccessService(db));
    await expect(svc.create({ title: 'Holiday', content: 'Closed' }, lead)).rejects.toThrow(ForbiddenException);
    const wide = await svc.create({ title: 'Holiday', content: 'Closed' }, owner);
    expect(wide.batchId).toBeNull();
    expect(db.instituteMembership.findMany).toHaveBeenCalled();
    await expect(svc.remove('a1', other)).rejects.toThrow(ForbiddenException);
    await expect(svc.remove('a1', foreignOwner)).rejects.toThrow(NotFoundException);
    await expect(svc.remove('a1', lead)).resolves.toEqual({ success: true });
    expect(db.notification.deleteMany).toHaveBeenCalled();
  });
});

describe('attendance enrolment check', () => {
  it('refuses to mark a student who is not actively enrolled in the batch', async () => {
    const db: any = {
      isConnected: true,
      ...batchStore([batchRow()]),
      enrollment: { findMany: vi.fn(async () => [{ studentId: 's1' }]) },
    };
    const svc = new TeacherService(db, { invalidateTeacherDashboard: vi.fn() } as any, new AccessService(db));
    await expect(
      svc.saveAttendance({ batchId: 'b1', date: '2026-11-02', records: [{ studentId: 's1', status: 'PRESENT' }, { studentId: 'ghost', status: 'ABSENT' }] }, lead),
    ).rejects.toThrow(BadRequestException);
  });
});
