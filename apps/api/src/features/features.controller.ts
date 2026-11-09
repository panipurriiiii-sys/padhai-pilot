import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  Inject,
  Header,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../common/security/runtime.js';
import { FeaturesService } from './features.service.js';
import { getAllRegisteredFeatures } from './features.registry.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type {
  FeatureKey,
  SubscriptionPlan,
  UpdateGlobalFeatureFlagDto,
  EmergencyKillSwitchDto,
  UpdatePlanEntitlementDto,
  UpdateInstituteFeatureConfigDto,
} from '@padhai-pilot/shared';

@Controller('features')
export class FeaturesController {
  constructor(@Inject(FeaturesService) private readonly featuresService: FeaturesService) {}

  /**
   * Public / Authenticated: Get canonical registry of all supported platform features
   */
  @Get('registry')
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  getRegistry() {
    return {
      success: true,
      data: getAllRegisteredFeatures(),
    };
  }

  /**
   * Evaluate a single feature for the requested institute
   */
  @Get('evaluate/:featureKey')
  async evaluateFeature(
    @Param('featureKey') featureKey: FeatureKey,
    @Query('instituteId') instituteId?: string,
    @Req() req?: any,
  ) {
    const user = req?.user;
    const targetInstitute = instituteId || user?.instituteId;

    const result = await this.featuresService.evaluateFeature({
      featureKey,
      instituteId: targetInstitute,
      userRole: user?.role,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Super Admin / Institute Admin / Teacher: Get complete effective feature matrix for an institute
   */
  @Get('institute/:instituteId')
  async getInstituteEffectiveFeatures(
    @Param('instituteId') instituteId: string,
    @Req() req?: any,
  ) {
    let resolvedId = instituteId;
    let userRole = req?.user?.role;

    if (req?.headers?.authorization) {
      try {
        const raw = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(raw, getJwtSecret(), { algorithms: ['HS256'] }) as any;
        if (decoded?.instituteId) {
          if (!resolvedId || resolvedId === 'current' || resolvedId === 'me') {
            resolvedId = decoded.instituteId;
          }
          userRole = decoded.role;
        }
      } catch {
        // Fallback gracefully to public/anonymous evaluation
      }
    } else if (req?.user?.instituteId) {
      if (!resolvedId || resolvedId === 'current' || resolvedId === 'me') {
        resolvedId = req.user.instituteId;
      }
    }

    if (!resolvedId || resolvedId === 'current' || resolvedId === 'me') {
      resolvedId = 'inst_default';
    }

    const result = await this.featuresService.evaluateAllFeaturesForInstitute(
      resolvedId,
      userRole,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Super Admin: stored global flags + plan entitlement rows
   */
  @Get('state')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async getControlState() {
    return { success: true, data: await this.featuresService.getControlState() };
  }

  /**
   * Super Admin: View feature flag audit trail
   */
  @Get('audit-logs')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async getAuditLogs(
    @Query('featureKey') featureKey?: string,
    @Query('instituteId') instituteId?: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.featuresService.getAuditLogs({
      featureKey,
      instituteId,
      limit: limit ? Math.min(200, Math.max(1, parseInt(limit, 10) || 50)) : 50,
    });

    return {
      success: true,
      data: logs,
    };
  }

  /**
   * Platform Super Admin: Toggle global feature state
   */
  @Post('global')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updateGlobalFlag(
    @Body() dto: UpdateGlobalFeatureFlagDto,
    @Req() req?: any,
  ) {
    const actorId = req.user.id;
    const actorEmail = req.user.email;

    await this.featuresService.updateGlobalFlag({
      featureKey: dto.featureKey,
      isGloballyEnabled: dto.isGloballyEnabled,
      reason: dto.reason,
      actorId,
      actorEmail,
    });

    return {
      success: true,
      message: `Global state for "${dto.featureKey}" updated successfully.`,
    };
  }

  /**
   * Platform Super Admin: Emergency Kill Switch
   */
  @Post('emergency-kill')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async emergencyKill(
    @Body() dto: EmergencyKillSwitchDto,
    @Req() req?: any,
  ) {
    const actorId = req?.user?.id || 'admin_sys_01';
    const actorEmail = req?.user?.email || 'superadmin@padhaipilot.com';

    await this.featuresService.emergencyKill({
      featureKey: dto.featureKey,
      reason: dto.reason,
      confirmCode: dto.confirmCode,
      actorId,
      actorEmail,
    });

    return {
      success: true,
      message: `Emergency Kill Switch successfully executed for "${dto.featureKey}".`,
    };
  }

  /**
   * Platform Super Admin: Emergency Restore
   */
  @Post('emergency-restore')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async emergencyRestore(
    @Body() dto: { featureKey: FeatureKey; reason: string },
    @Req() req?: any,
  ) {
    const actorId = req?.user?.id || 'admin_sys_01';
    const actorEmail = req?.user?.email || 'superadmin@padhaipilot.com';

    await this.featuresService.emergencyRestore({
      featureKey: dto.featureKey,
      reason: dto.reason,
      actorId,
      actorEmail,
    });

    return {
      success: true,
      message: `Feature "${dto.featureKey}" has been restored to normal operation.`,
    };
  }

  /**
   * Platform Super Admin: Configure Plan Entitlements & Quotas
   */
  @Post('plan-entitlements')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updatePlanEntitlements(
    @Body() dto: UpdatePlanEntitlementDto,
    @Req() req?: any,
  ) {
    const actorId = req?.user?.id || 'admin_sys_01';
    const actorEmail = req?.user?.email || 'superadmin@padhaipilot.com';

    await this.featuresService.updatePlanEntitlement({
      plan: dto.plan,
      featureKey: dto.featureKey,
      isIncluded: dto.isIncluded,
      quotaLimit: dto.quotaLimit,
      reason: dto.reason,
      actorId,
      actorEmail,
    });

    return {
      success: true,
      message: `Plan "${dto.plan}" entitlement for "${dto.featureKey}" updated.`,
    };
  }

  /**
   * Institute Admin / Super Admin: Configure Institute Feature Override
   */
  @Post('institute-config')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updateInstituteConfig(
    @Body() dto: UpdateInstituteFeatureConfigDto,
    @Req() req: any,
  ) {
    const actorId = req?.user?.id || 'admin_sys_01';
    const actorEmail = req?.user?.email || 'superadmin@padhaipilot.com';

    await this.featuresService.updateInstituteConfig({
      instituteId: dto.instituteId,
      featureKey: dto.featureKey,
      isEnabled: dto.isEnabled,
      customQuota: dto.customQuota,
      reason: dto.reason,
      actorId,
      actorEmail,
    });

    return {
      success: true,
      message: `Institute "${dto.instituteId}" configuration for "${dto.featureKey}" updated.`,
    };
  }
}

