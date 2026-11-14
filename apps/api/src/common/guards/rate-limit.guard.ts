import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service.js';

export interface RateLimitOptions {
  points: number; // Maximum attempts allowed
  durationSeconds: number; // Sliding window duration in seconds
  keyPrefix?: string;
}

export const RATE_LIMIT_KEY = 'RATE_LIMIT_METADATA';
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  // In-memory sliding window fallback when Redis is unconfigured or in tests
  private static readonly memoryStore = new Map<string, { count: number; expiresAt: number }>();

  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject(RedisService) private readonly redis?: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no rate limit metadata, allow through
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Derive client identifier: X-Forwarded-For (first IP) -> req.ip -> socket remote address
    const forwarded = request.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
      request.ip ||
      request.connection?.remoteAddress ||
      '127.0.0.1';

    const path = request.route?.path || request.url || '';
    const prefix = options.keyPrefix || 'rl';
    const key = `${prefix}:${path}:${ip}`;

    const now = Date.now();
    let currentCount = 0;
    let ttlRemaining = options.durationSeconds;

    // Check Redis or fallback memory
    if (this.redis) {
      try {
        const cached = await this.redis.get<{ count: number; expiresAt: number }>(key);
        if (cached && cached.expiresAt > now) {
          currentCount = cached.count + 1;
          ttlRemaining = Math.max(1, Math.ceil((cached.expiresAt - now) / 1000));
          await this.redis.set(key, { count: currentCount, expiresAt: cached.expiresAt }, ttlRemaining);
        } else {
          currentCount = 1;
          await this.redis.set(key, { count: 1, expiresAt: now + options.durationSeconds * 1000 }, options.durationSeconds);
        }
      } catch {
        currentCount = this.checkMemoryFallback(key, options, now);
      }
    } else {
      currentCount = this.checkMemoryFallback(key, options, now);
    }

    if (currentCount > options.points) {
      if (response && typeof response.setHeader === 'function') {
        response.setHeader('Retry-After', String(ttlRemaining));
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please wait ${ttlRemaining} second(s) before trying again.`,
          retryAfter: ttlRemaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private checkMemoryFallback(key: string, options: RateLimitOptions, now: number): number {
    const entry = RateLimitGuard.memoryStore.get(key);
    if (entry && entry.expiresAt > now) {
      entry.count += 1;
      return entry.count;
    }
    RateLimitGuard.memoryStore.set(key, {
      count: 1,
      expiresAt: now + options.durationSeconds * 1000,
    });
    return 1;
  }

  /** Visible for testing */
  static clearMemoryStore() {
    RateLimitGuard.memoryStore.clear();
  }
}
