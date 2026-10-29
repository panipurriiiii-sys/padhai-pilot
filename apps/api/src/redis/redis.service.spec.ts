import { describe, it, expect, beforeEach } from 'vitest';
import { RedisService, RateLimitExceededException } from './redis.service.js';
import { hashIdentifier, RedisKeys, RedisTTLs } from './redis.config.js';

describe('RedisService & Extreme Cost Optimization Architecture', () => {
  let redisService: RedisService;

  beforeEach(() => {
    // Reset service before each test
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    redisService = new RedisService();
    redisService.onModuleInit();
  });

  describe('Initialization & Safe Fallback', () => {
    it('should initialize gracefully when Redis credentials are not configured', () => {
      expect(redisService.isConnected).toBe(false);
      expect(redisService.config.cacheEnabled).toBe(false);
    });

    it('should support local fallback cache get, set, and del seamlessly', async () => {
      await redisService.set('test:key:1', { message: 'hello' }, 10);
      const val = await redisService.get<{ message: string }>('test:key:1');
      expect(val).toEqual({ message: 'hello' });

      await redisService.del('test:key:1');
      const deletedVal = await redisService.get('test:key:1');
      expect(deletedVal).toBeNull();
    });

    it('should return null when cache key has expired', async () => {
      // Set with -1 second TTL to simulate immediate expiry
      await redisService.set('test:expired', 'stale_data', -1);
      const val = await redisService.get('test:expired');
      expect(val).toBeNull();
    });
  });

  describe('Security & Identifier Hashing', () => {
    it('should securely hash sensitive identifiers with SHA-256 and never leak raw emails or PII', () => {
      const email = 'Teacher.Sharma@ApexAcademy.EDU  ';
      const hashed = hashIdentifier(email);

      // Must be lowercase-normalized, trimmed, 32-char hex string
      expect(hashed).toHaveLength(32);
      expect(hashed).not.toContain('Teacher');
      expect(hashed).not.toContain('Apex');
      expect(hashed).not.toContain('@');

      // Idempotent and case-insensitive
      const hashed2 = hashIdentifier('teacher.sharma@apexacademy.edu');
      expect(hashed).toBe(hashed2);
    });

    it('should generate versioned, tenant-isolated key names according to architecture specification', () => {
      const brandingKey = RedisKeys.tenantBranding('inst_apex_123');
      expect(brandingKey).toBe('padhai:v1:tenant:inst_apex_123:branding');

      const featuresKey = RedisKeys.tenantFeatures('inst_apex_123');
      expect(featuresKey).toBe('padhai:v1:tenant:inst_apex_123:features');

      const dashboardKey = RedisKeys.teacherDashboard('inst_apex_123', 'usr_sharma');
      expect(dashboardKey).toBe('padhai:v1:tenant:inst_apex_123:teacher:usr_sharma:dashboard');

      const rateLimitKey = RedisKeys.rateLimit('login', 'teacher@padhai.com');
      expect(rateLimitKey).toMatch(/^padhai:v1:rate:login:[a-f0-9]{32}$/);
    });
  });

  describe('Strict Tenant Cache Isolation', () => {
    it('should strictly isolate cached branding and features between different institutes', async () => {
      const tenantA = 'inst_apex_academy';
      const tenantB = 'inst_fiitjee_delhi';

      await redisService.setTenantBranding(tenantA, { name: 'Apex Academy', primaryColor: '#1677FF' });
      await redisService.setTenantBranding(tenantB, { name: 'FIITJEE Delhi', primaryColor: '#DC2626' });

      const brandingA = await redisService.getTenantBranding<any>(tenantA);
      const brandingB = await redisService.getTenantBranding<any>(tenantB);

      expect(brandingA?.name).toBe('Apex Academy');
      expect(brandingA?.primaryColor).toBe('#1677FF');
      expect(brandingB?.name).toBe('FIITJEE Delhi');
      expect(brandingB?.primaryColor).toBe('#DC2626');

      // Invalidate only Tenant A
      await redisService.invalidateTenant(tenantA);

      expect(await redisService.getTenantBranding(tenantA)).toBeNull();
      // Tenant B must remain completely intact
      expect(await redisService.getTenantBranding(tenantB)).not.toBeNull();
      expect((await redisService.getTenantBranding<any>(tenantB))?.name).toBe('FIITJEE Delhi');
    });

    it('should strictly isolate dashboard metrics between teachers in the same institute', async () => {
      const tenant = 'inst_apex_academy';
      const teacher1 = 'usr_sharma';
      const teacher2 = 'usr_verma';

      await redisService.setTeacherDashboard(tenant, teacher1, { activeBatches: 3 });
      await redisService.setTeacherDashboard(tenant, teacher2, { activeBatches: 5 });

      expect(await redisService.getTeacherDashboard<any>(tenant, teacher1)).toEqual({ activeBatches: 3 });
      expect(await redisService.getTeacherDashboard<any>(tenant, teacher2)).toEqual({ activeBatches: 5 });

      // Invalidate teacher 1
      await redisService.invalidateTeacherDashboard(tenant, teacher1);

      expect(await redisService.getTeacherDashboard(tenant, teacher1)).toBeNull();
      expect(await redisService.getTeacherDashboard<any>(tenant, teacher2)).toEqual({ activeBatches: 5 });
    });
  });

  describe('Rate Limiting & Abuse Prevention', () => {
    it('should allow requests under the limit and compute correct remaining tokens', async () => {
      const id = 'user_login_test_1';
      const action = 'login';
      const maxRequests = 3;
      const windowSec = 60;

      const res1 = await redisService.checkRateLimit(id, action, maxRequests, windowSec);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);
      expect(res1.limit).toBe(3);
      expect(res1.headers['X-RateLimit-Limit']).toBe('3');
      expect(res1.headers['X-RateLimit-Remaining']).toBe('2');

      const res2 = await redisService.checkRateLimit(id, action, maxRequests, windowSec);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = await redisService.checkRateLimit(id, action, maxRequests, windowSec);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it('should block requests exceeding threshold and include Retry-After header', async () => {
      const id = 'abusive_client_ip';
      const action = 'login';
      const maxRequests = 2;
      const windowSec = 30;

      await redisService.checkRateLimit(id, action, maxRequests, windowSec);
      await redisService.checkRateLimit(id, action, maxRequests, windowSec);

      // Third request must be blocked
      const blockedRes = await redisService.checkRateLimit(id, action, maxRequests, windowSec);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.resetInSeconds).toBeGreaterThan(0);
      expect(blockedRes.headers['Retry-After']).toBeDefined();
    });

    it('should throw RateLimitExceededException (HTTP 429) when enforceRateLimit is called on exceeded limit', async () => {
      const id = 'brute_force_attacker';
      const action = 'invitationValidate';
      const maxRequests = 2;
      const windowSec = 60;

      await redisService.enforceRateLimit(id, action, maxRequests, windowSec);
      await redisService.enforceRateLimit(id, action, maxRequests, windowSec);

      await expect(
        redisService.enforceRateLimit(id, action, maxRequests, windowSec),
      ).rejects.toThrow(RateLimitExceededException);

      try {
        await redisService.enforceRateLimit(id, action, maxRequests, windowSec);
      } catch (err: any) {
        expect(err.getStatus()).toBe(429);
        expect(err.rateLimitResult.allowed).toBe(false);
        expect(err.rateLimitResult.headers['Retry-After']).toBeDefined();
      }
    });
  });
});

