import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { assertDb } from '../db/db.js';
import { isManagement } from '../security/roles.js';
import type { AuthenticatedUser } from '../types.js';

interface SessionCacheEntry {
  expiresAt: number;
  tokenVersion: number;
}

/**
 * Revocation design (cheap + serverless friendly):
 *   - The JWT carries `tv` (User.tokenVersion at issue time). Bumping the column signs the user out everywhere.
 *   - Every authenticated request runs ONE primary-key/unique-index lookup (membership + institute + user
 *     flags) via `verifySession`, so a revoked/suspended membership, a deactivated user, a suspended
 *     tenant or a changed role stops working immediately on the next cache miss.
 *   - A tiny per-instance positive cache (SESSION_CHECK_TTL_MS, default 10 s, 0 = off) bounds the extra DB
 *     load for bursts of requests; the worst-case revocation delay is that TTL per warm instance.
 *   - Sensitive writes call `assertActiveMembership`, which always bypasses the cache.
 *   - No Redis involved: no extra paid-command usage and nothing to keep in sync.
 */
const sessionCache = new Map<string, SessionCacheEntry>();

export function clearSessionCache(): void {
  sessionCache.clear();
}

const ttlMs = (): number => {
  const raw = Number(process.env.SESSION_CHECK_TTL_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : 10_000;
};

export interface SessionClaims {
  id: string;
  role: string;
  instituteId?: string;
  tv?: number;
}

@Injectable()
export class AccessService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Database handle that is guaranteed connected (503 otherwise). */
  db(): PrismaService {
    assertDb(this.prisma);
    return this.prisma;
  }

  // ------------------------------------------------------------------------
  // Session / membership verification
  // ------------------------------------------------------------------------

  async verifySession(claims: SessionClaims, options: { skipCache?: boolean } = {}): Promise<void> {
    if (!this.prisma.isConnected) {
      // Production must never trust a token it cannot check. Non-production keeps the in-memory demo
      // sessions working (those accounts do not exist in PostgreSQL).
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('The service is temporarily unavailable. Please try again shortly.');
      }
      return;
    }

    const instituteId = claims.instituteId || '';
    const key = `${claims.id}:${instituteId}:${claims.role}`;
    const claimedVersion = typeof claims.tv === 'number' ? claims.tv : 0;
    const now = Date.now();
    const cached = sessionCache.get(key);
    if (!options.skipCache && cached && cached.expiresAt > now && cached.tokenVersion === claimedVersion) return;

    const invalid = () => new UnauthorizedException('Your session is no longer valid. Please sign in again.');

    if (claims.role === 'SUPER_ADMIN' || !instituteId) {
      const user = await this.prisma.user.findUnique({
        where: { id: claims.id },
        select: { isActive: true, role: true, tokenVersion: true },
      });
      if (!user || !user.isActive || user.tokenVersion !== claimedVersion) throw invalid();
      if (claims.role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') throw invalid();
      // A user with no institute may only hold the student role (pre-enrolment); never staff.
      if (claims.role !== 'SUPER_ADMIN' && claims.role !== 'STUDENT') throw invalid();
    } else {
      const membership = await this.prisma.instituteMembership.findUnique({
        where: { instituteId_userId: { instituteId, userId: claims.id } },
        select: {
          status: true,
          role: true,
          institute: { select: { isActive: true } },
          user: { select: { isActive: true, tokenVersion: true } },
        },
      });
      if (
        !membership ||
        membership.status !== 'ACTIVE' ||
        membership.role !== claims.role ||
        !membership.institute.isActive ||
        !membership.user.isActive ||
        membership.user.tokenVersion !== claimedVersion
      ) {
        throw invalid();
      }
    }

    const ttl = ttlMs();
    if (ttl > 0) {
      sessionCache.set(key, { expiresAt: now + ttl, tokenVersion: claimedVersion });
      if (sessionCache.size > 5000) sessionCache.clear(); // hard bound on memory
    }
  }

  /** Uncached membership re-check for sensitive writes (grading, publishing, payroll, invitations...). */
  async assertActiveMembership(user: AuthenticatedUser): Promise<void> {
    await this.verifySession(user, { skipCache: true });
  }

  // ------------------------------------------------------------------------
  // Batch-level authorisation
  // ------------------------------------------------------------------------

  /**
   * Batches a staff member may act on. Management roles: every batch of their institute (returns null =
   * "no batch restriction beyond the tenant"). Faculty/teachers: batches they lead or are assigned to.
   */
  async staffBatchIds(user: AuthenticatedUser): Promise<string[] | null> {
    const db = this.db();
    if (isManagement(user.role)) return null;
    const [led, assigned] = await Promise.all([
      db.batch.findMany({
        where: { instituteId: user.instituteId, teacherId: user.id, isActive: true },
        select: { id: true },
        take: 500,
      }),
      db.batchFaculty.findMany({
        where: { instituteId: user.instituteId, facultyId: user.id },
        select: { batchId: true },
        take: 500,
      }),
    ]);
    return [...new Set([...led.map((b) => b.id), ...assigned.map((a) => a.batchId)])];
  }

  /**
   * Loads a batch the caller may act on.
   *  - Batch missing or in another institute  -> 404 (cross-tenant id guessing reveals nothing)
   *  - Batch in the institute but not theirs   -> 403 (faculty only)
   */
  async assertBatchAccess(user: AuthenticatedUser, batchId: string) {
    const db = this.db();
    if (typeof batchId !== 'string' || !batchId) throw new NotFoundException('Batch not found.');
    const batch = await db.batch.findFirst({
      where: { id: batchId, instituteId: user.instituteId },
      select: { id: true, instituteId: true, name: true, code: true, subject: true, gradeLevel: true, room: true, teacherId: true, isActive: true },
    });
    if (!batch) throw new NotFoundException('Batch not found.');
    if (isManagement(user.role)) return batch;
    if (batch.teacherId === user.id) return batch;
    const assignment = await db.batchFaculty.findFirst({
      where: { batchId, facultyId: user.id, instituteId: user.instituteId },
      select: { id: true },
    });
    if (!assignment) throw new ForbiddenException('You are not assigned to this batch.');
    return batch;
  }

  /** ACTIVE enrolments of the student inside their (JWT) institute. */
  async studentBatchIds(user: AuthenticatedUser): Promise<string[]> {
    const db = this.db();
    if (!user.instituteId) return [];
    const rows = await db.enrollment.findMany({
      where: { studentId: user.id, instituteId: user.instituteId, status: 'ACTIVE' },
      select: { batchId: true },
      take: 100,
    });
    return rows.map((r) => r.batchId);
  }

  /** Student must be enrolled in the batch (used before reading batch-scoped resources). */
  async assertStudentInBatch(user: AuthenticatedUser, batchId: string): Promise<void> {
    const ids = await this.studentBatchIds(user);
    if (!ids.includes(batchId)) throw new NotFoundException('Not found.');
  }
}
