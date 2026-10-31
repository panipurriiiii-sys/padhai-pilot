import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from './config/config.module.js';
import { TeacherModule } from './teacher/teacher.module.js';
import { AssessmentModule } from './assessment/assessment.module.js';
import { FeaturesModule } from './features/features.module.js';
import { TuitionModule } from './tuition/tuition.module.js';
import { StudentModule } from './student/student.module.js';
import { AdminModule } from './admin/admin.module.js';
import { ThemeModule } from './theme/theme.module.js';
import { HealthController } from './health/health.controller.js';
import { InvitationsController } from './invitations/invitations.controller.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RateLimitFilter } from './common/filters/rate-limit.filter.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    ConfigModule,
    TeacherModule,
    AssessmentModule,
    FeaturesModule,
    TuitionModule,
    StudentModule,
    AdminModule,
    ThemeModule,
  ],
  controllers: [
    AppController,
    HealthController,
    InvitationsController,
  ],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: RateLimitFilter,
    },
  ],
})
export class AppModule {}
