import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from './config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

describe('ConfigService with Tenant-Scoped Redis Caching', () => {
  let configService: ConfigService;
  let redisService: RedisService;
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = new PrismaService();
    redisService = new RedisService();
    redisService.onModuleInit();
    configService = new ConfigService(prismaService, redisService);
  });

  it('should return platform defaults when instituteId is omitted', async () => {
    const config = await configService.getConfigForInstitute();
    expect(config.platformName).toBe('PadhaiPilot');
    expect(config.features.attendance).toBe(true);
    expect(config.features.fees).toBe(false);
  });

  it('should return cached features from Redis when present', async () => {
    const instituteId = 'inst_custom_tier';
    // Pre-populate tenant cache
    await redisService.setTenantFeatures(instituteId, {
      attendance: true,
      assignments: true,
      fees: true, // Custom tier has fees enabled
    });

    const config = await configService.getConfigForInstitute(instituteId);
    expect(config.instituteId).toBe(instituteId);
    expect(config.features.fees).toBe(true);
  });

  it('should invalidate tenant configuration in Redis on update', async () => {
    const instituteId = 'inst_to_invalidate';
    await redisService.setTenantFeatures(instituteId, { fees: true });

    let cached = await redisService.getTenantFeatures(instituteId);
    expect(cached).toBeDefined();

    await configService.invalidateInstituteConfig(instituteId);

    cached = await redisService.getTenantFeatures(instituteId);
    expect(cached).toBeNull();
  });
});

