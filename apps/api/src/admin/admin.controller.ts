import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import {
  CreateInstituteTenantDto,
  UpdateInstituteStatusDto,
  UpdateInstitutePlanDto,
  UpdateTenantConfigDto,
  CreatePlatformAnnouncementDto,
} from './dto/admin.dto.js';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  // --------------------------------------------------------------------------
  // 1. TENANT & INSTITUTE MANAGEMENT
  // --------------------------------------------------------------------------

  @Get('institutes')
  async getInstitutes() {
    const data = await this.adminService.getInstitutes();
    return {
      success: true,
      data,
    };
  }

  @Get('institutes/:id')
  async getInstituteById(@Param('id') id: string) {
    const data = await this.adminService.getInstituteById(id);
    return {
      success: true,
      data,
    };
  }

  @Post('institutes')
  @HttpCode(HttpStatus.CREATED)
  async createInstitute(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInstituteTenantDto,
  ) {
    const data = await this.adminService.createInstitute(dto, {
      id: user.id,
      email: user.email,
    });
    return {
      success: true,
      data,
      message: `Tuition Institute "${data.name}" successfully onboarded.`,
    };
  }

  @Put('institutes/:id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateInstituteStatusDto,
  ) {
    const data = await this.adminService.updateStatus(id, dto, {
      id: user.id,
      email: user.email,
    });
    return {
      success: true,
      data,
      message: `Institute status set to ${dto.status}.`,
    };
  }

  @Put('institutes/:id/plan')
  async updatePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateInstitutePlanDto,
  ) {
    const data = await this.adminService.updatePlan(id, dto, {
      id: user.id,
      email: user.email,
    });
    return {
      success: true,
      data,
      message: `Institute subscription plan updated to ${dto.plan}.`,
    };
  }

  @Put('institutes/:id/config')
  async updateConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTenantConfigDto,
  ) {
    const data = await this.adminService.updateConfig(id, dto, {
      id: user.id,
      email: user.email,
    });
    return {
      success: true,
      data,
      message: `Tenant white-label configuration updated.`,
    };
  }

  // --------------------------------------------------------------------------
  // 2. PLATFORM METRICS & OPERATIONAL MONITORING
  // --------------------------------------------------------------------------

  @Get('stats')
  async getStats() {
    const data = await this.adminService.getPlatformStats();
    return {
      success: true,
      data,
    };
  }

  // --------------------------------------------------------------------------
  // 3. SECURITY & AUDIT TRAIL
  // --------------------------------------------------------------------------

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit?: string) {
    const data = await this.adminService.getAuditLogs(
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      success: true,
      data,
    };
  }

  // --------------------------------------------------------------------------
  // 4. PLATFORM BROADCAST ANNOUNCEMENTS
  // --------------------------------------------------------------------------

  @Get('announcements')
  async getAnnouncements() {
    const data = await this.adminService.getAnnouncements();
    return {
      success: true,
      data,
    };
  }

  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlatformAnnouncementDto,
  ) {
    const data = await this.adminService.createAnnouncement(dto, {
      id: user.id,
      email: user.email,
    });
    return {
      success: true,
      data,
      message: `Platform broadcast announcement created.`,
    };
  }
}
