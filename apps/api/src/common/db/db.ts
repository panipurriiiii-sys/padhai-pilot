import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

/** Minimal shape of PrismaService that guards need (keeps unit tests free of the real client). */
export interface DbStatus {
  isConnected: boolean;
}

/**
 * Fail closed: when the database is not connected the API must never serve fabricated or process-local
 * data, in any environment. Demo data for local development is loaded into a local PostgreSQL by
 * `npm run seed:demo --workspace=@padhai-pilot/api`, not faked in memory.
 */
export function assertDb(prisma: DbStatus): void {
  if (!prisma.isConnected) {
    throw new ServiceUnavailableException('The data service is temporarily unavailable. Please try again shortly.');
  }
}

export function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === 'P2002';
}

/** Bounded list sizes: every list endpoint has a default and a hard maximum. */
export function clampLimit(raw: unknown, def = 50, max = 200): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : typeof raw === 'number' ? Math.floor(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

export function clampOffset(raw: unknown): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : typeof raw === 'number' ? Math.floor(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100_000) : 0;
}

/** Parses an ISO date or datetime string; throws 400 on garbage so bad input never reaches Prisma. */
export function parseDate(value: unknown, field = 'date'): Date {
  if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`${field} is required.`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`${field} is not a valid date.`);
  return d;
}

/** Calendar date (UTC midnight) for @db.Date columns. */
export function toDateOnly(value: string | Date, field = 'date'): Date {
  const d = typeof value === 'string' ? parseDate(value, field) : value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

export function requireString(value: unknown, field: string, max = 5000): string {
  if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`${field} is required.`);
  const v = value.trim();
  if (v.length > max) throw new BadRequestException(`${field} is too long (max ${max} characters).`);
  return v;
}

export function optionalString(value: unknown, field: string, max = 5000): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requireString(value, field, max);
}

/** Only http(s) URLs are accepted for attachment/link fields (blocks javascript:/data: payloads). */
export function optionalUrl(value: unknown, field: string): string | undefined {
  const v = optionalString(value, field, 2048);
  if (!v) return undefined;
  if (!/^https?:\/\//i.test(v)) throw new BadRequestException(`${field} must be an http(s) URL.`);
  return v;
}
