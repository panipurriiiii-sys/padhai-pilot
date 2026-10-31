import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccessService } from '../common/access/access.service.js';
import { requireString, optionalString } from '../common/db/db.js';
import { isManagement } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';
import type { StudentLeaveItem } from '@padhai-pilot/shared';
import { parseDay } from './fee-core.js';

const day = (d: Date): string => d.toISOString().slice(0, 10);
const MAX_DAYS = 60;

@Injectable()
export class StudentLeavesService {
  constructor(@Inject(AccessService) private readonly access: AccessService) {}

  private toItem(l: any, names: { student?: Map<string, { name: string; roll?: string }>; batch?: Map<string, string>; reviewer?: Map<string, string> } = {}): StudentLeaveItem {
    const s = names.student?.get(l.studentId);
    return {
      id: l.id,
      studentId: l.studentId,
      studentName: s?.name,
      rollNumber: s?.roll,
      batchId: l.batchId ?? undefined,
      batchName: l.batchId ? names.batch?.get(l.batchId) : undefined,
      startDate: day(l.startDate),
      endDate: day(l.endDate),
      totalDays: l.totalDays,
      reason: l.reason,
      status: l.status,
      reviewerName: l.reviewedById ? names.reviewer?.get(l.reviewedById) : undefined,
      reviewerRemarks: l.reviewerRemarks ?? undefined,
      reviewedAt: l.reviewedAt ? l.reviewedAt.toISOString() : undefined,
      createdAt: l.createdAt.toISOString(),
    };
  }

  private async decorate(rows: any[], instituteId: string): Promise<StudentLeaveItem[]> {
    const db = this.access.db();
    const studentIds = [...new Set(rows.map((r) => r.studentId))];
    const batchIds = [...new Set(rows.map((r) => r.batchId).filter(Boolean))] as string[];
    const reviewerIds = [...new Set(rows.map((r) => r.reviewedById).filter(Boolean))] as string[];
    const [users, batches, enrolls] = await Promise.all([
      db.user.findMany({ where: { id: { in: [...studentIds, ...reviewerIds] } }, select: { id: true, fullName: true } }),
      batchIds.length ? db.batch.findMany({ where: { id: { in: batchIds }, instituteId }, select: { id: true, name: true } }) : Promise.resolve([]),
      db.enrollment.findMany({
        where: { instituteId, studentId: { in: studentIds }, ...(batchIds.length ? { batchId: { in: batchIds } } : {}) },
        select: { studentId: true, rollNumber: true },
        take: 1000,
      }),
    ]);
    const uname = new Map(users.map((u) => [u.id, u.fullName]));
    const roll = new Map(enrolls.map((e) => [e.studentId, e.rollNumber]));
    return rows.map((r) =>
      this.toItem(r, {
        student: new Map([[r.studentId, { name: uname.get(r.studentId) ?? '', roll: roll.get(r.studentId) }]]),
        batch: new Map(batches.map((b) => [b.id, b.name])),
        reviewer: uname,
      }),
    );
  }

  // ---------------------------------------------------------------- student
  async apply(user: AuthenticatedUser, body: any): Promise<StudentLeaveItem> {
    const db = this.access.db();
    const start = parseDay(body?.startDate, 'startDate');
    const end = parseDay(body?.endDate, 'endDate');
    if (end < start) throw new BadRequestException('endDate cannot be before startDate.');
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (totalDays > MAX_DAYS) throw new BadRequestException(`A leave can cover at most ${MAX_DAYS} days.`);
    const reason = requireString(body?.reason, 'reason', 1000);
    const batchIds = await this.access.studentBatchIds(user);
    const batchId = optionalString(body?.batchId, 'batchId', 64);
    if (batchId && !batchIds.includes(batchId)) throw new NotFoundException('Batch not found.');
    const effectiveBatch = batchId ?? (batchIds.length === 1 ? batchIds[0] : undefined);

    const overlap = await db.studentLeaveApplication.findFirst({
      where: {
        instituteId: user.instituteId,
        studentId: user.id,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true },
    });
    if (overlap) throw new ConflictException('You already have a leave application covering these dates.');

    const created = await db.studentLeaveApplication.create({
      data: { instituteId: user.instituteId, studentId: user.id, batchId: effectiveBatch, startDate: start, endDate: end, totalDays, reason },
    });
    // Tell the batch teacher (in-app).
    if (effectiveBatch) {
      const batch = await db.batch.findFirst({ where: { id: effectiveBatch, instituteId: user.instituteId }, select: { teacherId: true } });
      if (batch) {
        await db.notification.createMany({
          data: [
            {
              instituteId: user.instituteId,
              userId: batch.teacherId,
              title: 'New student leave request',
              message: `${user.fullName} applied for leave ${day(start)} to ${day(end)}.`,
              type: 'STUDENT_LEAVE',
              link: '/teacher/leaves',
              dedupeKey: `student-leave-new:${created.id}`,
            },
          ],
          skipDuplicates: true,
        });
      }
    }
    return (await this.decorate([created], user.instituteId))[0];
  }

  async mine(user: AuthenticatedUser): Promise<StudentLeaveItem[]> {
    const db = this.access.db();
    const rows = await db.studentLeaveApplication.findMany({
      where: { instituteId: user.instituteId, studentId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return this.decorate(rows, user.instituteId);
  }

  async cancel(user: AuthenticatedUser, id: string): Promise<StudentLeaveItem> {
    const db = this.access.db();
    const res = await db.studentLeaveApplication.updateMany({
      where: { id, instituteId: user.instituteId, studentId: user.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (res.count !== 1) throw new NotFoundException('Pending leave application not found.');
    const row = await db.studentLeaveApplication.findUniqueOrThrow({ where: { id } });
    return (await this.decorate([row], user.instituteId))[0];
  }

  // ---------------------------------------------------------------- staff
  async list(user: AuthenticatedUser, q: { status?: string; batchId?: string }): Promise<StudentLeaveItem[]> {
    const db = this.access.db();
    const scoped = await this.access.staffBatchIds(user);
    if (q.batchId) await this.access.assertBatchAccess(user, q.batchId);
    const rows = await db.studentLeaveApplication.findMany({
      where: {
        instituteId: user.instituteId,
        ...(q.batchId ? { batchId: q.batchId } : scoped !== null ? { batchId: { in: scoped } } : {}),
        ...(q.status && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(q.status) ? { status: q.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return this.decorate(rows, user.instituteId);
  }

  async review(user: AuthenticatedUser, id: string, body: any): Promise<StudentLeaveItem> {
    const db = this.access.db();
    await this.access.assertActiveMembership(user);
    const status = body?.status;
    if (status !== 'APPROVED' && status !== 'REJECTED') throw new BadRequestException('status must be APPROVED or REJECTED.');
    const remarks = optionalString(body?.remarks, 'remarks', 500);
    if (status === 'REJECTED' && !remarks) throw new BadRequestException('Please give a remark when rejecting.');

    const leave = await db.studentLeaveApplication.findFirst({ where: { id, instituteId: user.instituteId } });
    if (!leave) throw new NotFoundException('Leave application not found.');
    if (leave.batchId) await this.access.assertBatchAccess(user, leave.batchId);
    else if (!isManagement(user.role)) throw new ForbiddenException('Only the institute owner can review this application.');

    const now = new Date();
    const updated = await db.$transaction(async (tx: any) => {
      const claimed = await tx.studentLeaveApplication.updateMany({
        where: { id, status: 'PENDING' },
        data: { status, reviewedById: user.id, reviewerRemarks: remarks, reviewedAt: now },
      });
      if (claimed.count !== 1) throw new ConflictException('This application has already been reviewed or cancelled.');
      await tx.notification.createMany({
        data: [
          {
            instituteId: user.instituteId,
            userId: leave.studentId,
            title: `Leave ${status === 'APPROVED' ? 'approved' : 'rejected'}`,
            message: `Your leave ${day(leave.startDate)} to ${day(leave.endDate)} was ${status.toLowerCase()}${remarks ? `: ${remarks}` : '.'}`,
            type: 'STUDENT_LEAVE_REVIEW',
            link: '/student/leaves',
            dedupeKey: `student-leave-review:${id}`,
          },
        ],
        skipDuplicates: true,
      });
      await tx.auditLog.create({
        data: {
          instituteId: user.instituteId,
          userId: user.id,
          actorEmail: user.email,
          action: `STUDENT_LEAVE_${status}`,
          resourceType: 'StudentLeaveApplication',
          resourceId: id,
          details: remarks,
        },
      });
      return tx.studentLeaveApplication.findUniqueOrThrow({ where: { id } });
    });
    return (await this.decorate([updated], user.instituteId))[0];
  }
}
