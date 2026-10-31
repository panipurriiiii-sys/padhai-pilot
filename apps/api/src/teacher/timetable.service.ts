import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type { TimetableConflictError, TimetableSlotItem, WeekDay } from '@padhai-pilot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccessService } from '../common/access/access.service.js';
import { clampLimit, optionalString, requireString } from '../common/db/db.js';
import { isManagement } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';

export const WEEK_DAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_ORDER = new Map(WEEK_DAYS.map((d, i) => [d, i]));
const STAFF_MEMBER_ROLES = ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'TEACHER'];

export function toMinutes(hhmm: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) throw new BadRequestException(`"${hhmm}" is not a valid 24h time (HH:mm).`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean => aStart < bEnd && bStart < aEnd;

interface SlotInput {
  subject?: unknown;
  dayOfWeek?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  room?: unknown;
  notes?: unknown;
  teacherId?: unknown;
}

@Injectable()
export class TimetableService {
  private readonly access: AccessService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(AccessService) access?: AccessService,
  ) {
    this.access = access ?? new AccessService(prisma);
  }

  private shape(s: any): TimetableSlotItem {
    return {
      id: s.id,
      batchId: s.batchId,
      batchName: s.batch?.name ?? '',
      teacherId: s.teacherId,
      ...(s.teacher?.fullName ? { teacherName: s.teacher.fullName } : {}),
      subject: s.subject,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room ?? null,
      notes: s.notes ?? null,
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString(),
    };
  }

  async list(user: AuthenticatedUser, opts: { batchId?: string; limit?: unknown } = {}): Promise<TimetableSlotItem[]> {
    const db = this.access.db();
    let batchFilter: { batchId?: string | { in: string[] } } = {};
    if (opts.batchId) {
      await this.access.assertBatchAccess(user, opts.batchId);
      batchFilter = { batchId: opts.batchId };
    } else {
      const ids = await this.access.staffBatchIds(user);
      if (ids !== null) batchFilter = { batchId: { in: ids } };
    }
    const rows = await db.timetableSlot.findMany({
      where: { instituteId: user.instituteId, ...batchFilter },
      include: { batch: { select: { name: true } }, teacher: { select: { fullName: true } } },
      take: clampLimit(opts.limit, 300, 500),
    });
    return rows
      .map((r) => this.shape(r))
      .sort((a, b) => (DAY_ORDER.get(a.dayOfWeek) ?? 9) - (DAY_ORDER.get(b.dayOfWeek) ?? 9) || a.startTime.localeCompare(b.startTime));
  }

  private async resolveTeacher(batch: { teacherId: string }, teacherId: unknown, user: AuthenticatedUser): Promise<string> {
    if (teacherId === undefined || teacherId === null || teacherId === '') {
      return isManagement(user.role) ? batch.teacherId : user.id;
    }
    const tid = requireString(teacherId, 'teacherId', 64);
    if (tid === user.id || tid === batch.teacherId) return tid;
    if (!isManagement(user.role)) throw new BadRequestException('Only the owner can schedule another teacher.');
    const m = await this.access.db().instituteMembership.findUnique({
      where: { instituteId_userId: { instituteId: user.instituteId, userId: tid } },
      select: { role: true, status: true },
    });
    if (!m || m.status !== 'ACTIVE' || !STAFF_MEMBER_ROLES.includes(m.role)) {
      throw new BadRequestException('teacherId must be an active staff member of this institute.');
    }
    return tid;
  }

  private async assertNoConflict(
    user: AuthenticatedUser,
    slot: { batchId: string; teacherId: string; dayOfWeek: WeekDay; startTime: string; endTime: string; room: string | null },
    exceptId?: string,
  ) {
    const db = this.access.db();
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    const sameDay = await db.timetableSlot.findMany({
      where: { instituteId: user.instituteId, dayOfWeek: slot.dayOfWeek, ...(exceptId ? { id: { not: exceptId } } : {}) },
      include: { batch: { select: { name: true } } },
      take: 500,
    });
    const conflicts: TimetableConflictError['conflicts'] = [];
    for (const o of sameDay) {
      if (!overlaps(start, end, toMinutes(o.startTime), toMinutes(o.endTime))) continue;
      const base = { slotId: o.id, batchName: o.batch.name, dayOfWeek: o.dayOfWeek as WeekDay, startTime: o.startTime, endTime: o.endTime };
      if (o.batchId === slot.batchId) conflicts.push({ kind: 'BATCH', ...base });
      if (o.teacherId === slot.teacherId) conflicts.push({ kind: 'TEACHER', ...base });
      if (slot.room && o.room && o.room.trim().toLowerCase() === slot.room.trim().toLowerCase()) conflicts.push({ kind: 'ROOM', ...base });
    }
    if (conflicts.length) {
      const kinds = [...new Set(conflicts.map((c) => c.kind.toLowerCase()))].join(', ');
      throw new ConflictException({ statusCode: 409, message: `This slot clashes with an existing one (${kinds}).`, conflicts });
    }
  }

  private parseSlot(data: SlotInput, base?: { subject: string; dayOfWeek: string; startTime: string; endTime: string; room: string | null }) {
    const subject = data.subject !== undefined ? requireString(data.subject, 'subject', 120) : base!.subject;
    const dayOfWeek = (data.dayOfWeek !== undefined ? String(data.dayOfWeek).toUpperCase() : base!.dayOfWeek) as WeekDay;
    if (!WEEK_DAYS.includes(dayOfWeek)) throw new BadRequestException('dayOfWeek must be MONDAY..SUNDAY.');
    const startTime = data.startTime !== undefined ? requireString(data.startTime, 'startTime', 5) : base!.startTime;
    const endTime = data.endTime !== undefined ? requireString(data.endTime, 'endTime', 5) : base!.endTime;
    if (toMinutes(endTime) <= toMinutes(startTime)) throw new BadRequestException('endTime must be after startTime.');
    const room = data.room !== undefined ? optionalString(data.room, 'room', 60) ?? null : base?.room ?? null;
    return { subject, dayOfWeek, startTime, endTime, room };
  }

  async create(batchId: string, data: SlotInput, user: AuthenticatedUser): Promise<TimetableSlotItem> {
    const db = this.access.db();
    const batch = await this.access.assertBatchAccess(user, batchId);
    if (!batch.isActive) throw new BadRequestException('This batch is archived.');
    const parsed = this.parseSlot(data);
    const teacherId = await this.resolveTeacher(batch, data.teacherId, user);
    const notes = optionalString(data.notes, 'notes', 500) ?? null;
    await this.assertNoConflict(user, { batchId, teacherId, ...parsed });
    const row = await db.timetableSlot.create({
      data: { instituteId: user.instituteId, batchId, teacherId, ...parsed, notes },
      include: { batch: { select: { name: true } }, teacher: { select: { fullName: true } } },
    });
    return this.shape(row);
  }

  private async loadSlot(slotId: string, user: AuthenticatedUser) {
    const db = this.access.db();
    const slot = await db.timetableSlot.findFirst({ where: { id: slotId, instituteId: user.instituteId } });
    if (!slot) throw new NotFoundException('Timetable slot not found.');
    const batch = await this.access.assertBatchAccess(user, slot.batchId);
    return { slot, batch };
  }

  async update(slotId: string, data: SlotInput, user: AuthenticatedUser): Promise<TimetableSlotItem> {
    const db = this.access.db();
    const { slot, batch } = await this.loadSlot(slotId, user);
    const parsed = this.parseSlot(data, slot);
    const teacherId = data.teacherId !== undefined ? await this.resolveTeacher(batch, data.teacherId, user) : slot.teacherId;
    await this.assertNoConflict(user, { batchId: slot.batchId, teacherId, ...parsed }, slotId);
    const row = await db.timetableSlot.update({
      where: { id: slotId },
      data: {
        ...parsed,
        teacherId,
        ...(data.notes !== undefined ? { notes: optionalString(data.notes, 'notes', 500) ?? null } : {}),
      },
      include: { batch: { select: { name: true } }, teacher: { select: { fullName: true } } },
    });
    return this.shape(row);
  }

  async remove(slotId: string, user: AuthenticatedUser) {
    const db = this.access.db();
    await this.loadSlot(slotId, user);
    await db.timetableSlot.delete({ where: { id: slotId } });
    return { success: true };
  }
}
