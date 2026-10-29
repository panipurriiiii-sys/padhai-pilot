import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_FEATURE_KEY, REQUIRED_FEATURE_ROLE_KEY } from './feature.decorator.js';
import { FeaturesService } from './features.service.js';
import type { FeatureKey, UserRole } from '@padhai-pilot/shared';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featuresService: FeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.getAllAndOverride<FeatureKey>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route doesn't declare a feature requirement, allow passage
    if (!featureKey) {
      return true;
    }

    const requiredRole = this.reflector.getAllAndOverride<UserRole>(REQUIRED_FEATURE_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Extract instituteId from user session or validated tenant header
    const instituteId =
      user?.instituteId ||
      req.headers['x-institute-id'] ||
      req.query?.instituteId ||
      req.body?.instituteId;

    const evaluation = await this.featuresService.evaluateFeature({
      featureKey,
      instituteId: typeof instituteId === 'string' ? instituteId : undefined,
      userRole: user?.role,
      requiredRole,
    });

    if (!evaluation.isAvailable) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden - Feature Restricted',
        message: evaluation.reason || `Feature "${featureKey}" is currently unavailable.`,
        featureKey,
        status: evaluation.status,
        requiredPlan: evaluation.requiredPlan,
      });
    }

    // Attach evaluation to request for downstream handlers
    req.featureEvaluation = evaluation;
    return true;
  }
}

