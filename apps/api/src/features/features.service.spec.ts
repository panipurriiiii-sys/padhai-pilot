import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeaturesService } from './features.service.js';
import { FEATURE_REGISTRY } from './features.registry.js';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('FeaturesService - Precedence & Entitlement Engine', () => {
  let service: FeaturesService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      platformFeatureFlag: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      planEntitlement: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      instituteFeatureConfig: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      institute: {
        findUnique: vi.fn(),
      },
      featureAuditLog: {
        create: vi.fn().mockResolvedValue({ id: 'log_1' }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      instituteUsageCounter: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    };

    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    service = new FeaturesService(mockPrisma, mockRedis);
  });

  // --------------------------------------------------------------------------
  // RULE 1: Global Platform Disable & Emergency Kill Switch Precedence
  // --------------------------------------------------------------------------
  describe('Rule 1: Global Platform State & Emergency Kill Switch', () => {
    it('should immediately fail-closed if feature is under Emergency Kill Switch, regardless of plan or institute', async () => {
      mockPrisma.platformFeatureFlag.findUnique.mockResolvedValue({
        key: 'bulk_marks_entry',
        isGloballyEnabled: false,
        isEmergencyDisabled: true,
        disabledReason: 'Security vulnerability in marks calculation engine',
      });

      const res = await service.evaluateFeature({
        featureKey: 'bulk_marks_entry',
        instituteId: 'inst_vip_enterprise',
        userRole: 'SUPER_ADMIN',
      });

      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe('EMERGENCY_KILLED');
      expect(res.reason).toContain('Security vulnerability');
    });

    it('should fail-closed if feature is globally disabled by Super Admin', async () => {
      mockPrisma.platformFeatureFlag.findUnique.mockResolvedValue({
        key: 'parent_portal',
        isGloballyEnabled: false,
        isEmergencyDisabled: false,
        disabledReason: 'Under maintenance',
      });

      const res = await service.evaluateFeature({
        featureKey: 'parent_portal',
        instituteId: 'inst_1',
      });

      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe('GLOBALLY_DISABLED');
      expect(res.reason).toContain('Under maintenance');
    });
  });

  // --------------------------------------------------------------------------
  // RULE 2: Subscription Plan Entitlements & Restrictions
  // --------------------------------------------------------------------------
  describe('Rule 2: Subscription Plan Entitlements', () => {
    it('should block a feature not permitted in the institute plan (e.g. bulk_import in STARTER)', async () => {
      mockPrisma.platformFeatureFlag.findUnique.mockResolvedValue({
        key: 'bulk_import',
        isGloballyEnabled: true,
        isEmergencyDisabled: false,
      });

      mockPrisma.institute.findUnique.mockResolvedValue({
        id: 'inst_starter',
        name: 'Basic Coaching',
        plan: 'STARTER',
        isActive: true,
      });

      mockPrisma.planEntitlement.findUnique.mockResolvedValue({
        plan: 'STARTER',
        featureKey: 'bulk_import',
        isIncluded: false,
        quotaLimit: 0,
      });

      const res = await service.evaluateFeature({
        featureKey: 'bulk_import',
        instituteId: 'inst_starter',
      });

      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe('PLAN_RESTRICTED');
      expect(res.reason).toContain('not included in the "STARTER" plan');
    });

    it('should permit feature when institute plan includes it (e.g. PRO plan)', async () => {
      mockPrisma.platformFeatureFlag.findUnique.mockResolvedValue({
        key: 'bulk_marks_entry',
        isGloballyEnabled: true,
        isEmergencyDisabled: false,
      });

      mockPrisma.institute.findUnique.mockResolvedValue({
        id: 'inst_pro',
        name: 'Apex Academy',
        plan: 'PRO',
        isActive: true,
      });

      mockPrisma.planEntitlement.findUnique.mockResolvedValue({
        plan: 'PRO',
        featureKey: 'bulk_marks_entry',
        isIncluded: true,
        quotaLimit: null, // unlimited
      });

      mockPrisma.instituteFeatureConfig.findUnique.mockResolvedValue(null);

      const res = await service.evaluateFeature({
        featureKey: 'bulk_marks_entry',
        instituteId: 'inst_pro',
        userRole: 'TEACHER',
      });

      expect(res.isAvailable).toBe(true);
      expect(res.status).toBe('ACTIVE');
    });
  });

  // --------------------------------------------------------------------------
  // RULE 3: Institute Level Configuration Overrides
  // --------------------------------------------------------------------------
  describe('Rule 3: Institute Configuration Overrides', () => {
    it('should allow an institute to disable an otherwise eligible feature', async () => {
      mockPrisma.platformFeatureFlag.findUnique.mockResolvedValue(null);
      mockPrisma.institute.findUnique.mockResolvedValue({
        id: 'inst_1',
        name: 'Kota Campus',
        plan: 'PRO',
        isActive: true,
      });
      mockPrisma.planEntitlement.findUnique.mockResolvedValue({
        plan: 'PRO',
        featureKey: 'timetable',
        isIncluded: true,
        quotaLimit: 50,
      });

      // Institute explicitly toggles timetable off
      mockPrisma.instituteFeatureConfig.findUnique.mockResolvedValue({
        instituteId: 'inst_1',
        featureKey: 'timetable',
        isEnabled: false,
      });

      const res = await service.evaluateFeature({
        featureKey: 'timetable',
        instituteId: 'inst_1',
      });

      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe('INSTITUTE_DISABLED');
      expect(res.reason).toContain('disabled in this institute\'s settings');
    });

    it('should prevent an institute from enabling a feature excluded by its plan without custom quota exception', async () => {
      mockPrisma.institute.findUnique.mockResolvedValue({
        id: 'inst_starter_1',
        name: 'Starter Classes',
        plan: 'STARTER',
      });

      mockPrisma.planEntitlement.findUnique.mockResolvedValue({
        plan: 'STARTER',
        featureKey: 'white_label_branding',
        isIncluded: false,
      });

      await expect(
        service.updateInstituteConfig({
          instituteId: 'inst_starter_1',
          featureKey: 'white_label_branding',
          isEnabled: true, // Attempt unauthorized enable
          actorId: 'admin_1',
          actorEmail: 'admin@starter.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // --------------------------------------------------------------------------
  // RULE 4: Role RBAC Enforcement
  // --------------------------------------------------------------------------
  describe('Rule 4: Role RBAC Enforcement', () => {
    it('should deny access if user role is insufficient for protected feature', async () => {
      mockPrisma.platformFeatureFlag.findUnique.mockResolvedValue(null);
      mockPrisma.institute.findUnique.mockResolvedValue({
        id: 'inst_1',
        plan: 'PRO',
        isActive: true,
      });
      mockPrisma.planEntitlement.findUnique.mockResolvedValue({
        plan: 'PRO',
        featureKey: 'bulk_marks_entry',
        isIncluded: true,
      });
      mockPrisma.instituteFeatureConfig.findUnique.mockResolvedValue(null);

      const res = await service.evaluateFeature({
        featureKey: 'bulk_marks_entry',
        instituteId: 'inst_1',
        userRole: 'STUDENT',
        requiredRole: 'TEACHER', // requires TEACHER or higher
      });

      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe('PERMISSION_DENIED');
      expect(res.reason).toContain('lacks sufficient privilege');
    });
  });

  // --------------------------------------------------------------------------
  // RULE 5: Usage Quota & Limit Enforcement
  // --------------------------------------------------------------------------
  describe('Rule 5: Usage Quotas & Limits', () => {
    it('should deny operation when institute monthly usage quota is reached', async () => {
      mockPrisma.platformFeatureFlag.findUnique.mockResolvedValue(null);
      mockPrisma.institute.findUnique.mockResolvedValue({
        id: 'inst_growth',
        plan: 'GROWTH',
        isActive: true,
      });
      mockPrisma.planEntitlement.findUnique.mockResolvedValue({
        plan: 'GROWTH',
        featureKey: 'bulk_pdf_generation',
        isIncluded: true,
        quotaLimit: 5, // 5 runs per month limit
      });
      mockPrisma.instituteFeatureConfig.findUnique.mockResolvedValue(null);

      // Current usage counter has reached 5
      mockPrisma.instituteUsageCounter.findUnique.mockResolvedValue({
        currentValue: 5,
      });

      const res = await service.evaluateFeature({
        featureKey: 'bulk_pdf_generation',
        instituteId: 'inst_growth',
      });

      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe('QUOTA_EXCEEDED');
      expect(res.quota?.remaining).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // EMERGENCY CONTROLS & AUDIT LOGGING
  // --------------------------------------------------------------------------
  describe('Emergency Controls & Audits', () => {
    it('should reject emergency kill switch if confirmation code is invalid', async () => {
      await expect(
        service.emergencyKill({
          featureKey: 'bulk_marks_entry',
          reason: 'Emergency testing',
          confirmCode: 'WRONG_CODE',
          actorId: 'super_1',
          actorEmail: 'admin@padhaipilot.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should execute emergency kill switch with CONFIRM_KILL and record audit log', async () => {
      await service.emergencyKill({
        featureKey: 'bulk_marks_entry',
        reason: 'Payment data anomaly detected',
        confirmCode: 'CONFIRM_KILL',
        actorId: 'super_1',
        actorEmail: 'super@padhaipilot.com',
      });

      expect(mockPrisma.platformFeatureFlag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'bulk_marks_entry' },
          create: expect.objectContaining({ isEmergencyDisabled: true }),
        }),
      );

      expect(mockPrisma.featureAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            featureKey: 'bulk_marks_entry',
            action: 'EMERGENCY_KILL',
            actorEmail: 'super@padhaipilot.com',
          }),
        }),
      );
    });
  });
});

