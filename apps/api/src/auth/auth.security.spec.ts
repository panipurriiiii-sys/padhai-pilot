import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { hashPassword, verifyPassword, passwordPolicyError } from '../common/security/password.js';
import { getJwtSecret, isOriginAllowed } from '../common/security/runtime.js';

const makeService = () => {
  const redis = new RedisService();
  redis.onModuleInit();
  return new AuthService(new PrismaService(), redis);
};

describe('password hashing', () => {
  it('hashes with a unique salt and verifies in constant time', async () => {
    const a = await hashPassword('correct horse battery');
    const b = await hashPassword('correct horse battery');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('correct horse battery', a)).toBe(true);
    expect(await verifyPassword('wrong horse battery', a)).toBe(false);
  });

  it('never matches plaintext or malformed stored values', async () => {
    expect(await verifyPassword('password123', 'password123')).toBe(false);
    expect(await verifyPassword('x', null)).toBe(false);
    expect(await verifyPassword('x', 'scrypt$bad')).toBe(false);
  });

  it('enforces the password policy', () => {
    expect(passwordPolicyError('short')).toMatch(/at least 8/);
    expect(passwordPolicyError('long enough password')).toBeNull();
    expect(passwordPolicyError('x'.repeat(200))).toMatch(/at most/);
  });
});

describe('AuthService credential security (demo mode)', () => {
  let auth: AuthService;
  beforeEach(() => {
    auth = makeService();
  });

  it('has no universal backdoor passwords', async () => {
    await expect(auth.validateAndLogin('teacher@padhaipilot.com', 'demo')).rejects.toThrow();
    await expect(auth.validateAndLogin('nobody@example.com', 'password123')).rejects.toThrow();
    await expect(auth.validateAndLogin('nobody@example.com', 'demo')).rejects.toThrow();
  });

  it('rejects missing credentials instead of defaulting to a demo account', async () => {
    await expect(auth.validateAndLogin('', '')).rejects.toThrow();
    await expect(auth.validateAndLogin(undefined as unknown as string, undefined as unknown as string)).rejects.toThrow();
  });

  it('rejects weak passwords at registration', async () => {
    await expect(
      auth.registerStudent({ fullName: 'Weak', email: `weak_${Date.now()}@example.com`, password: '12345' }),
    ).rejects.toThrow(/at least 8/);
  });

  it('does not reveal whether an email exists when requesting a reset', async () => {
    const known = await auth.requestPasswordReset('student@padhaipilot.com');
    const unknown = await auth.requestPasswordReset('ghost@example.com');
    expect(unknown.message).toBe(known.message);
    expect(unknown.debugToken).toBeUndefined();
  });

  it('requires the current password to change it', async () => {
    const { user } = await auth.validateAndLogin('student@padhaipilot.com', 'password123');
    await expect(auth.changePassword(user.id, 'demo', 'brandNewPassword1')).rejects.toThrow(/does not match/);
    await expect(auth.changePassword(user.id, 'password123', 'short')).rejects.toThrow(/at least 8/);
    await auth.changePassword(user.id, 'password123', 'brandNewPassword1');
    await expect(auth.validateAndLogin('student@padhaipilot.com', 'password123')).rejects.toThrow();
    const again = await auth.validateAndLogin('student@padhaipilot.com', 'brandNewPassword1');
    expect(again.user.id).toBe(user.id);
  });

  it('issues short-lived HS256 tokens', async () => {
    const { token } = await auth.validateAndLogin('student@padhaipilot.com', 'password123');
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as jwt.JwtPayload;
    expect(decoded.exp! - decoded.iat!).toBeLessThanOrEqual(24 * 60 * 60);
    const forged = jwt.sign({ ...(decoded as object), role: 'SUPER_ADMIN' }, 'some-other-secret');
    expect(() => jwt.verify(forged, getJwtSecret(), { algorithms: ['HS256'] })).toThrow();
  });
});

describe('AuthService in production mode', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    process.env.NODE_ENV = originalEnv;
  });

  it('seeds no demo accounts and rejects demo credentials', async () => {
    const auth = makeService();
    await expect(auth.validateAndLogin('super@padhaipilot.com', 'password123')).rejects.toThrow();
  });

  it('fails closed when the database is unavailable', async () => {
    const auth = makeService();
    await expect(
      auth.registerStudent({ fullName: 'Prod Student', email: 'prod@example.com', password: 'a-strong-password' }),
    ).rejects.toThrow(/unavailable/i);
  });

  it('blocks public faculty registration and demo logins', async () => {
    const auth = makeService();
    await expect(
      auth.registerTeacher({ fullName: 'Sneaky', email: 'sneaky@example.com', password: 'a-strong-password', role: 'TEACHER' }),
    ).rejects.toThrow(/invitation/i);
    await expect(auth.getDemoAdmin()).rejects.toThrow();
  });

  it('refuses to start without a strong JWT_SECRET', async () => {
    vi.stubEnv('JWT_SECRET', 'too-short');
    vi.resetModules();
    const runtime = await import('../common/security/runtime.js');
    expect(() => runtime.getJwtSecret()).toThrow(/JWT_SECRET/);
    vi.stubEnv('JWT_SECRET', 'padhaipilot-production-secret-key-2026');
    vi.resetModules();
    const leaked = await import('../common/security/runtime.js');
    expect(() => leaked.getJwtSecret()).toThrow(/publicly known/);
    vi.stubEnv('JWT_SECRET', 'x'.repeat(40));
    vi.resetModules();
    const ok = await import('../common/security/runtime.js');
    expect(ok.getJwtSecret()).toBe('x'.repeat(40));
  });
});

describe('CORS allow-list', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('only allows configured origins in production; native clients (no Origin) pass', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CORS_ORIGINS', 'https://teacher.example.com, https://student.example.com/');
    expect(isOriginAllowed('https://teacher.example.com')).toBe(true);
    expect(isOriginAllowed('https://student.example.com')).toBe(true);
    expect(isOriginAllowed('https://evil.example.net')).toBe(false);
    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it('defaults to localhost only outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CORS_ORIGINS', '');
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('https://evil.example.net')).toBe(false);
  });
});
