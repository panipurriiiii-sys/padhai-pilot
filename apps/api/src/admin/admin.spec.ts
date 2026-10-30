import { describe, it, expect, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { ROLES_KEY } from '../common/decorators/roles.decorator.js';

describe('Admin Module & Authorization Tests', () => {
  let adminService: AdminService;
  let adminController: AdminController;
  let mockPrisma: any;
  let mockRedis: any;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    mockPrisma = { isConnected: false };
    mockRedis = {
      enforceRateLimit: async () => true,
    };
    adminService = new AdminService(mockPrisma, mockRedis);
    adminController = new AdminController(adminService);
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  describe('1. Role Authorization Boundaries (RolesGuard)', () => {
    const mockContext = (role?: string): ExecutionContext => {
      return {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: role ? { id: 'usr_test', role, email: 'test@example.com' } : null,
          }),
        }),
      } as unknown as ExecutionContext;
    };

    it('should throw ForbiddenException if user is a TUITION_OWNER trying to access SUPER_ADMIN endpoint', () => {
      // Mock reflector returning SUPER_ADMIN required
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);

      const context = mockContext('TUITION_OWNER');
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is a FACULTY/TEACHER', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);

      const context = mockContext('TEACHER');
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is a STUDENT', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);

      const context = mockContext('STUDENT');
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access if user has role SUPER_ADMIN', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);

      const context = mockContext('SUPER_ADMIN');
      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it('should allow unrestricted access when no roles are required', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const context = mockContext('STUDENT');
      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });

  describe('2. AdminService - Tenant & Platform Management', () => {
    const mockSuperAdmin = {
      id: 'usr_admin_malhotra',
      email: 'super@padhaipilot.com',
      role: 'SUPER_ADMIN' as const,
      fullName: 'Dr. Vikram Malhotra',
      instituteId: 'platform_hq',
      instituteName: 'PadhaiPilot HQ',
    };

    it('should list all registered institutes', async () => {
      const institutes = await adminService.getInstitutes();
      expect(Array.isArray(institutes)).toBe(true);
      expect(institutes.length).toBeGreaterThanOrEqual(4);
      expect(institutes.some((i) => i.id === 'inst_apex_academy')).toBe(true);
    });

    it('should onboard a new tuition institute with custom subdomain', async () => {
      const created = await adminService.createInstitute(
        {
          name: 'Nalanda Classes Pune',
          subdomain: 'nalanda',
          plan: 'PRO',
          ownerName: 'Vikas Deshmukh',
          ownerEmail: 'vikas@nalandapune.com',
          customDomain: 'learn.nalandapune.com',
        },
        mockSuperAdmin,
      );

      expect(created.id).toContain('inst_nalanda');
      expect(created.name).toBe('Nalanda Classes Pune');
      expect(created.plan).toBe('PRO');
      expect(created.isWhiteLabel).toBe(true);
    });

    it('should reject institute creation with duplicate subdomain', async () => {
      await expect(
        adminService.createInstitute(
          {
            name: 'Another Apex',
            subdomain: 'apex', // already exists
            plan: 'STARTER',
            ownerName: 'Fake Owner',
            ownerEmail: 'fake@example.com',
          },
          mockSuperAdmin,
        ),
      ).rejects.toThrow();
    });

    it('should update institute status with audit log', async () => {
      const updated = await adminService.updateStatus(
        'inst_prerna_tuition',
        { status: 'SUSPENDED', reason: 'Unpaid subscription balance' },
        mockSuperAdmin,
      );

      expect(updated.status).toBe('SUSPENDED');

      const logs = await adminService.getAuditLogs();
      const statusLog = logs.find((l) => l.action === 'INSTITUTE_STATUS_CHANGED');
      expect(statusLog).toBeDefined();
      expect(statusLog?.details).toContain('Unpaid subscription balance');
    });

    it('should upgrade institute plan and update white-label entitlement', async () => {
      const updated = await adminService.updatePlan(
        'inst_prerna_tuition',
        { plan: 'ENTERPRISE', reason: 'Upgraded to flagship tier' },
        mockSuperAdmin,
      );

      expect(updated.plan).toBe('ENTERPRISE');
      expect(updated.isWhiteLabel).toBe(true);
      expect(updated.isDedicatedDb).toBe(true);
    });

    it('should configure custom white-label settings and quotas', async () => {
      const updated = await adminService.updateConfig(
        'inst_apex_academy',
        {
          customDomain: 'portal.apexkota.edu.in',
          themePrimaryColor: '#0052CC',
          maxStudentsLimit: 1500,
        },
        mockSuperAdmin,
      );

      expect(updated.customDomain).toBe('portal.apexkota.edu.in');
      expect(updated.themePrimaryColor).toBe('#0052CC');
      expect(updated.maxStudentsLimit).toBe(1500);
    });

    it('should calculate accurate platform metrics', async () => {
      const stats = await adminService.getPlatformStats();
      expect(stats.tenants.total).toBeGreaterThanOrEqual(4);
      expect(stats.infrastructure.apiStatus).toBe('HEALTHY');
      expect(stats.infrastructure.redisStatus).toBe('ACTIVE');
      expect(stats.users.totalStudents).toBeGreaterThan(0);
    });

    it('should post and retrieve platform broadcast announcements', async () => {
      const ann = await adminService.createAnnouncement(
        {
          title: 'Version 2.4.0 Deployed',
          message: 'All institutes now have access to offline mode & PDF export enhancements.',
          severity: 'info',
          targetAudience: 'ALL',
        },
        mockSuperAdmin,
      );

      expect(ann.id).toBeDefined();
      const list = await adminService.getAnnouncements();
      expect(list.some((a) => a.title === 'Version 2.4.0 Deployed')).toBe(true);
    });
  });

  describe('3. AdminController Response Contracts', () => {
    const mockSuperAdmin = {
      id: 'usr_admin_malhotra',
      email: 'super@padhaipilot.com',
      role: 'SUPER_ADMIN' as const,
      fullName: 'Dr. Vikram Malhotra',
      instituteId: 'platform_hq',
      instituteName: 'PadhaiPilot HQ',
    };

    it('should return wrapped data for getInstitutes', async () => {
      const res = await adminController.getInstitutes();
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('should return platform operational stats', async () => {
      const res = await adminController.getStats();
      expect(res.success).toBe(true);
      expect(res.data.tenants).toBeDefined();
      expect(res.data.infrastructure).toBeDefined();
    });
  });
});

