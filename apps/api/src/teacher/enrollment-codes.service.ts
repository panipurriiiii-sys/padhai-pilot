import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import crypto from 'crypto';
import type { EnrollmentCode, EnrollmentCodeStatus } from '@padhai-pilot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { AccessService } from '../common/access/access.service.js';
import { clampLimit, isUniqueViolation, optionalString, parseDate } from '../common/db/db.js';
import { isManagement } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';

const MAX_USES_CAP = 10_000;
const DEFAULT_MAX_USES = 100;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

interface CodeRow {
  id: string;
  code: string;
  instituteId: string;
  batchId: string | null;
  issuerId: string;
  label: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
  batch?: { name: string } | null;
  issuer?: { fullName: string } | null;
}

export function codeStatus(c: Pick<CodeRow, 'isRevoked' | 'expiresAt' | 'usedCount' | 'maxUses'>, now = new Date()): EnrollmentCodeStatus {
  if (c.isRevoked) return 'REVOKED';
  if (c.expiresAt && c.expiresAt.getTime() <= now.getTime()) return 'EXPIRED';
  if (c.usedCount >= c.maxUses) return 'EXHAUSTED';
  return 'ACTIVE';
}

export function generateCode(): string {
  const bytes = crypto.randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

@Injectable()
export class EnrollmentCodesService {
  private readonly access: AccessService;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(RedisService) private readonly redis?: RedisService,
    @Optional() @Inject(AccessService) access?: AccessService,
  ) {
    this.access = access ?? new AccessService(prisma);
  }

  private shape(c: CodeRow, instituteName?: string): EnrollmentCode {
    const base = (process.env.STUDENT_PORTAL_URL || '').replace(/\/+$/, '');
    const shareLink = `${base}/?code=${encodeURIComponent(c.code)}`;
    const where = instituteName ? ` on PadhaiPilot for ${instituteName}${c.batch?.name ? ` (${c.batch.name})` : ''}` : '';
    const shareText = `Join${where} using enrollment code ${c.code}.${base ? ` Open ${shareLink}` : ''}`;
    return {
      id: c.id,
      code: c.code,
      instituteId: c.instituteId,
      batchId: c.batchId,
      batchName: c.batch?.name ?? null,
      issuerId: c.issuerId,
      ...(c.issuer ? { issuerName: c.issuer.fullName } : {}),
      label: c.label,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      remainingUses: Math.max(0, c.maxUses - c.usedCount),
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      isRevoked: c.isRevoked,
      status: codeStatus(c),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      shareText,
      shareLink,
    };
  }

  private parseMaxUses(v: unknown): number {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isInteger(n) || n < 1 || n > MAX_USES_CAP) {
      throw new BadRequestException(`maxUses must be a whole number between 1 and ${MAX_USES_CAP}.`);
    }
    return n;
  }

  /** `undefined` = leave unchanged, `null` = never expires, Date = expires then. */
  private parseExpiry(data: { expiresAt?: unknown; expiryDays?: unknown }): Date | null | undefined {
    if (data.expiresAt !== undefined) {
      if (data.expiresAt === null || data.expiresAt === '') return null;
      const d = parseDate(data.expiresAt, 'expiresAt');
      if (d.getTime() <= Date.now()) throw new BadRequestException('expiresAt must be in the future.');
      return d;
    }
    if (data.expiryDays !== undefined) {
      if (data.expiryDays === null) return null;
      const days = Number(data.expiryDays);
      if (!Number.isFinite(days) || days <= 0 || days > 3650) throw new BadRequestException('expiryDays must be between 1 and 3650.');
      return new Date(Date.now() + days * 86_400_000);
    }
    return undefined;
  }

  private async loadOwned(id: string, user: AuthenticatedUser): Promise<CodeRow> {
    const db = this.access.db();
    if (typeof id !== 'string' || !id) throw new NotFoundException('Invitation code not found.');
    const row = await db.invitationCode.findFirst({
      where: { instituteId: user.instituteId, OR: [{ id }, { code: id }] },
      include: { batch: { select: { name: true } }, issuer: { select: { fullName: true } } },
    });
    if (!row) throw new NotFoundException('Invitation code not found.');
    if (row.batchId) {
      await this.access.assertBatchAccess(user, row.batchId);
    } else if (!isManagement(user.role) && row.issuerId !== user.id) {
      throw new NotFoundException('Invitation code not found.');
    }
    return row as CodeRow;
  }

  async list(user: AuthenticatedUser, filters: { batchId?: string; limit?: unknown } = {}): Promise<EnrollmentCode[]> {
    const db = this.access.db();
    let batchScope: { batchId?: string | { in: string[] } } = {};
    if (filters.batchId) {
      await this.access.assertBatchAccess(user, filters.batchId);
      batchScope = { batchId: filters.batchId };
    }
    const staffBatchIds = await this.access.staffBatchIds(user);
    const rows = await db.invitationCode.findMany({
      where: {
        instituteId: user.instituteId,
        ...batchScope,
        // Management sees every code of the institute; faculty see codes for their batches or issued by them.
        ...(staffBatchIds === null
          ? {}
          : { OR: [{ issuerId: user.id }, { batchId: { in: staffBatchIds } }] }),
      },
      include: { batch: { select: { name: true } }, issuer: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: clampLimit(filters.limit, 100, 300),
    });
    return rows.map((r) => this.shape(r as CodeRow, user.instituteName));
  }

  async create(
    data: { batchId?: string; maxUses?: number; expiresAt?: string | null; expiryDays?: number; label?: string },
    user: AuthenticatedUser,
  ): Promise<EnrollmentCode> {
    const db = this.access.db();
    if (data.batchId) {
      const batch = await this.access.assertBatchAccess(user, data.batchId);
      if (!batch.isActive) throw new BadRequestException('This batch is archived. Restore it before issuing codes.');
    } else if (!isManagement(user.role)) {
      throw new BadRequestException('Select a batch for the enrollment code.');
    }
    const maxUses = data.maxUses === undefined ? DEFAULT_MAX_USES : this.parseMaxUses(data.maxUses);
    const expiresAt = this.parseExpiry(data) ?? null; // default: no expiry
    const label = optionalString(data.label, 'label', 80) ?? null;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const row = await db.invitationCode.create({
          data: {
            code: generateCode(),
            instituteId: user.instituteId,
            batchId: data.batchId ?? null,
            issuerId: user.id,
            maxUses,
            expiresAt,
            label,
          },
          include: { batch: { select: { name: true } }, issuer: { select: { fullName: true } } },
        });
        return this.shape(row as CodeRow, user.instituteName);
      } catch (err) {
        if (isUniqueViolation(err)) continue; // code collision: draw a new one
        throw err;
      }
    }
    throw new BadRequestException('Could not generate a unique code. Please try again.');
  }

  async update(
    id: string,
    data: { maxUses?: number; expiresAt?: string | null; expiryDays?: number | null; label?: string | null },
    user: AuthenticatedUser,
  ): Promise<EnrollmentCode> {
    const db = this.access.db();
    const existing = await this.loadOwned(id, user);
    const patch: Record<string, unknown> = {};
    if (data.maxUses !== undefined) {
      const maxUses = this.parseMaxUses(data.maxUses);
      if (maxUses < existing.usedCount) {
        throw new BadRequestException(`maxUses cannot be lower than the ${existing.usedCount} students who already used this code.`);
      }
      patch.maxUses = maxUses;
    }
    const expiry = this.parseExpiry(data);
    if (expiry !== undefined) patch.expiresAt = expiry;
    if (data.label !== undefined) patch.label = data.label === null ? null : optionalString(data.label, 'label', 80) ?? null;
    if (Object.keys(patch).length === 0) throw new BadRequestException('Nothing to update.');
    const row = await db.invitationCode.update({
      where: { id: existing.id },
      data: patch,
      include: { batch: { select: { name: true } }, issuer: { select: { fullName: true } } },
    });
    return this.shape(row as CodeRow, user.instituteName);
  }

  async revoke(id: string, user: AuthenticatedUser) {
    const db = this.access.db();
    const existing = await this.loadOwned(id, user);
    const row = await db.invitationCode.update({
      where: { id: existing.id },
      data: { isRevoked: true, revokedAt: new Date() },
      include: { batch: { select: { name: true } }, issuer: { select: { fullName: true } } },
    });
    return { success: true, message: `Code ${existing.code} revoked.`, code: this.shape(row as CodeRow, user.instituteName) };
  }

  async reactivate(id: string, user: AuthenticatedUser): Promise<EnrollmentCode> {
    const db = this.access.db();
    const existing = await this.loadOwned(id, user);
    const row = await db.invitationCode.update({
      where: { id: existing.id },
      data: { isRevoked: false, revokedAt: null },
      include: { batch: { select: { name: true } }, issuer: { select: { fullName: true } } },
    });
    return this.shape(row as CodeRow, user.instituteName);
  }

  /** Replaces the code string (old string stops working at once); limits, expiry and usage history are kept. */
  async regenerate(id: string, user: AuthenticatedUser): Promise<EnrollmentCode> {
    const db = this.access.db();
    const existing = await this.loadOwned(id, user);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const row = await db.invitationCode.update({
          where: { id: existing.id },
          data: { code: generateCode() },
          include: { batch: { select: { name: true } }, issuer: { select: { fullName: true } } },
        });
        return this.shape(row as CodeRow, user.instituteName);
      } catch (err) {
        if (isUniqueViolation(err)) continue;
        throw err;
      }
    }
    throw new BadRequestException('Could not generate a unique code. Please try again.');
  }

  /** Public pre-check used by the sign-up screens. Reveals only the institute and batch name. */
  async validatePublic(code: string, ip = '127.0.0.1') {
    const db = this.access.db();
    if (this.redis) await this.redis.enforceRateLimit(ip, 'invitationValidate');
    const clean = typeof code === 'string' ? code.trim().toUpperCase() : '';
    const invalid = () => new BadRequestException('This invitation code is invalid, expired, or has reached maximum usage.');
    if (!clean || clean.length > 64) throw invalid();
    const inv = await db.invitationCode.findUnique({
      where: { code: clean },
      include: { institute: { select: { name: true, isActive: true } }, batch: { select: { name: true, isActive: true } } },
    });
    if (!inv || !inv.institute.isActive || (inv.batch && !inv.batch.isActive) || codeStatus(inv) !== 'ACTIVE') throw invalid();
    return {
      valid: true,
      batchName: inv.batch?.name || 'General Institute Admission',
      instituteName: inv.institute.name,
    };
  }
}
