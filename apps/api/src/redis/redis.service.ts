import {
  Injectable,
  Logger,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import {
  loadRedisConfig,
  RedisEnvironmentConfig,
  RedisKeys,
  RedisTTLs,
  RateLimitProfiles,
  hashIdentifier,
} from './redis.config.js';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  resetTimestamp: number;
  headers: Record<string, string>;
}

export class RateLimitExceededException extends HttpException {
  constructor(public readonly rateLimitResult: RateLimitResult, customMessage?: string) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message:
          customMessage ||
          `Rate limit exceeded. Please wait ${rateLimitResult.resetInSeconds} seconds before trying again.`,
        retryAfter: rateLimitResult.resetInSeconds,
        limit: rateLimitResult.limit,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}

interface MemoryRateLimitRecord {
  timestamps: number[];
}

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private upstashLimiters = new Map<string, Ratelimit>();
  public isConnected = false;
  public config!: RedisEnvironmentConfig;

  // In-memory zero-latency cache fallback for local/offline execution and test isolation
  private localMemoryCache = new Map<string, MemoryCacheEntry>();
  // In-memory sliding-window log for rate limiting when Redis is unconfigured
  private localRateLimitMap = new Map<string, MemoryRateLimitRecord>();

  onModuleInit() {
    this.config = loadRedisConfig();

    if (process.env.REDIS_ENABLED === 'false') {
      this.client = null;
      this.isConnected = false;
      this.logger.log('Redis is disabled (REDIS_ENABLED=false). Operating with zero-latency in-memory cache & rate limiter.');
      return;
    }

    if (this.config.url && this.config.token) {
      try {
        this.client = new Redis({
          url: this.config.url,
          token: this.config.token,
        });
        this.isConnected = true;
        this.logger.log('Upstash Redis REST client initialized for serverless operations.');

        // Initialize Upstash Ratelimit algorithms for known profiles
        for (const [key, profile] of Object.entries(RateLimitProfiles)) {
          const limiter = new Ratelimit({
            redis: this.client,
            limiter: Ratelimit.slidingWindow(
              profile.maxRequests,
              `${profile.windowSeconds} s` as any,
            ),
            prefix: `${RedisKeys.version}:rl:${profile.action}`,
            ephemeralCache: new Map(),
          });
          this.upstashLimiters.set(key, limiter);
        }
      } catch (err) {
        this.logger.warn(
          `Could not initialize Redis client: ${(err as Error).message}. Operating with resilient in-memory fallback.`,
        );
        this.client = null;
        this.isConnected = false;
      }
    } else {
      this.logger.log('Redis credentials not set. Operating with graceful local fallback cache.');
    }
  }

  /**
   * Helper to execute Redis commands with bounded timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    fallback: () => T | Promise<T>,
  ): Promise<T> {
    if (!this.client || !this.isConnected) {
      return fallback();
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Redis operation timed out')), this.config.timeoutMs),
    );

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (err) {
      this.logger.warn(`Redis operation failed or timed out: ${(err as Error).message}. Falling back.`);
      return fallback();
    }
  }

  // -------------------------------------------------------------
  // CACHE GET / SET / DEL (Generic)
  // -------------------------------------------------------------

  async get<T>(key: string): Promise<T | null> {
    return this.executeWithTimeout<T | null>(
      async () => {
        const val = await this.client!.get<T>(key);
        return val ?? null;
      },
      () => {
        const entry = this.localMemoryCache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
          this.localMemoryCache.delete(key);
          return null;
        }
        return entry.value as T;
      },
    );
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = RedisTTLs.DEFAULT_CACHE_SECONDS,
  ): Promise<void> {
    await this.executeWithTimeout<void>(
      async () => {
        await this.client!.set(key, value, { ex: ttlSeconds });
      },
      () => {
        this.localMemoryCache.set(key, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      },
    );
  }

  async del(key: string): Promise<void> {
    await this.executeWithTimeout<void>(
      async () => {
        await this.client!.del(key);
      },
      () => {
        this.localMemoryCache.delete(key);
      },
    );
    this.localMemoryCache.delete(key);
  }

  // -------------------------------------------------------------
  // TENANT ISOLATION SPECIFIC METHODS
  // -------------------------------------------------------------

  async getTenantBranding<T>(instituteId: string): Promise<T | null> {
    const key = RedisKeys.tenantBranding(instituteId);
    return this.get<T>(key);
  }

  async setTenantBranding<T>(
    instituteId: string,
    branding: T,
    ttlSeconds: number = RedisTTLs.BRANDING_SECONDS,
  ): Promise<void> {
    const key = RedisKeys.tenantBranding(instituteId);
    await this.set(key, branding, ttlSeconds);
  }

  async getTenantFeatures<T>(instituteId: string): Promise<T | null> {
    const key = RedisKeys.tenantFeatures(instituteId);
    return this.get<T>(key);
  }

  async setTenantFeatures<T>(
    instituteId: string,
    features: T,
    ttlSeconds: number = RedisTTLs.FEATURES_SECONDS,
  ): Promise<void> {
    const key = RedisKeys.tenantFeatures(instituteId);
    await this.set(key, features, ttlSeconds);
  }

  async getTeacherDashboard<T>(instituteId: string, teacherId: string): Promise<T | null> {
    const key = RedisKeys.teacherDashboard(instituteId, teacherId);
    return this.get<T>(key);
  }

  async setTeacherDashboard<T>(
    instituteId: string,
    teacherId: string,
    data: T,
    ttlSeconds: number = RedisTTLs.DASHBOARD_SECONDS,
  ): Promise<void> {
    const key = RedisKeys.teacherDashboard(instituteId, teacherId);
    await this.set(key, data, ttlSeconds);
  }

  async invalidateTeacherDashboard(instituteId: string, teacherId: string): Promise<void> {
    const key = RedisKeys.teacherDashboard(instituteId, teacherId);
    await this.del(key);
    this.logger.debug(`Dashboard cache invalidated for teacher: ${teacherId} in tenant: ${instituteId}`);
  }

  async invalidateTenant(instituteId: string): Promise<void> {
    const brandingKey = RedisKeys.tenantBranding(instituteId);
    const featuresKey = RedisKeys.tenantFeatures(instituteId);
    await this.del(brandingKey);
    await this.del(featuresKey);

    const prefix = RedisKeys.tenantPrefix(instituteId);
    // Purge memory store entries for this tenant
    for (const k of this.localMemoryCache.keys()) {
      if (k.startsWith(prefix)) {
        this.localMemoryCache.delete(k);
      }
    }

    this.logger.debug(`Tenant cache invalidated for institute: ${instituteId}`);
  }

  // -------------------------------------------------------------
  // ADVANCED RATE LIMITING WITH UPSTASH & MEMORY SLIDING WINDOW
  // -------------------------------------------------------------

  async checkRateLimit(
    identifier: string,
    action: string,
    maxRequests?: number,
    windowSeconds?: number,
  ): Promise<RateLimitResult> {
    const profile = RateLimitProfiles[action] || {
      action,
      maxRequests: maxRequests ?? RateLimitProfiles.default.maxRequests,
      windowSeconds: windowSeconds ?? RateLimitProfiles.default.windowSeconds,
    };

    const effectiveMax = maxRequests ?? profile.maxRequests;
    const effectiveWindow = windowSeconds ?? profile.windowSeconds;

    // Securely hash the identifier (IP + account ID) so no raw PII/emails reside in Redis
    const hashedKey = hashIdentifier(identifier);

    // If connected to Upstash and limiter is configured for profile
    if (this.client && this.isConnected) {
      try {
        let limiter = this.upstashLimiters.get(action);
        if (!limiter) {
          limiter = new Ratelimit({
            redis: this.client,
            limiter: Ratelimit.slidingWindow(
              effectiveMax,
              `${effectiveWindow} s` as any,
            ),
            prefix: `${RedisKeys.version}:rl:${action}`,
          });
          this.upstashLimiters.set(action, limiter);
        }

        const res = await limiter.limit(hashedKey);
        const resetInSeconds = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));

        const headers: Record<string, string> = {
          'X-RateLimit-Limit': String(res.limit),
          'X-RateLimit-Remaining': String(Math.max(0, res.remaining)),
          'X-RateLimit-Reset': String(Math.ceil(res.reset / 1000)),
        };

        if (!res.success) {
          headers['Retry-After'] = String(resetInSeconds);
        }

        return {
          allowed: res.success,
          limit: res.limit,
          remaining: Math.max(0, res.remaining),
          resetInSeconds,
          resetTimestamp: res.reset,
          headers,
        };
      } catch (err) {
        this.logger.warn(`Upstash rate limiting failed: ${(err as Error).message}. Falling back.`);

        // Explicit security policy check: if configured to fail-closed on auth outages
        const isAuthAction = ['login', 'register', 'forgot_password'].includes(action);
        if (this.config?.failClosedOnAuth && isAuthAction) {
          return {
            allowed: false,
            limit: effectiveMax,
            remaining: 0,
            resetInSeconds: effectiveWindow,
            resetTimestamp: Date.now() + effectiveWindow * 1000,
            headers: {
              'Retry-After': String(effectiveWindow),
              'X-RateLimit-Limit': String(effectiveMax),
              'X-RateLimit-Remaining': '0',
            },
          };
        }
      }
    }

    // High-performance Sliding-Window Memory Fallback
    const now = Date.now();
    const windowMs = effectiveWindow * 1000;
    const windowStart = now - windowMs;

    let record = this.localRateLimitMap.get(hashedKey);
    if (!record) {
      record = { timestamps: [] };
      this.localRateLimitMap.set(hashedKey, record);
    }

    // Purge timestamps older than the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const count = record.timestamps.length;
    const allowed = count < effectiveMax;

    if (allowed) {
      record.timestamps.push(now);
    }

    const remaining = Math.max(0, effectiveMax - (count + (allowed ? 1 : 0)));
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTimestamp = oldestTimestamp + windowMs;
    const resetInSeconds = Math.max(1, Math.ceil((resetTimestamp - now) / 1000));

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(effectiveMax),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(resetTimestamp / 1000)),
    };

    if (!allowed) {
      headers['Retry-After'] = String(resetInSeconds);
    }

    return {
      allowed,
      limit: effectiveMax,
      remaining,
      resetInSeconds,
      resetTimestamp,
      headers,
    };
  }

  /**
   * Enforces rate limiting directly. If limit is exceeded, throws RateLimitExceededException (HTTP 429).
   */
  async enforceRateLimit(
    identifier: string,
    action: string,
    maxRequests?: number,
    windowSeconds?: number,
  ): Promise<RateLimitResult> {
    const result = await this.checkRateLimit(identifier, action, maxRequests, windowSeconds);
    if (!result.allowed) {
      throw new RateLimitExceededException(result);
    }
    return result;
  }
}
