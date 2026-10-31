import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FeaturesModule } from '../features/features.module.js';
import { ThemeService } from './theme.service.js';
import { BrandingService } from './branding.service.js';
import { BrandingController, ThemeAdminController, ThemeController } from './theme.controller.js';

@Module({
  imports: [PrismaModule, FeaturesModule],
  controllers: [ThemeController, ThemeAdminController, BrandingController],
  providers: [ThemeService, BrandingService],
  exports: [ThemeService, BrandingService],
})
export class ThemeModule implements NestModule {
  constructor(private readonly theme: ThemeService) {}

  /**
   * Version-based invalidation signal: every API response carries the platform theme revision this instance last saw.
   * Apps that notice a different value refresh `GET /theme` once — no polling. Reads only the in-memory cache.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((_req: Request, res: Response, next: NextFunction) => {
        const revision = this.theme.peekRevisionId();
        if (revision) res.setHeader('X-Theme-Revision', revision);
        next();
      })
      .forRoutes('*');
  }
}
