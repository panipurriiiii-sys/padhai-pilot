import { BadRequestException, Inject, Injectable, Logger, NotFoundException, Optional, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  BUILT_IN_PUBLISHED_THEME,
  DEFAULT_THEME_CONFIG,
  renderRuntimeOverrides,
  resolveTheme,
  validateThemeConfig,
  type PlatformThemeConfig,
  type PublishedTheme,
  type ThemeValidationResult,
} from '@padhai-pilot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

export interface ThemeActor {
  id: string;
  email: string;
}

export interface ThemeRevisionSummary {
  revision: number;
  revisionId: string;
  checksum: string;
  action: 'PUBLISH' | 'RESTORE';
  restoredFrom: number | null;
  previousRevision: number | null;
  changeSummary: string[];
  reason: string | null;
  actorId: string;
  actorEmail: string;
  isActive: boolean;
  createdAt: string;
}

interface StoredRevision extends ThemeRevisionSummary {
  config: PlatformThemeConfig;
}

/** Stable JSON (sorted keys) so checksums do not depend on property order. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export const checksumOf = (config: unknown): string => createHash('sha256').update(stableStringify(config)).digest('hex');

export const revisionIdFor = (revision: number, checksum: string): string => `r${revision}-${checksum.slice(0, 8)}`;

function flatten(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = String(value);
  }
  return out;
}

/** Human-readable list of what changed, e.g. `brand.primary: #1677FF -> #0A5BD6`. */
export function diffConfigs(before: PlatformThemeConfig, after: PlatformThemeConfig): string[] {
  const a = flatten(before);
  const b = flatten(after);
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
  const lines: string[] = [];
  for (const k of keys) {
    if (a[k] !== b[k]) lines.push(`${k}: ${a[k] ?? '(default)'} -> ${b[k] ?? '(default)'}`);
  }
  return lines;
}

const CACHE_TTL_MS = 60 * 1000;

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);

  /** In-process L1 cache; also the only store when no database is connected (dev / outage). */
  private cache: { value: PublishedTheme; expiresAt: number } | null = null;
  private memRevisions: StoredRevision[] = [];

  private hasEnsuredTable = false;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(RedisService) private readonly redis?: RedisService,
  ) {}

  /** Ensures PlatformThemeRevision table and indices exist in PostgreSQL (idempotent DDL). */
  async ensureTableExists(): Promise<void> {
    if (this.hasEnsuredTable || !this.prisma.isConnected) return;
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PlatformThemeRevision" (
            "id" TEXT NOT NULL,
            "revision" INTEGER NOT NULL,
            "revisionId" TEXT NOT NULL,
            "checksum" TEXT NOT NULL,
            "config" JSONB NOT NULL,
            "action" TEXT NOT NULL,
            "restoredFrom" INTEGER,
            "previousRevision" INTEGER,
            "changeSummary" JSONB,
            "reason" TEXT,
            "actorId" TEXT NOT NULL,
            "actorEmail" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PlatformThemeRevision_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "PlatformThemeRevision_revision_key" ON "PlatformThemeRevision"("revision");
        CREATE UNIQUE INDEX IF NOT EXISTS "PlatformThemeRevision_revisionId_key" ON "PlatformThemeRevision"("revisionId");
        CREATE INDEX IF NOT EXISTS "PlatformThemeRevision_isActive_idx" ON "PlatformThemeRevision"("isActive");
        CREATE INDEX IF NOT EXISTS "PlatformThemeRevision_createdAt_idx" ON "PlatformThemeRevision"("createdAt");
      `);
      this.hasEnsuredTable = true;
      this.logger.log('PlatformThemeRevision table verified and ready.');
    } catch (err) {
      this.logger.warn(`Could not verify PlatformThemeRevision table: ${(err as Error).message}`);
    }
  }

  /** Revision id for the \`X-Theme-Revision\` header. Never touches the database. */
  peekRevisionId(): string | null {
    return this.cache?.value.revisionId ?? null;
  }

  /**
   * The published theme, or the built-in default. NEVER throws: checks Redis first, database second,
   * with self-healing table setup and graceful in-memory fallback.
   */
  async getPublished(): Promise<PublishedTheme> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) return this.cache.value;

    // Check Redis L2 cache for instant sub-millisecond return
    if (this.redis) {
      try {
        const cached = await this.redis.get<PublishedTheme>('platform:theme:published');
        if (cached && cached.config && cached.revisionId) {
          this.cache = { value: cached, expiresAt: now + CACHE_TTL_MS };
          return cached;
        }
      } catch {
        // Continue to database / memory
      }
    }

    let value: PublishedTheme = this.memoryActive() ?? BUILT_IN_PUBLISHED_THEME;
    if (this.prisma.isConnected) {
      try {
        const row = await this.prisma.platformThemeRevision.findFirst({ where: { isActive: true }, orderBy: { revision: 'desc' } });
        if (row) {
          const checked = validateThemeConfig(row.config);
          if (checked.ok && checked.config) {
            value = {
              revision: row.revision,
              revisionId: row.revisionId,
              checksum: row.checksum,
              publishedAt: row.createdAt.toISOString(),
              config: checked.config,
            };
          } else {
            this.logger.warn(`Active theme revision ${row.revision} failed validation; serving built-in default.`);
          }
        }
      } catch (err) {
        this.logger.warn(`Theme storage unavailable, attempting self-heal: ${(err as Error).message}`);
        await this.ensureTableExists();
      }
    }
    this.cache = { value, expiresAt: now + CACHE_TTL_MS };
    this.redis?.set('platform:theme:published', value, 3600).catch(() => {});
    return value;
  }

  private memoryActive(): PublishedTheme | null {
    const row = this.memRevisions.find((r) => r.isActive);
    if (!row) return null;
    return { revision: row.revision, revisionId: row.revisionId, checksum: row.checksum, publishedAt: row.createdAt, config: row.config };
  }

  /** Validate + preview. Pure: nothing is stored. */
  validate(input: unknown): ThemeValidationResult & { previewCss: string | null; changes: string[] } {
    const result = validateThemeConfig(input);
    if (!result.ok || !result.config) return { ...result, previewCss: null, changes: [] };
    const previewCss = renderRuntimeOverrides(resolveTheme(result.config), resolveTheme(DEFAULT_THEME_CONFIG));
    return { ...result, previewCss, changes: diffConfigs(DEFAULT_THEME_CONFIG, result.config) };
  }

  async publish(input: unknown, actor: ThemeActor, reason?: string): Promise<{ theme: PublishedTheme; unchanged: boolean; changes: string[] }> {
    return this.store(input, actor, 'PUBLISH', reason);
  }

  async restore(revision: number, actor: ThemeActor, reason?: string) {
    const target = await this.getRevision(revision);
    if (!target) throw new NotFoundException(`Theme revision ${revision} does not exist.`);
    return this.store(target.config, actor, 'RESTORE', reason, revision);
  }

  private async store(
    input: unknown,
    actor: ThemeActor,
    action: 'PUBLISH' | 'RESTORE',
    reason?: string,
    restoredFrom?: number,
  ): Promise<{ theme: PublishedTheme; unchanged: boolean; changes: string[] }> {
    const result = validateThemeConfig(input);
    if (!result.ok || !result.config) {
      throw new BadRequestException({ message: 'Theme configuration is invalid.', errors: result.errors, contrast: result.contrast });
    }
    const config = result.config;
    const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 500) || null : null;
    const checksum = checksumOf(config);

    const current = await this.getPublished();
    if (current.revision > 0 && current.checksum === checksum) {
      return { theme: current, unchanged: true, changes: [] };
    }
    const changes = diffConfigs(current.config, config);
    const base = {
      checksum,
      action,
      restoredFrom: restoredFrom ?? null,
      previousRevision: current.revision > 0 ? current.revision : null,
      changeSummary: changes,
      reason: cleanReason,
      actorId: actor.id,
      actorEmail: actor.email,
    };

    if (this.prisma.isConnected) {
      let created: { revision: number; revisionId: string; createdAt: Date } | null = null;
      for (let attempt = 0; attempt < 3 && !created; attempt++) {
        try {
          created = await this.prisma.$transaction(async (tx) => {
            const last = await tx.platformThemeRevision.findFirst({ orderBy: { revision: 'desc' }, select: { revision: true } });
            const revision = (last?.revision ?? 0) + 1;
            const revisionId = revisionIdFor(revision, checksum);
            await tx.platformThemeRevision.updateMany({ where: { isActive: true }, data: { isActive: false } });
            const row = await tx.platformThemeRevision.create({
              data: { ...base, revision, revisionId, config: config as object, isActive: true },
            });
            await tx.auditLog.create({
              data: {
                userId: actor.id,
                action: `THEME_${action}`,
                resourceType: 'PlatformTheme',
                resourceId: revisionId,
                metadata: { revision, previousRevision: base.previousRevision, changes, reason: cleanReason, actorEmail: actor.email },
              },
            });
            return { revision: row.revision, revisionId: row.revisionId, createdAt: row.createdAt };
          });
        } catch (err) {
          this.logger.warn(`Theme publish attempt ${attempt + 1} failed: ${(err as Error).message}. Self-healing table...`);
          await this.ensureTableExists();
          if (attempt === 2) {
            this.logger.error(`Theme database publish failed after 3 attempts: ${(err as Error).message}. Falling back to distributed cache.`);
          }
        }
      }

      if (created) {
        const theme: PublishedTheme = {
          revision: created.revision,
          revisionId: created.revisionId,
          checksum,
          publishedAt: created.createdAt.toISOString(),
          config,
        };
        this.cache = { value: theme, expiresAt: Date.now() + CACHE_TTL_MS };
        this.redis?.set('platform:theme:published', theme, 86400).catch(() => {});
        return { theme, unchanged: false, changes };
      }
    }

    // Database unavailable or table write issue: persist to Redis & in-memory store so admin can change theme!
    const revision = (this.memRevisions[0]?.revision ?? current.revision ?? 0) + 1;
    const stored: StoredRevision = {
      ...base,
      revision,
      revisionId: revisionIdFor(revision, checksum),
      isActive: true,
      createdAt: new Date().toISOString(),
      config,
    };
    this.memRevisions.forEach((r) => (r.isActive = false));
    this.memRevisions.unshift(stored);
    const theme: PublishedTheme = {
      revision: stored.revision,
      revisionId: stored.revisionId,
      checksum: stored.checksum,
      publishedAt: stored.createdAt,
      config: stored.config,
    };
    this.cache = { value: theme, expiresAt: Date.now() + CACHE_TTL_MS };
    this.redis?.set('platform:theme:published', theme, 86400).catch(() => {});
    return { theme, unchanged: false, changes };
  }

  async history(limit = 25): Promise<ThemeRevisionSummary[]> {
    const take = Math.min(Math.max(Math.trunc(limit) || 25, 1), 100);
    if (this.prisma.isConnected) {
      try {
        const rows = await this.prisma.platformThemeRevision.findMany({ orderBy: { revision: 'desc' }, take });
        if (rows.length > 0) {
          return rows.map((r) => ({
            revision: r.revision,
            revisionId: r.revisionId,
            checksum: r.checksum,
            action: r.action as 'PUBLISH' | 'RESTORE',
            restoredFrom: r.restoredFrom,
            previousRevision: r.previousRevision,
            changeSummary: Array.isArray(r.changeSummary) ? (r.changeSummary as string[]) : [],
            reason: r.reason,
            actorId: r.actorId,
            actorEmail: r.actorEmail,
            isActive: r.isActive,
            createdAt: r.createdAt.toISOString(),
          }));
        }
      } catch (err) {
        this.logger.warn(`Theme history lookup failed: ${(err as Error).message}`);
        await this.ensureTableExists();
      }
    }
    return this.memRevisions.slice(0, take).map(({ config: _config, ...summary }) => summary);
  }

  private async getRevision(revision: number): Promise<{ config: PlatformThemeConfig } | null> {
    if (this.prisma.isConnected) {
      try {
        const row = await this.prisma.platformThemeRevision.findUnique({ where: { revision } });
        return row ? { config: row.config as unknown as PlatformThemeConfig } : null;
      } catch {
        await this.ensureTableExists();
      }
    }
    return this.memRevisions.find((r) => r.revision === revision) ?? null;
  }

  /** Drop the L1 cache (tests / after external changes). */
  invalidate(): void {
    this.cache = null;
    this.redis?.del('platform:theme:published').catch(() => {});
  }
}
