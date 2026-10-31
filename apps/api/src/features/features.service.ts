import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import {
  FEATURE_REGISTRY,
  getRegisteredFeature,
  getAllRegisteredFeatures,
} from './features.registry.js';
import type {
  FeatureKey,
  SubscriptionPlan,
  FeatureEvaluationResult,
  InstituteEffectiveFeatures,
  FeatureAuditLogItem,
  UserRole,
  FeatureQuotaStatus,
} from '@padhai-pilot/shared';

// Role hierarchy weights for RBAC comparison
const ROLE_WEIGHTS: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  TUITION_OWNER: 75,
  INSTITUTE_ADMIN: 50,
  INSTITUTE_MANAGER: 40,
  FACULTY: 20,
  TEACHER: 20,
  STUDENT: 10,
};

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  // In-memory L1 cache to avoid redundant round-trips
  private readonly memoryCache = new Map<string, { value: FeatureEvaluationResult; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60 * 1000; // 60 seconds

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  /**
   * Deterministic Precedence Evaluation Engine
   * Order:
   * 1. Platform-wide state (Emergency Kill Switch > Global Disable)
   * 2. Subscription Plan Entitlements & Plan Limits
   * 3. Institute-level Configuration Overrides
   * 4. User Role & Resource RBAC Permissions
   * 5. Usage Quotas & Limits
   */
  async evaluateFeature(params: {
    featureKey: FeatureKey;
    instituteId?: string;
    userRole?: UserRole;
    requiredRole?: UserRole;
    metricKey?: string;
  }): Promise<FeatureEvaluationResult> {
    const { featureKey, instituteId, userRole, requiredRole, metricKey } = params;
    const evaluatedAt = new Date().toISOString();

    // Verify feature is canonically registered
    const def = getRegisteredFeature(featureKey);

    // Fast memory cache check
    const cacheKey = `feat_eval:${featureKey}:${instituteId || 'global'}:${userRole || 'anon'}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // ----------------------------------------------------------------------
    // STEP 1: Platform Feature Flags (Source of Truth: PlatformFeatureFlag)
    // ----------------------------------------------------------------------
    const platformFlag = await this.prisma.platformFeatureFlag.findUnique({
      where: { key: featureKey },
    });

    // Check Emergency Kill Switch first
    if (platformFlag?.isEmergencyDisabled) {
      const res: FeatureEvaluationResult = {
        featureKey,
        isAvailable: false,
        status: 'EMERGENCY_KILLED',
        reason:
          platformFlag.disabledReason ||
          'Feature has been temporarily emergency-disabled across the platform.',
        evaluatedAt,
      };
      this.setCache(cacheKey, res);
      return res;
    }

    // Check Global Disable
    if (platformFlag && !platformFlag.isGloballyEnabled) {
      const res: FeatureEvaluationResult = {
        featureKey,
        isAvailable: false,
        status: 'GLOBALLY_DISABLED',
        reason:
          platformFlag.disabledReason ||
          'Feature is globally disabled by Platform Super Admin.',
        evaluatedAt,
      };
      this.setCache(cacheKey, res);
      return res;
    }

    // If no institute context provided, return platform state
    if (!instituteId) {
      const res: FeatureEvaluationResult = {
        featureKey,
        isAvailable: true,
        status: 'ACTIVE',
        evaluatedAt,
      };
      this.setCache(cacheKey, res);
      return res;
    }

    // Fetch Institute & Plan
    const institute = await this.prisma.institute.findUnique({
      where: { id: instituteId },
      select: { id: true, name: true, plan: true, isActive: true },
    });

    if (!institute) {
      const res: FeatureEvaluationResult = {
        featureKey,
        isAvailable: false,
        status: 'INSTITUTE_DISABLED',
        reason: `Target institute "${instituteId}" does not exist.`,
        evaluatedAt,
      };
      return res;
    }

    if (!institute.isActive) {
      const res: FeatureEvaluationResult = {
        featureKey,
        isAvailable: false,
        status: 'INSTITUTE_DISABLED',
        reason: 'Institute is currently suspended or inactive.',
        evaluatedAt,
      };
      this.setCache(cacheKey, res);
      return res;
    }

    const currentPlan = (institute.plan as SubscriptionPlan) || 'STARTER';

    // ----------------------------------------------------------------------
    // STEP 2: Subscription Plan Entitlements (PlanEntitlement)
    // ----------------------------------------------------------------------
    let planEntitlement = await this.prisma.planEntitlement.findUnique({
      where: {
        plan_featureKey: {
          plan: currentPlan,
          featureKey,
        },
      },
    });

    // If no custom plan entitlement row exists in DB, fall back to Canonical Registry default
    let isIncludedInPlan = true;
    let planQuotaLimit: number | null = null;

    if (planEntitlement) {
      isIncludedInPlan = planEntitlement.isIncluded;
      planQuotaLimit = planEntitlement.quotaLimit;
    } else if (def.defaultQuotaByPlan) {
      const defaultQuota = def.defaultQuotaByPlan[currentPlan];
      if (defaultQuota === 0) {
        isIncludedInPlan = false;
      } else {
        planQuotaLimit = defaultQuota ?? null;
      }
    }

    if (!isIncludedInPlan) {
      const res: FeatureEvaluationResult = {
        featureKey,
        isAvailable: false,
        status: 'PLAN_RESTRICTED',
        reason: `Feature is not included in the "${currentPlan}" plan. Please upgrade your subscription.`,
        requiredPlan: this.getRecommendedPlanForFeature(featureKey),
        evaluatedAt,
      };
      this.setCache(cacheKey, res);
      return res;
    }

    // ----------------------------------------------------------------------
    // STEP 3: Institute Configuration Overrides (InstituteFeatureConfig)
    // ----------------------------------------------------------------------
    const instituteConfig = await this.prisma.instituteFeatureConfig.findUnique({
      where: {
        instituteId_featureKey: {
          instituteId,
          featureKey,
        },
      },
    });

    if (instituteConfig && !instituteConfig.isEnabled) {
      const res: FeatureEvaluationResult = {
        featureKey,
        isAvailable: false,
        status: 'INSTITUTE_DISABLED',
        reason: 'Feature has been disabled in this institute\'s settings.',
        evaluatedAt,
      };
      this.setCache(cacheKey, res);
      return res;
    }

    // Effective quota (Institute customQuota overrides planQuotaLimit if granted)
    const effectiveQuotaLimit = instituteConfig?.customQuota !== undefined && instituteConfig.customQuota !== null
      ? instituteConfig.customQuota
      : planQuotaLimit;

    // ----------------------------------------------------------------------
    // STEP 4: User Role & Resource RBAC Permissions
    // ----------------------------------------------------------------------
    if (requiredRole && userRole) {
      const userWeight = ROLE_WEIGHTS[userRole] ?? 0;
      const reqWeight = ROLE_WEIGHTS[requiredRole] ?? 0;

      if (userWeight < reqWeight) {
        const res: FeatureEvaluationResult = {
          featureKey,
          isAvailable: false,
          status: 'PERMISSION_DENIED',
          reason: `User role "${userRole}" lacks sufficient privilege (requires "${requiredRole}").`,
          evaluatedAt,
        };
        return res;
      }
    }

    // ----------------------------------------------------------------------
    // STEP 5: Usage Quotas & Limits
    // ----------------------------------------------------------------------
    let quotaStatus: FeatureQuotaStatus | undefined = undefined;

    if (effectiveQuotaLimit !== null) {
      const currentPeriod = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
      const mKey = metricKey || `${featureKey}_usage`;

      const usageRecord = await this.prisma.instituteUsageCounter.findUnique({
        where: {
          instituteId_metricKey_period: {
            instituteId,
            metricKey: mKey,
            period: currentPeriod,
          },
        },
      });

      const usedCount = usageRecord?.currentValue || 0;
      const remaining = Math.max(0, effectiveQuotaLimit - usedCount);

      quotaStatus = {
        limit: effectiveQuotaLimit,
        used: usedCount,
        remaining,
        period: currentPeriod,
      };

      if (usedCount >= effectiveQuotaLimit) {
        const res: FeatureEvaluationResult = {
          featureKey,
          isAvailable: false,
          status: 'QUOTA_EXCEEDED',
          reason: `Usage quota limit of ${effectiveQuotaLimit} reached for current period.`,
          quota: quotaStatus,
          evaluatedAt,
        };
        this.setCache(cacheKey, res);
        return res;
      }
    }

    // All precedence levels passed -> Feature is Active
    const finalResult: FeatureEvaluationResult = {
      featureKey,
      isAvailable: true,
      status: 'ACTIVE',
      quota: quotaStatus,
      evaluatedAt,
    };

    this.setCache(cacheKey, finalResult);
    return finalResult;
  }

  /**
   * Evaluate entire feature matrix for a specific institute
   */
  async evaluateAllFeaturesForInstitute(
    instituteId: string,
    userRole?: UserRole,
  ): Promise<InstituteEffectiveFeatures> {
    let institute = await this.prisma.institute.findUnique({
      where: { id: instituteId },
      select: { id: true, name: true, plan: true, isActive: true },
    });

    if (!institute) {
      if (this.prisma.isConnected) {
        try {
          institute = await this.prisma.institute.create({
            data: {
              id: instituteId,
              name: 'Apex IIT-JEE & Medical Academy',
              slug: instituteId.replace('inst_', '').replace(/_/g, '-'),
              plan: 'ENTERPRISE',
              isActive: true,
            },
            select: { id: true, name: true, plan: true, isActive: true },
          });
        } catch {
          // Fallback to in-memory defaults
        }
      }
      if (!institute) {
        institute = {
          id: instituteId,
          name: 'Apex IIT-JEE & Medical Academy',
          plan: 'ENTERPRISE',
          isActive: true,
        };
      }
    }

    const allDefs = getAllRegisteredFeatures();
    const evaluatedFeatures: Record<string, FeatureEvaluationResult> = {};

    await Promise.all(
      allDefs.map(async (def) => {
        const res = await this.evaluateFeature({
          featureKey: def.key,
          instituteId,
          userRole,
        });
        evaluatedFeatures[def.key] = res;
      }),
    );

    return {
      instituteId: institute.id,
      instituteName: institute.name,
      plan: (institute.plan as SubscriptionPlan) || 'STARTER',
      isInstituteActive: institute.isActive,
      evaluatedFeatures: evaluatedFeatures as Record<FeatureKey, FeatureEvaluationResult>,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Platform Super Admin: Toggle Global Feature Availability
   */
  async updateGlobalFlag(params: {
    featureKey: FeatureKey;
    isGloballyEnabled: boolean;
    reason?: string;
    actorId: string;
    actorEmail: string;
  }): Promise<void> {
    const { featureKey, isGloballyEnabled, reason, actorId, actorEmail } = params;
    getRegisteredFeature(featureKey); // validates key

    const prev = await this.prisma.platformFeatureFlag.findUnique({
      where: { key: featureKey },
    });

    await this.prisma.platformFeatureFlag.upsert({
      where: { key: featureKey },
      create: {
        key: featureKey,
        isGloballyEnabled,
        disabledReason: reason || null,
        updatedBy: actorEmail,
      },
      update: {
        isGloballyEnabled,
        disabledReason: reason || null,
        updatedBy: actorEmail,
      },
    });

    await this.recordAudit({
      featureKey,
      actorId,
      actorEmail,
      scope: 'PLATFORM',
      action: 'GLOBAL_TOGGLE',
      previousValue: { isGloballyEnabled: prev?.isGloballyEnabled ?? true },
      newValue: { isGloballyEnabled },
      reason,
    });

    this.invalidateAllCache();
  }

  /**
   * Emergency Kill Switch for critical platform emergencies
   */
  async emergencyKill(params: {
    featureKey: FeatureKey;
    reason: string;
    confirmCode: string;
    actorId: string;
    actorEmail: string;
  }): Promise<void> {
    const { featureKey, reason, confirmCode, actorId, actorEmail } = params;
    const def = getRegisteredFeature(featureKey);

    if (!def.isKillSwitchable) {
      throw new BadRequestException(`Feature "${featureKey}" is not eligible for emergency kill switch.`);
    }

    if (confirmCode !== 'CONFIRM_KILL') {
      throw new BadRequestException('Security confirmation code "CONFIRM_KILL" is required for emergency kill switch.');
    }

    const prev = await this.prisma.platformFeatureFlag.findUnique({
      where: { key: featureKey },
    });

    await this.prisma.platformFeatureFlag.upsert({
      where: { key: featureKey },
      create: {
        key: featureKey,
        isGloballyEnabled: false,
        isEmergencyDisabled: true,
        disabledReason: `EMERGENCY KILL: ${reason}`,
        updatedBy: actorEmail,
      },
      update: {
        isGloballyEnabled: false,
        isEmergencyDisabled: true,
        disabledReason: `EMERGENCY KILL: ${reason}`,
        updatedBy: actorEmail,
      },
    });

    await this.recordAudit({
      featureKey,
      actorId,
      actorEmail,
      scope: 'PLATFORM',
      action: 'EMERGENCY_KILL',
      previousValue: { isEmergencyDisabled: prev?.isEmergencyDisabled ?? false },
      newValue: { isEmergencyDisabled: true, reason },
      reason,
    });

    this.logger.warn(`EMERGENCY KILL SWITCH ACTIVATED on ${featureKey} by ${actorEmail}: ${reason}`);
    this.invalidateAllCache();
  }

  /**
   * Emergency Restore
   */
  async emergencyRestore(params: {
    featureKey: FeatureKey;
    reason: string;
    actorId: string;
    actorEmail: string;
  }): Promise<void> {
    const { featureKey, reason, actorId, actorEmail } = params;
    getRegisteredFeature(featureKey);

    await this.prisma.platformFeatureFlag.upsert({
      where: { key: featureKey },
      create: {
        key: featureKey,
        isGloballyEnabled: true,
        isEmergencyDisabled: false,
        disabledReason: null,
        updatedBy: actorEmail,
      },
      update: {
        isGloballyEnabled: true,
        isEmergencyDisabled: false,
        disabledReason: null,
        updatedBy: actorEmail,
      },
    });

    await this.recordAudit({
      featureKey,
      actorId,
      actorEmail,
      scope: 'PLATFORM',
      action: 'EMERGENCY_RESTORE',
      previousValue: { isEmergencyDisabled: true },
      newValue: { isEmergencyDisabled: false },
      reason,
    });

    this.invalidateAllCache();
  }

  /**
   * Super Admin: Update Plan Entitlement & Quotas
   */
  async updatePlanEntitlement(params: {
    plan: SubscriptionPlan;
    featureKey: FeatureKey;
    isIncluded: boolean;
    quotaLimit?: number | null;
    reason?: string;
    actorId: string;
    actorEmail: string;
  }): Promise<void> {
    const { plan, featureKey, isIncluded, quotaLimit, reason, actorId, actorEmail } = params;
    getRegisteredFeature(featureKey);

    const prev = await this.prisma.planEntitlement.findUnique({
      where: { plan_featureKey: { plan, featureKey } },
    });

    await this.prisma.planEntitlement.upsert({
      where: { plan_featureKey: { plan, featureKey } },
      create: {
        plan,
        featureKey,
        isIncluded,
        quotaLimit: quotaLimit !== undefined ? quotaLimit : null,
      },
      update: {
        isIncluded,
        quotaLimit: quotaLimit !== undefined ? quotaLimit : null,
      },
    });

    await this.recordAudit({
      featureKey,
      actorId,
      actorEmail,
      scope: 'PLAN',
      action: 'PLAN_UPDATE',
      previousValue: prev ? { isIncluded: prev.isIncluded, quotaLimit: prev.quotaLimit } : null,
      newValue: { plan, isIncluded, quotaLimit },
      reason,
    });

    this.invalidateAllCache();
  }

  /**
   * Institute Admin or Super Admin: Configure Institute Feature Override
   */
  async updateInstituteConfig(params: {
    instituteId: string;
    featureKey: FeatureKey;
    isEnabled: boolean;
    customQuota?: number | null;
    reason?: string;
    actorId: string;
    actorEmail: string;
  }): Promise<void> {
    const { instituteId, featureKey, isEnabled, customQuota, reason, actorId, actorEmail } = params;
    const def = getRegisteredFeature(featureKey);

    const institute = await this.prisma.institute.findUnique({
      where: { id: instituteId },
    });
    if (!institute) throw new NotFoundException(`Institute ${instituteId} not found`);

    // Verify customer plan entitlement before permitting enablement
    const plan = (institute.plan as SubscriptionPlan) || 'STARTER';
    const planEnt = await this.prisma.planEntitlement.findUnique({
      where: { plan_featureKey: { plan, featureKey } },
    });

    let planAllows = true;
    if (planEnt) {
      planAllows = planEnt.isIncluded;
    } else if (def.defaultQuotaByPlan && def.defaultQuotaByPlan[plan] === 0) {
      planAllows = false;
    }

    // An institute cannot enable a feature excluded by their plan unless an explicit customQuota commercial exception is granted
    if (isEnabled && !planAllows && (customQuota === undefined || customQuota === null || customQuota === 0)) {
      throw new ForbiddenException(
        `Feature "${featureKey}" is excluded by plan "${plan}". An institute cannot enable it without an authorized commercial plan upgrade or custom quota exception.`,
      );
    }

    const prev = await this.prisma.instituteFeatureConfig.findUnique({
      where: { instituteId_featureKey: { instituteId, featureKey } },
    });

    await this.prisma.instituteFeatureConfig.upsert({
      where: { instituteId_featureKey: { instituteId, featureKey } },
      create: {
        instituteId,
        featureKey,
        isEnabled,
        customQuota: customQuota !== undefined ? customQuota : null,
      },
      update: {
        isEnabled,
        customQuota: customQuota !== undefined ? customQuota : null,
      },
    });

    await this.recordAudit({
      featureKey,
      actorId,
      actorEmail,
      scope: 'INSTITUTE',
      targetInstituteId: instituteId,
      action: 'INSTITUTE_OVERRIDE',
      previousValue: prev ? { isEnabled: prev.isEnabled, customQuota: prev.customQuota } : null,
      newValue: { isEnabled, customQuota },
      reason,
    });

    this.invalidateAllCache();
  }

  /**
   * Quota Increment Helper for protected operations
   */
  async checkAndIncrementQuota(
    instituteId: string,
    metricKey: string,
    featureKey: FeatureKey,
    incrementBy = 1,
  ): Promise<void> {
    const evalRes = await this.evaluateFeature({
      featureKey,
      instituteId,
      metricKey,
    });

    if (!evalRes.isAvailable) {
      throw new ForbiddenException(evalRes.reason || 'Operation not permitted by feature entitlement.');
    }

    const currentPeriod = new Date().toISOString().slice(0, 7);

    await this.prisma.instituteUsageCounter.upsert({
      where: {
        instituteId_metricKey_period: {
          instituteId,
          metricKey,
          period: currentPeriod,
        },
      },
      create: {
        instituteId,
        metricKey,
        period: currentPeriod,
        currentValue: incrementBy,
      },
      update: {
        currentValue: { increment: incrementBy },
      },
    });

    // Invalidate local cache for this quota
    this.memoryCache.clear();
  }

  /**
   * Audit Logger
   */
  private async recordAudit(data: {
    featureKey: FeatureKey;
    actorId: string;
    actorEmail: string;
    scope: 'PLATFORM' | 'PLAN' | 'INSTITUTE';
    targetInstituteId?: string;
    action: 'GLOBAL_TOGGLE' | 'EMERGENCY_KILL' | 'EMERGENCY_RESTORE' | 'PLAN_UPDATE' | 'INSTITUTE_OVERRIDE' | 'QUOTA_UPDATE';
    previousValue?: any;
    newValue?: any;
    reason?: string;
  }): Promise<void> {
    try {
      await this.prisma.featureAuditLog.create({
        data: {
          featureKey: data.featureKey,
          actorId: data.actorId,
          actorEmail: data.actorEmail,
          scope: data.scope,
          targetInstituteId: data.targetInstituteId || null,
          action: data.action,
          previousValue: data.previousValue || null,
          newValue: data.newValue || null,
          reason: data.reason || null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record feature audit log: ${err}`);
    }
  }

  /**
   * Fetch recent audit history
   */
  async getAuditLogs(params?: {
    featureKey?: string;
    instituteId?: string;
    limit?: number;
  }): Promise<FeatureAuditLogItem[]> {
    const logs = await this.prisma.featureAuditLog.findMany({
      where: {
        featureKey: params?.featureKey,
        targetInstituteId: params?.instituteId,
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
    });

    return logs.map((l) => ({
      id: l.id,
      featureKey: l.featureKey as FeatureKey,
      actorId: l.actorId,
      actorEmail: l.actorEmail,
      scope: l.scope as 'PLATFORM' | 'PLAN' | 'INSTITUTE',
      targetInstituteId: l.targetInstituteId,
      action: l.action as any,
      previousValue: l.previousValue,
      newValue: l.newValue,
      reason: l.reason,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  private setCache(key: string, value: FeatureEvaluationResult) {
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  private invalidateAllCache() {
    this.memoryCache.clear();
  }

  private getRecommendedPlanForFeature(key: FeatureKey): SubscriptionPlan {
    const def = FEATURE_REGISTRY[key];
    if (!def || !def.defaultQuotaByPlan) return 'PRO';
    if (def.defaultQuotaByPlan.GROWTH && def.defaultQuotaByPlan.GROWTH > 0) return 'GROWTH';
    if (def.defaultQuotaByPlan.PRO && def.defaultQuotaByPlan.PRO > 0) return 'PRO';
    return 'ENTERPRISE';
  }
}

