import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RedisTTLs } from '../redis/redis.config.js';

export interface GlobalPlatformConfig {
  platformName: string;
  version: string;
  maintenanceMode: boolean;
  features: {
    attendance: boolean;
    assignments: boolean;
    testsAndResults: boolean;
    fees: boolean;
    announcements: boolean;
    timetable: boolean;
  };
  limits: {
    maxStudentsPerBatch: number;
    maxUploadSizeBytes: number;
  };
}

@Injectable()
export class ConfigService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  private platformDefaults: GlobalPlatformConfig = {
    platformName: 'PadhaiPilot',
    version: '1.0.0',
    maintenanceMode: false,
    features: {
      attendance: true,
      assignments: true,
      testsAndResults: true,
      fees: false, // Intentionally disabled in this phase as instructed
      announcements: true,
      timetable: true,
    },
    limits: {
      maxStudentsPerBatch: 120,
      maxUploadSizeBytes: 15 * 1024 * 1024, // 15MB
    },
  };

  async getConfigForInstitute(
    instituteId?: string,
  ): Promise<GlobalPlatformConfig & { instituteId?: string }> {
    if (!instituteId) {
      return this.platformDefaults;
    }

    // 1. Try Redis cache (tenant-isolated with padhai:v1 prefix)
    const cachedFeatures = await this.redis.getTenantFeatures<Record<string, boolean>>(instituteId);
    if (cachedFeatures) {
      return {
        ...this.platformDefaults,
        features: {
          ...this.platformDefaults.features,
          ...cachedFeatures,
        },
        instituteId,
      };
    }

    // 2. Query DB if connected
    if (this.prisma.isConnected) {
      try {
        const institute = await this.prisma.institute.findUnique({
          where: { id: instituteId },
        });

        if (institute && institute.features) {
          const instituteFeatures = institute.features as Record<string, boolean>;
          // Cache in Redis for 15 minutes
          await this.redis.setTenantFeatures(
            instituteId,
            instituteFeatures,
            RedisTTLs.FEATURES_SECONDS,
          );

          return {
            ...this.platformDefaults,
            features: {
              ...this.platformDefaults.features,
              ...instituteFeatures,
            },
            instituteId,
          };
        }
      } catch {
        // Fallback safely to defaults on DB error
      }
    }

    return {
      ...this.platformDefaults,
      instituteId,
    };
  }

  async invalidateInstituteConfig(instituteId: string): Promise<void> {
    await this.redis.invalidateTenant(instituteId);
  }

  isFeatureEnabled(feature: keyof GlobalPlatformConfig['features']): boolean {
    return this.platformDefaults.features[feature] ?? false;
  }
}
