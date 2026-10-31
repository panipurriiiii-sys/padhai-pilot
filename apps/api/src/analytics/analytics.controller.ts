import {
  Controller,
  Get,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { STAFF_ROLES, STUDENT_ROLES } from '../common/security/roles.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';

@Controller('analytics')
@UseGuards(AuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    @Inject(AnalyticsService)
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('student')
  @Roles(...STUDENT_ROLES, ...STAFF_ROLES)
  getStudentAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getStudentAnalytics(user);
  }

  @Get('teacher')
  @Roles(...STAFF_ROLES)
  getTeacherAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getTeacherAnalytics(user);
  }

  @Get('admin')
  @Roles('SUPER_ADMIN')
  getAdminAnalytics() {
    return this.analyticsService.getAdminAnalytics();
  }
}
