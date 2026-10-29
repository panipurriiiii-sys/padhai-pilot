import { Module } from '@nestjs/common';
import { FeaturesService } from './features.service.js';
import { FeaturesController } from './features.controller.js';
import { FeatureFlagGuard } from './feature.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../redis/redis.module.js';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [FeaturesController],
  providers: [FeaturesService, FeatureFlagGuard],
  exports: [FeaturesService, FeatureFlagGuard],
})
export class FeaturesModule {}

