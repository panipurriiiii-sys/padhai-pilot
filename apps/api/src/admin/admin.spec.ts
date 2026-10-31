import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ConflictException, ExecutionContext, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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


  describe('2. AdminService - database backed (no in-memory data)', () => {
    const actor = { id: 'sa1', email: 'root@platform.in' };
    const instRow = (over: Record<string, unknown> = {}) => ({
      id: 'i1', name: 'Apex', slug: 'apex', subdomain: 'apex', plan: 'GROWTH', status: 'ACTIVE', isActive: true, isWhiteLabel: false,
      isDedicatedDb: false, customDomain: null, contactEmail: 'o@apex.in', contactPhone: null, signatoryName: 'Owner', primaryColor: null,
      logoUrl: null, maxStudents: 500, maxTeachers: 25, createdAt: new Date(), updatedAt: new Date(), ...over,
    });

    function liveDb() {
      const audits: any[] = [];
      const db: any = {
        isConnected: true,
        institute: {
          findMany: vi.fn(async () => [instRow()]),
          findUnique: vi.fn(async ({ where }: any) => (where.id === 'i1' ? instRow() : null)),
          findFirst: vi.fn(async ({ where }: any) => (where.OR.some((c: any) => c.slug === 'taken') ? { id: 'x' } : null)),
          create: vi.fn(async ({ data }: any) => instRow({ id: 'i2', ...data })),
          update: vi.fn(async () => ({})),
          groupBy: vi.fn(async ({ by }: any) => (by[0] === 'plan' ? [{ plan: 'GROWTH', _count: { _all: 2 } }] : [{ isActive: true, _count: { _all: 2 } }, { isActive: false, _count: { _all: 1 } }])),
        },
        instituteMembership: {
          groupBy: vi.fn(async ({ by }: any) =>
            by.length === 2
              ? [{ instituteId: 'i1', role: 'STUDENT', _count: { _all: 12 } }, { instituteId: 'i1', role: 'FACULTY', _count: { _all: 3 } }]
              : [{ role: 'STUDENT', _count: { _all: 12 } }, { role: 'TEACHER', _count: { _all: 1 } }, { role: 'FACULTY', _count: { _all: 3 } }]),
          findMany: vi.fn(async () => [{ instituteId: 'i1', user: { fullName: 'Real Owner', email: 'real@apex.in' } }]),
        },
        auditLog: {
          create: vi.fn(async ({ data }: any) => { audits.push(data); return data; }),
          findMany: vi.fn(async () => audits.map((a, i) => ({ id: `a${i}`, createdAt: new Date(), userId: a.userId, actorEmail: a.actorEmail, action: a.action, resourceId: a.resourceId, resourceType: a.resourceType, details: a.details, status: a.status }))),
        },
        platformAnnouncement: {
          create: vi.fn(async ({ data }: any) => ({ id: 'pa1', createdAt: new Date(), ...data })),
          findMany: vi.fn(async () => []),
        },
      };
      return { db, audits };
    }

    it('fails closed with 503 when the database is down (no seeded fallback)', async () => {
      await expect(adminService.getInstitutes()).rejects.toThrow(ServiceUnavailableException);
      await expect(adminService.getAuditLogs()).rejects.toThrow(ServiceUnavailableException);
      await expect(adminService.getAnnouncements()).rejects.toThrow(ServiceUnavailableException);
    });

    it('lists institutes with real counts and owner, no fabricated records', async () => {
      const { db } = liveDb();
      const svc = new AdminService(db, mockRedis);
      const list = await svc.getInstitutes();
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ id: 'i1', studentCount: 12, teacherCount: 3, ownerName: 'Real Owner', ownerEmail: 'real@apex.in' });
    });

    it('rejects a duplicate subdomain and writes an awaited audit row on create', async () => {
      const { db, audits } = liveDb();
      const svc = new AdminService(db, mockRedis);
      await expect(svc.createInstitute({ name: 'X', subdomain: 'taken', plan: 'STARTER', ownerName: 'O', ownerEmail: 'o@x.in' } as any, actor)).rejects.toThrow(ConflictException);
      const created = await svc.createInstitute({ name: 'New', subdomain: 'fresh', plan: 'PRO', ownerName: 'O', ownerEmail: 'o@x.in' } as any, actor);
      expect(created.isWhiteLabel).toBe(true);
      expect(audits.map((a) => a.action)).toContain('TENANT_ONBOARDED');
    });

    it('suspends via both status and isActive, and audits the change', async () => {
      const { db, audits } = liveDb();
      const svc = new AdminService(db, mockRedis);
      await svc.updateStatus('i1', { status: 'SUSPENDED', reason: 'unpaid' } as any, actor);
      expect(db.institute.update.mock.calls[0][0].data).toEqual({ status: 'SUSPENDED', isActive: false });
      expect(audits[0]).toMatchObject({ action: 'INSTITUTE_STATUS_CHANGED', status: 'WARNING' });
      await expect(svc.updateStatus('nope', { status: 'ACTIVE', reason: 'x' } as any, actor)).rejects.toThrow(NotFoundException);
    });

    it('computes platform stats from aggregates', async () => {
      const { db } = liveDb();
      const stats = await new AdminService(db, mockRedis).getPlatformStats();
      expect(stats.tenants).toMatchObject({ total: 3, active: 2, suspended: 1, growthPlan: 2 });
      expect(stats.users).toEqual({ totalStudents: 12, totalTeachers: 4 });
    });

    it('persists platform announcements', async () => {
      const { db } = liveDb();
      const ann = await new AdminService(db, mockRedis).createAnnouncement({ title: 'Maintenance', message: 'Sunday', severity: 'info' } as any, actor);
      expect(ann.id).toBe('pa1');
      expect(db.platformAnnouncement.create).toHaveBeenCalled();
    });
  });
});
