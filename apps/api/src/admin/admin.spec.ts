import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

// Shared sample institute rows returned by the Prisma mock
function makeInstituteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inst_apex_academy',
    name: 'Apex Academy Kota',
    slug: 'apex',
    subdomain: 'apex',
    plan: 'GROWTH',
    status: 'ACTIVE',
    isActive: true,
    customDomain: 'learn.apexkota.edu.in',
    isWhiteLabel: true,
    isDedicatedDb: false,
    maxStudents: 500,
    maxTeachers: 25,
    primaryColor: '#1677FF',
    logoUrl: null,
    contactPhone: '+91 98220 11223',
    createdAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date('2026-10-25T14:20:00Z'),
    memberships: [
      { user: { fullName: 'Rajeshwar Singhania', email: 'owner@padhaipilot.com', phone: '+91 98220 11223' } },
    ],
    _count: { enrollments: 142, facultyProfiles: 8 },
    ...overrides,
  };
}

const SEED_INSTITUTES = [
  makeInstituteRow({ id: 'inst_apex_academy', name: 'Apex Academy Kota', slug: 'apex', subdomain: 'apex', plan: 'GROWTH' }),
  makeInstituteRow({ id: 'inst_zenith_classes', name: 'Zenith Science Institute', slug: 'zenith', subdomain: 'zenith', plan: 'PRO' }),
  makeInstituteRow({ id: 'inst_prerna_tuition', name: 'Prerna Commerce Classes', slug: 'prerna', subdomain: 'prerna', plan: 'STARTER', _count: { enrollments: 45, facultyProfiles: 3 } }),
  makeInstituteRow({ id: 'inst_quantum_allen', name: 'Quantum Physics Circle', slug: 'quantum', subdomain: 'quantum', plan: 'ENTERPRISE', _count: { enrollments: 890, facultyProfiles: 32 } }),
];

describe('Admin Module & Authorization Tests', () => {
  let adminService: AdminService;
  let adminController: AdminController;
  let mockPrisma: any;
  let mockRedis: any;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  // Stateful mock stores — reset per test
  let auditLogStore: any[];
  let announcementStore: any[];

  beforeEach(() => {
    auditLogStore = [];
    announcementStore = [];

    mockPrisma = {
      isConnected: true,
      institute: {
        findMany: vi.fn().mockResolvedValue(SEED_INSTITUTES),
        findFirst: vi.fn().mockResolvedValue(null), // no collision by default
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          const found = SEED_INSTITUTES.find((i) => i.id === where.id);
          return Promise.resolve(found || null);
        }),
        create: vi.fn().mockImplementation(({ data }: any) => {
          const created = {
            id: `inst_${(data.slug || 'new').replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            memberships: [],
            _count: { enrollments: 0, facultyProfiles: 0 },
          };
          return Promise.resolve(created);
        }),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          const existing = SEED_INSTITUTES.find((i) => i.id === where.id);
          return Promise.resolve({ ...(existing || {}), ...data, updatedAt: new Date() });
        }),
      },
      auditLog: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve([...auditLogStore])),
        create: vi.fn().mockImplementation(({ data }: any) => {
          const log = { id: `audit_${Date.now()}`, ...data, createdAt: new Date() };
          auditLogStore.unshift(log);
          return Promise.resolve(log);
        }),
      },
      platformAnnouncement: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve([...announcementStore])),
        create: vi.fn().mockImplementation(({ data }: any) => {
          const ann = { id: `ann_${Date.now()}`, ...data, createdAt: new Date() };
          announcementStore.unshift(ann);
          return Promise.resolve(ann);
        }),
      },
    };

    mockRedis = { enforceRateLimit: async () => true };
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
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should allow unrestricted access when no roles are required', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const context = mockContext('STUDENT');
      expect(rolesGuard.canActivate(context)).toBe(true);
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

      expect(created.id).toBeTruthy();
      expect(created.name).toBe('Nalanda Classes Pune');
      expect(created.plan).toBe('PRO');
      expect(created.isWhiteLabel).toBe(true);
    });

    it('should reject institute creation with duplicate subdomain', async () => {
      mockPrisma.institute.findFirst.mockResolvedValue({ id: 'inst_apex_academy' });
      await expect(
        adminService.createInstitute(
          {
            name: 'Another Apex',
            subdomain: 'apex',
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
