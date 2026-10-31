import { inheritBatchFees } from '../finance/fee-core.js';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type { BatchRoster, PromoteBatchResult, TeacherBatch } from '@padhai-pilot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { AccessService } from '../common/access/access.service.js';
import { clampLimit, isUniqueViolation, optionalString, requireString } from '../common/db/db.js';
import { isManagement } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';

interface BatchInput {
  name?: unknown;
  code?: unknown;
  subject?: unknown;
  gradeLevel?: unknown;
  room?: unknown;
  schedule?: unknown;
  teacherId?: unknown;
}

const STAFF_MEMBER_ROLES = ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'TEACHER'] as const;
const MAX_PROMOTE = 1000;

@Injectable()
export class BatchesService {
  private readonly access: AccessService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(RedisService) private readonly redis?: RedisService,
    @Optional() @Inject(AccessService) access?: AccessService,
  ) {
    this.access = access ?? new AccessService(prisma);
  }

  private async bust(user: AuthenticatedUser, teacherIds: string[] = []) {
    if (!this.redis) return;
    const ids = new Set([user.id, ...teacherIds]);
    await Promise.all([...ids].map((id) => this.redis!.invalidateTeacherDashboard(user.instituteId, id).catch(() => undefined)));
  }

  private shape(b: any, count?: number): TeacherBatch {
    return {
      id: b.id,
      instituteId: b.instituteId,
      name: b.name,
      code: b.code,
      subject: b.subject,
      gradeLevel: b.gradeLevel,
      room: b.room ?? null,
      schedule: b.schedule ?? null,
      teacherId: b.teacherId,
      ...(b.teacher?.fullName ? { teacherName: b.teacher.fullName } : {}),
      isActive: b.isActive,
      archivedAt: b.archivedAt ? new Date(b.archivedAt).toISOString() : null,
      studentCount: count ?? b._count?.enrollments ?? 0,
      createdAt: new Date(b.createdAt).toISOString(),
      updatedAt: new Date(b.updatedAt).toISOString(),
    };
  }

  /** Lead teacher or management may change the batch itself; assigned (non-lead) faculty may not. */
  private async assertCanManageBatch(user: AuthenticatedUser, batchId: string) {
    const batch = await this.access.assertBatchAccess(user, batchId);
    if (!isManagement(user.role) && batch.teacherId !== user.id) {
      throw new ForbiddenException('Only the lead teacher or the owner can change this batch.');
    }
    return batch;
  }

  private async assertStaffMember(instituteId: string, userId: string) {
    const db = this.access.db();
    const m = await db.instituteMembership.findUnique({
      where: { instituteId_userId: { instituteId, userId } },
      select: { role: true, status: true },
    });
    if (!m || m.status !== 'ACTIVE' || !(STAFF_MEMBER_ROLES as readonly string[]).includes(m.role)) {
      throw new BadRequestException('teacherId must be an active staff member of this institute.');
    }
  }

  private async assertCodeFree(instituteId: string, code: string, exceptId?: string) {
    const db = this.access.db();
    const clash = await db.batch.findFirst({
      where: { instituteId, code: { equals: code, mode: 'insensitive' }, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (clash) throw new ConflictException(`A batch with code "${code}" already exists.`);
  }

  async list(user: AuthenticatedUser, opts: { includeArchived?: boolean; limit?: unknown } = {}): Promise<TeacherBatch[]> {
    const db = this.access.db();
    const staffBatchIds = await this.access.staffBatchIds(user);
    const rows = await db.batch.findMany({
      where: {
        instituteId: user.instituteId,
        ...(staffBatchIds !== null ? { id: { in: staffBatchIds } } : {}),
        ...(opts.includeArchived ? {} : { isActive: true }),
      },
      include: {
        teacher: { select: { fullName: true } },
        _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: clampLimit(opts.limit, 100, 300),
    });
    return rows.map((b) => this.shape(b));
  }

  async create(data: BatchInput, user: AuthenticatedUser): Promise<TeacherBatch> {
    const db = this.access.db();
    const name = requireString(data.name, 'Batch name', 120);
    const subject = requireString(data.subject, 'Subject', 120);
    const code = data.code ? requireString(data.code, 'Batch code', 40) : `BTC-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    let teacherId = user.id;
    if (data.teacherId && data.teacherId !== user.id) {
      if (!isManagement(user.role)) throw new ForbiddenException('Only the owner can assign another lead teacher.');
      teacherId = requireString(data.teacherId, 'teacherId', 64);
      await this.assertStaffMember(user.instituteId, teacherId);
    }
    await this.assertCodeFree(user.instituteId, code);
    const batch = await db.batch.create({
      data: {
        instituteId: user.instituteId,
        teacherId,
        name,
        code,
        subject,
        gradeLevel: optionalString(data.gradeLevel, 'gradeLevel', 60) ?? 'Standard',
        room: optionalString(data.room, 'room', 60) ?? null,
        schedule: optionalString(data.schedule, 'schedule', 200) ?? null,
        isActive: true,
      },
      include: { teacher: { select: { fullName: true } } },
    });
    await this.bust(user, [teacherId]);
    return this.shape(batch, 0);
  }

  async update(batchId: string, data: BatchInput, user: AuthenticatedUser): Promise<TeacherBatch> {
    const db = this.access.db();
    const batch = await this.assertCanManageBatch(user, batchId);
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = requireString(data.name, 'Batch name', 120);
    if (data.subject !== undefined) patch.subject = requireString(data.subject, 'Subject', 120);
    if (data.gradeLevel !== undefined) patch.gradeLevel = requireString(data.gradeLevel, 'gradeLevel', 60);
    if (data.code !== undefined) {
      const code = requireString(data.code, 'Batch code', 40);
      if (code.toLowerCase() !== batch.code.toLowerCase()) await this.assertCodeFree(user.instituteId, code, batchId);
      patch.code = code;
    }
    if (data.room !== undefined) patch.room = data.room === null || data.room === '' ? null : requireString(data.room, 'room', 60);
    if (data.schedule !== undefined) patch.schedule = data.schedule === null || data.schedule === '' ? null : requireString(data.schedule, 'schedule', 200);
    if (data.teacherId !== undefined && data.teacherId !== batch.teacherId) {
      if (!isManagement(user.role)) throw new ForbiddenException('Only the owner can change the lead teacher.');
      const tid = requireString(data.teacherId, 'teacherId', 64);
      await this.assertStaffMember(user.instituteId, tid);
      patch.teacherId = tid;
    }
    if (Object.keys(patch).length === 0) throw new BadRequestException('Nothing to update.');
    const updated = await db.batch.update({
      where: { id: batchId },
      data: patch,
      include: { teacher: { select: { fullName: true } }, _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } } },
    });
    await this.bust(user, [batch.teacherId, updated.teacherId]);
    return this.shape(updated);
  }

  async setArchived(batchId: string, archived: boolean, user: AuthenticatedUser): Promise<TeacherBatch> {
    const db = this.access.db();
    const batch = await this.assertCanManageBatch(user, batchId);
    const updated = await db.batch.update({
      where: { id: batchId },
      data: archived ? { isActive: false, archivedAt: new Date() } : { isActive: true, archivedAt: null },
      include: { teacher: { select: { fullName: true } }, _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } } },
    });
    await this.bust(user, [batch.teacherId]);
    return this.shape(updated);
  }

  async roster(batchId: string, user: AuthenticatedUser, opts: { limit?: unknown } = {}): Promise<BatchRoster> {
    const db = this.access.db();
    const batch = await this.access.assertBatchAccess(user, batchId);
    const rows = await db.enrollment.findMany({
      where: { batchId, instituteId: user.instituteId, status: 'ACTIVE' },
      select: {
        rollNumber: true,
        status: true,
        joinedAt: true,
        student: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { student: { fullName: 'asc' } },
      take: clampLimit(opts.limit, 500, 1000),
    });
    return {
      batch: {
        id: batch.id,
        name: batch.name,
        code: batch.code,
        subject: batch.subject,
        gradeLevel: batch.gradeLevel,
        room: batch.room ?? null,
        teacherId: batch.teacherId,
        isActive: batch.isActive,
      },
      students: rows.map((e) => ({
        id: e.student.id,
        fullName: e.student.fullName,
        rollNumber: e.rollNumber,
        email: e.student.email,
        phone: e.student.phone ?? null,
        enrollmentStatus: e.status as 'ACTIVE',
        joinedAt: e.joinedAt.toISOString(),
      })),
    };
  }

  async updateRoll(batchId: string, studentId: string, rollNumber: unknown, user: AuthenticatedUser) {
    const db = this.access.db();
    await this.access.assertBatchAccess(user, batchId);
    const roll = requireString(rollNumber, 'rollNumber', 30);
    const enrollment = await db.enrollment.findFirst({
      where: { batchId, studentId, instituteId: user.instituteId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!enrollment) throw new NotFoundException('Student is not enrolled in this batch.');
    try {
      await db.enrollment.update({ where: { id: enrollment.id }, data: { rollNumber: roll } });
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException('That roll number is already used in this batch.');
      throw err;
    }
    return { success: true, rollNumber: roll };
  }

  async removeStudent(batchId: string, studentId: string, user: AuthenticatedUser) {
    const db = this.access.db();
    await this.assertCanManageBatch(user, batchId);
    const res = await db.enrollment.updateMany({
      where: { batchId, studentId, instituteId: user.instituteId, status: 'ACTIVE' },
      data: { status: 'REMOVED', endedAt: new Date() },
    });
    if (res.count === 0) throw new NotFoundException('Student is not enrolled in this batch.');
    return { success: true };
  }

  /**
   * Promote a batch's active roster to the next class. History is preserved: the source enrolment is closed
   * (status PROMOTED + endedAt) and a new enrolment in the target records promotedFromBatchId. Idempotent:
   * a repeat call finds no ACTIVE source enrolments and reports alreadyPromoted without changing anything.
   */
  async promote(
    sourceBatchId: string,
    data: { targetBatchId?: string; newBatch?: BatchInput; studentIds?: string[]; archiveSource?: boolean },
    user: AuthenticatedUser,
  ): Promise<PromoteBatchResult> {
    const db = this.access.db();
    const source = await this.assertCanManageBatch(user, sourceBatchId);
    if (!!data.targetBatchId === !!data.newBatch) {
      throw new BadRequestException('Provide exactly one of targetBatchId or newBatch.');
    }
    if (data.studentIds !== undefined && (!Array.isArray(data.studentIds) || data.studentIds.length > MAX_PROMOTE || data.studentIds.some((s) => typeof s !== 'string'))) {
      throw new BadRequestException('studentIds must be an array of at most 1000 ids.');
    }

    let target: { id: string; name: string; isActive: boolean; teacherId: string };
    if (data.targetBatchId) {
      if (data.targetBatchId === sourceBatchId) throw new BadRequestException('Target batch must differ from the source batch.');
      const t = await this.assertCanManageBatch(user, data.targetBatchId);
      target = t;
      if (!t.isActive) throw new BadRequestException('Target batch is archived.');
    } else {
      const created = await this.create({ subject: source.subject, gradeLevel: source.gradeLevel, ...data.newBatch }, user);
      target = created;
    }

    const result = await db.$transaction(async (tx) => {
      const active = await tx.enrollment.findMany({
        where: {
          batchId: sourceBatchId,
          instituteId: user.instituteId,
          status: 'ACTIVE',
          ...(data.studentIds ? { studentId: { in: data.studentIds } } : {}),
        },
        select: { id: true, studentId: true, rollNumber: true },
        take: MAX_PROMOTE + 1,
      });
      if (active.length > MAX_PROMOTE) throw new BadRequestException(`A batch can promote at most ${MAX_PROMOTE} students per call; pass studentIds in chunks.`);

      const existingTarget = active.length
        ? await tx.enrollment.findMany({
            where: { batchId: target.id, studentId: { in: active.map((a) => a.studentId) } },
            select: { id: true, studentId: true, status: true },
          })
        : [];
      const targetByStudent = new Map(existingTarget.map((e) => [e.studentId, e]));
      const usedRolls = new Set(
        (await tx.enrollment.findMany({ where: { batchId: target.id }, select: { rollNumber: true }, take: 5000 })).map((e) => e.rollNumber),
      );

      let moved = 0;
      let skipped = 0;
      const now = new Date();
      for (const src of active) {
        const prior = targetByStudent.get(src.studentId);
        if (prior?.status === 'ACTIVE') {
          skipped++; // already in the target: just close the old row
        } else {
          moved++;
          if (prior) {
            await tx.enrollment.update({
              where: { id: prior.id },
              data: { status: 'ACTIVE', endedAt: null, promotedFromBatchId: sourceBatchId },
            });
          } else {
            let roll = src.rollNumber;
            if (usedRolls.has(roll)) {
              let n = usedRolls.size + 1;
              while (usedRolls.has(`R${n}`)) n++;
              roll = `R${n}`;
            }
            usedRolls.add(roll);
            await tx.enrollment.create({
              data: {
                instituteId: user.instituteId,
                batchId: target.id,
                studentId: src.studentId,
                rollNumber: roll,
                status: 'ACTIVE',
                promotedFromBatchId: sourceBatchId,
              },
            });
          }
          // Students moving into the target inherit its active fee structures (idempotent).
          await inheritBatchFees(tx, user.instituteId, target.id, src.studentId);
        }
        await tx.enrollment.update({ where: { id: src.id }, data: { status: 'PROMOTED', endedAt: now } });
      }

      const alreadyPromoted = active.length === 0;
      let promotionId: string | null = null;
      if (!alreadyPromoted) {
        const p = await tx.batchPromotion.create({
          data: {
            instituteId: user.instituteId,
            sourceBatchId,
            targetBatchId: target.id,
            promotedById: user.id,
            movedCount: moved,
            skippedCount: skipped,
            archivedSource: !!data.archiveSource,
          },
          select: { id: true },
        });
        promotionId = p.id;
      }
      let sourceArchived = false;
      if (data.archiveSource) {
        const remaining = await tx.enrollment.count({ where: { batchId: sourceBatchId, status: 'ACTIVE' } });
        if (remaining === 0) {
          await tx.batch.update({ where: { id: sourceBatchId }, data: { isActive: false, archivedAt: now } });
          sourceArchived = true;
        }
      }
      return { moved, skipped, alreadyPromoted, promotionId, sourceArchived };
    });

    await this.bust(user, [source.teacherId, target.teacherId]);
    return {
      success: true,
      promotionId: result.promotionId,
      sourceBatchId,
      targetBatchId: target.id,
      targetBatchName: target.name,
      movedCount: result.moved,
      skippedCount: result.skipped,
      alreadyPromoted: result.alreadyPromoted,
      sourceArchived: result.sourceArchived,
    };
  }
}
