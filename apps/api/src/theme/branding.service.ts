import { BadRequestException, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { DEFAULT_THEME_CONFIG, validateInstituteBranding, type InstituteBranding } from '@padhai-pilot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { FeaturesService } from '../features/features.service.js';
import { ThemeService } from './theme.service.js';
import { isDemoMode } from '../common/security/runtime.js';
import type { AuthenticatedUser } from '../common/types.js';

export interface EffectiveBranding {
  instituteId: string | null;
  /** Whether the institute's plan currently permits custom branding */
  entitled: boolean;
  /** The branding to apply on top of the platform theme (null = platform look) */
  branding: { logoUrl: string | null; accentColor: string | null } | null;
  /** Reason branding is not applied, for the Settings UI */
  reason?: string;
  platformRevisionId: string;
}

/** `#1677FF` is the legacy column default and means "no custom accent". */
const LEGACY_DEFAULT_ACCENT = DEFAULT_THEME_CONFIG.brand.primary.toUpperCase();

/**
 * Layer 3 of the theme hierarchy: validated institute branding (logo + one accent colour).
 *
 * Security rules:
 *  - the institute is ALWAYS derived from the authenticated user (JWT + active membership), never from request input;
 *  - writes require a management role and an active `white_label_branding` entitlement (plan / feature flag engine);
 *  - colours and URLs are validated server-side (hex only, WCAG contrast, https logo);
 *  - nothing here can touch typography, spacing, component behaviour or other institutes.
 */
@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);
  private readonly mem = new Map<string, { logoUrl: string | null; accentColor: string | null }>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FeaturesService) private readonly features: FeaturesService,
    @Inject(ThemeService) private readonly theme: ThemeService,
  ) {}

  /** Institute of the caller, verified against an ACTIVE membership when a database is available. */
  async instituteOf(user: AuthenticatedUser): Promise<string | null> {
    if (!user || user.role === 'SUPER_ADMIN' || !user.instituteId) return null;
    if (this.prisma.isConnected) {
      try {
        const membership = await this.prisma.instituteMembership.findFirst({
          where: { userId: user.id, instituteId: user.instituteId, status: 'ACTIVE' },
          select: { id: true },
        });
        if (!membership) throw new ForbiddenException('You are not an active member of this institute.');
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        this.logger.warn(`Membership check unavailable: ${(err as Error).message}`);
        return null; // fail safe: no institute context => platform look only
      }
    }
    return user.instituteId;
  }

  async isEntitled(instituteId: string, role?: AuthenticatedUser['role']): Promise<boolean> {
    if (!this.prisma.isConnected) return isDemoMode();
    try {
      const evaluation = await this.features.evaluateFeature({ featureKey: 'white_label_branding', instituteId, userRole: role });
      return evaluation.isAvailable;
    } catch (err) {
      this.logger.warn(`Entitlement check failed, branding disabled: ${(err as Error).message}`);
      return false;
    }
  }

  private async readStored(instituteId: string): Promise<{ logoUrl: string | null; accentColor: string | null }> {
    if (this.prisma.isConnected) {
      try {
        const row = await this.prisma.institute.findUnique({ where: { id: instituteId }, select: { logoUrl: true, primaryColor: true } });
        const accent = row?.primaryColor && row.primaryColor.toUpperCase() !== LEGACY_DEFAULT_ACCENT ? row.primaryColor : null;
        return { logoUrl: row?.logoUrl ?? null, accentColor: accent };
      } catch (err) {
        this.logger.warn(`Branding read failed: ${(err as Error).message}`);
      }
    }
    return this.mem.get(instituteId) ?? { logoUrl: null, accentColor: null };
  }

  async getMine(user: AuthenticatedUser): Promise<EffectiveBranding> {
    const platform = await this.theme.getPublished();
    const instituteId = await this.instituteOf(user);
    if (!instituteId) {
      return { instituteId: null, entitled: false, branding: null, platformRevisionId: platform.revisionId };
    }
    const entitled = await this.isEntitled(instituteId, user.role);
    if (!entitled) {
      return {
        instituteId,
        entitled: false,
        branding: null,
        reason: 'Custom branding is not included in this institute’s plan.',
        platformRevisionId: platform.revisionId,
      };
    }
    const stored = await this.readStored(instituteId);
    // re-validate on every read: stale or hand-edited rows can never reach the apps
    const checked = validateInstituteBranding({ logoUrl: stored.logoUrl, accentColor: stored.accentColor });
    return {
      instituteId,
      entitled: true,
      branding: checked.ok && checked.branding ? checked.branding : { logoUrl: null, accentColor: null },
      reason: checked.ok ? undefined : 'Stored branding failed validation and is not applied.',
      platformRevisionId: platform.revisionId,
    };
  }

  validate(body: unknown) {
    return validateInstituteBranding(body);
  }

  async updateMine(user: AuthenticatedUser, body: InstituteBranding): Promise<EffectiveBranding> {
    const instituteId = await this.instituteOf(user);
    if (!instituteId) throw new ForbiddenException('Branding can only be changed from an institute account.');
    if (!(await this.isEntitled(instituteId, user.role))) {
      throw new ForbiddenException('Custom branding is not included in your institute’s plan.');
    }
    const checked = validateInstituteBranding(body);
    if (!checked.ok || !checked.branding) {
      throw new BadRequestException({ message: 'Invalid branding.', errors: checked.errors, contrast: checked.contrast });
    }
    const { logoUrl, accentColor } = checked.branding;

    if (this.prisma.isConnected) {
      await this.prisma.institute.update({
        where: { id: instituteId },
        data: { logoUrl, primaryColor: accentColor ?? LEGACY_DEFAULT_ACCENT },
      });
      try {
        await this.prisma.auditLog.create({
          data: {
            instituteId,
            userId: user.id,
            action: 'BRANDING_UPDATE',
            resourceType: 'Institute',
            resourceId: instituteId,
            metadata: { accentColor, hasLogo: !!logoUrl },
          },
        });
      } catch (err) {
        this.logger.warn(`Branding audit write failed: ${(err as Error).message}`);
      }
    } else {
      this.mem.set(instituteId, { logoUrl, accentColor });
    }
    return this.getMine(user);
  }
}
