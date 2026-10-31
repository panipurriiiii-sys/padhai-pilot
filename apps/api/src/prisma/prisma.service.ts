import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Picks the runtime connection string without ever logging it.
 *
 * Order: DATABASE_URL_POOLED (explicit pooler) -> DATABASE_URL -> POSTGRES_URL.
 * `prisma+postgres://` values (PRISMA_DATABASE_URL, Accelerate/Prisma Postgres HTTP) need the Accelerate
 * client extension and are intentionally skipped: this API uses the regular engine over TCP.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const candidates = [env.DATABASE_URL_POOLED, env.DATABASE_URL, env.POSTGRES_URL];
  const url = candidates.map((c) => c?.trim()).find((c) => c && /^postgres(ql)?:\/\//i.test(c));
  if (!url) return undefined;
  return withPoolDefaults(url, env);
}

/**
 * Serverless-friendly pool settings: one connection per function instance by default (many instances x
 * pool size is what exhausts a managed Postgres). Anything already present on the URL wins.
 * Override with DB_CONNECTION_LIMIT when Fluid-compute concurrency makes a single connection a bottleneck.
 */
export function withPoolDefaults(url: string, env: NodeJS.ProcessEnv = process.env): string {
  const limit = Number(env.DB_CONNECTION_LIMIT) > 0 ? String(Math.floor(Number(env.DB_CONNECTION_LIMIT))) : '1';
  const hasQuery = url.includes('?');
  const has = (key: string) => new RegExp(`[?&]${key}=`, 'i').test(url);
  const extra: string[] = [];
  if (!has('connection_limit')) extra.push(`connection_limit=${limit}`);
  if (!has('pool_timeout')) extra.push('pool_timeout=20');
  if (extra.length === 0) return url;
  return `${url}${hasQuery ? '&' : '?'}${extra.join('&')}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  /** True only after a successful connect. Domain services fail closed (503) when this is false. */
  public isConnected = false;

  constructor() {
    const url = resolveDatabaseUrl();
    super({
      ...(url ? { datasourceUrl: url } : {}),
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    // The only work done at module init is the connect itself (keeps cold start minimal).
    if (!resolveDatabaseUrl()) {
      this.logger.warn('No usable PostgreSQL URL (DATABASE_URL / DATABASE_URL_POOLED / POSTGRES_URL). Data endpoints will return 503.');
      return;
    }
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Connected to PostgreSQL');
    } catch (err) {
      this.logger.error(`Could not connect to PostgreSQL: ${(err as Error).message.split('\n')[0]}`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
