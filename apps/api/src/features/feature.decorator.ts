import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { FeatureKey, UserRole } from '@padhai-pilot/shared';

export const REQUIRE_FEATURE_KEY = 'REQUIRE_FEATURE_KEY';
export const REQUIRED_FEATURE_ROLE_KEY = 'REQUIRED_FEATURE_ROLE_KEY';

/**
 * Decorator to protect a route handler with Feature Flag & Role Entitlement
 * Usage:
 *   @RequireFeature('bulk_marks_entry', 'TEACHER')
 *   @Post('save-draft')
 *   async saveDraft(...)
 */
export function RequireFeature(
  featureKey: FeatureKey,
  minRole?: UserRole,
) {
  if (minRole) {
    return applyDecorators(
      SetMetadata(REQUIRE_FEATURE_KEY, featureKey),
      SetMetadata(REQUIRED_FEATURE_ROLE_KEY, minRole),
    );
  }
  return applyDecorators(SetMetadata(REQUIRE_FEATURE_KEY, featureKey));
}

