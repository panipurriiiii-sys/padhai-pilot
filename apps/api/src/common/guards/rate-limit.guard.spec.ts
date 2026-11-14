import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, HttpStatus, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard.js';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;

  beforeEach(() => {
    RateLimitGuard.clearMemoryStore();
    reflector = new Reflector();
    guard = new RateLimitGuard(reflector);
  });

  const createMockContext = (ip = '192.168.1.1', path = '/api/auth/login'): ExecutionContext => {
    const headers: Record<string, string> = { 'x-forwarded-for': ip };
    const responseHeaders: Record<string, string> = {};

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          ip,
          url: path,
          route: { path },
        }),
        getResponse: () => ({
          setHeader: (name: string, val: string) => {
            responseHeaders[name] = val;
          },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('allows requests when no rate limit metadata is present', async () => {
    reflector.getAllAndOverride = () => undefined;
    const ctx = createMockContext();
    const canPass = await guard.canActivate(ctx);
    expect(canPass).toBe(true);
  });

  it('allows requests within the specified rate limit points', async () => {
    reflector.getAllAndOverride = () => ({ points: 3, durationSeconds: 60 });
    const ctx = createMockContext();

    expect(await guard.canActivate(ctx)).toBe(true);
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('throws 429 Too Many Requests when rate limit is exceeded', async () => {
    reflector.getAllAndOverride = () => ({ points: 2, durationSeconds: 60 });
    const ctx = createMockContext();

    expect(await guard.canActivate(ctx)).toBe(true);
    expect(await guard.canActivate(ctx)).toBe(true);

    try {
      await guard.canActivate(ctx);
      expect.fail('Should have thrown HttpException');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('tracks distinct IP addresses independently', async () => {
    reflector.getAllAndOverride = () => ({ points: 1, durationSeconds: 60 });
    const ctxUser1 = createMockContext('10.0.0.1');
    const ctxUser2 = createMockContext('10.0.0.2');

    expect(await guard.canActivate(ctxUser1)).toBe(true);
    expect(await guard.canActivate(ctxUser2)).toBe(true);

    // Second request from user 1 should fail
    await expect(guard.canActivate(ctxUser1)).rejects.toThrow();
  });
});
