import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type { BroadcastItem, CreateBroadcastResult } from '@padhai-pilot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { AccessService } from '../common/access/access.service.js';
import { clampLimit, requireString } from '../common/db/db.js';
import { isManagement } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';

const MAX_RECIPIENTS = 5000;
const CHUNK = 1000;

@Injectable()
export class BroadcastService {
  private readonly access: AccessService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(RedisService) private readonly redis?: RedisService,
    @Optional() @Inject(AccessService) access?: AccessService,
  ) {
    this.access = access ?? new AccessService(prisma);
  }

  private shape(a: any, batchName?: string): BroadcastItem {
    return {
      id: a.id,
      instituteId: a.instituteId,
      batchId: a.batchId ?? null,
      batchName: batchName ?? a.batch?.name ?? 'All Batches',
      authorId: a.authorId,
      authorName: a.author?.fullName ?? '',
      authorRole: a.author?.role ?? '',
      title: a.title,
      content: a.content,
      priority: a.priority,
      createdAt: new Date(a.createdAt).toISOString(),
    };
  }

  async list(user: AuthenticatedUser, opts: { batchId?: string; limit?: unknown } = {}): Promise<BroadcastItem[]> {
    const db = this.access.db();
    const staffBatchIds = await this.access.staffBatchIds(user);
    if (opts.batchId) await this.access.assertBatchAccess(user, opts.batchId);
    const rows = await db.announcement.findMany({
      where: {
        instituteId: user.instituteId,
        ...(opts.batchId
          ? { batchId: opts.batchId }
          : { OR: [{ batchId: null }, ...(staffBatchIds !== null ? [{ batchId: { in: staffBatchIds } }] : [{ batchId: { not: null } }])] }),
      },
      include: { batch: { select: { name: true } }, author: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: clampLimit(opts.limit, 50, 200),
    });
    return rows.map((r) => this.shape(r));
  }

  async create(
    data: { batchId?: string; title: unknown; content: unknown; priority?: string },
    user: AuthenticatedUser,
  ): Promise<CreateBroadcastResult> {
    const db = this.access.db();
    const title = requireString(data.title, 'title', 150);
    const content = requireString(data.content, 'content', 4000);
    if (data.priority !== undefined && data.priority !== 'NORMAL' && data.priority !== 'URGENT') {
      throw new BadRequestException('priority must be NORMAL or URGENT.');
    }
    let batchName = 'All Batches';
    if (data.batchId) {
      const batch = await this.access.assertBatchAccess(user, data.batchId);
      batchName = batch.name;
    } else if (!isManagement(user.role)) {
      throw new ForbiddenException('Only the owner can broadcast to the whole institute. Pick a batch.');
    }

    const created = await db.announcement.create({
      data: {
        instituteId: user.instituteId,
        batchId: data.batchId ?? null,
        authorId: user.id,
        title,
        content,
        priority: data.priority === 'URGENT' ? 'URGENT' : 'NORMAL',
      },
    });

    // Recipients come from the database (never the client): ACTIVE students of the batch / institute.
    const recipients = data.batchId
      ? (
          await db.enrollment.findMany({
            where: { batchId: data.batchId, instituteId: user.instituteId, status: 'ACTIVE' },
            select: { studentId: true },
            take: MAX_RECIPIENTS,
          })
        ).map((e) => e.studentId)
      : (
          await db.instituteMembership.findMany({
            where: { instituteId: user.instituteId, role: 'STUDENT', status: 'ACTIVE' },
            select: { userId: true },
            take: MAX_RECIPIENTS,
          })
        ).map((m) => m.userId);
    const unique = [...new Set(recipients)];

    let notifiedCount = 0;
    for (let i = 0; i < unique.length; i += CHUNK) {
      const res = await db.notification.createMany({
        data: unique.slice(i, i + CHUNK).map((userId) => ({
          instituteId: user.instituteId,
          userId,
          title: created.priority === 'URGENT' ? `Urgent: ${title}` : title,
          message: content.length > 240 ? `${content.slice(0, 237)}...` : content,
          type: 'ANNOUNCEMENT',
          dedupeKey: `announcement:${created.id}`,
        })),
        skipDuplicates: true,
      });
      notifiedCount += res.count;
    }

    if (this.redis) await this.redis.invalidateTeacherDashboard(user.instituteId, user.id).catch(() => undefined);
    return {
      ...this.shape({ ...created, author: { fullName: user.fullName, role: user.role } }, batchName),
      notifiedCount,
    };
  }

  async remove(id: string, user: AuthenticatedUser) {
    const db = this.access.db();
    if (typeof id !== 'string' || !id) throw new NotFoundException('Announcement not found.');
    const a = await db.announcement.findFirst({ where: { id, instituteId: user.instituteId }, select: { id: true, batchId: true, authorId: true } });
    if (!a) throw new NotFoundException('Announcement not found.');
    if (!isManagement(user.role)) {
      if (a.authorId !== user.id) throw new ForbiddenException('You can only delete your own announcements.');
      if (a.batchId) await this.access.assertBatchAccess(user, a.batchId);
    }
    await db.$transaction([
      db.notification.deleteMany({ where: { instituteId: user.instituteId, dedupeKey: `announcement:${a.id}` } }),
      db.announcement.delete({ where: { id: a.id } }),
    ]);
    return { success: true };
  }
}
