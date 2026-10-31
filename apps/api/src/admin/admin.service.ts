import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertDb, clampLimit, isUniqueViolation } from '../common/db/db.js';
import { RedisService } from '../redis/redis.service.js';
import type {
  CreateInstituteTenantDto,
  UpdateInstituteStatusDto,
  UpdateInstitutePlanDto,
  UpdateTenantConfigDto,
  CreatePlatformAnnouncementDto,
} from './dto/admin.dto.js';
import type { SubscriptionPlan } from '@padhai-pilot/shared';

export interface InstituteTenantRecord {
  id: string;
  name: string;
  subdomain: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  customDomain?: string;
  isWhiteLabel: boolean;
  isDedicatedDb: boolean;
  studentCount: number;
  teacherCount: number;
  createdAt: string;
  updatedAt: string;
  themePrimaryColor?: string;
  logoUrl?: string;
  maxStudentsLimit?: number;
  maxTeachersLimit?: number;
}

export interface PlatformAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  targetAudience: 'ALL' | 'TEACHERS' | 'STUDENTS';
  createdAt: string;
  expiresAt?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  private get db(): PrismaService {
    assertDb(this.prisma);
    return this.prisma;
  }

  private async counts(instituteIds: string[]) {
    const rows = instituteIds.length
      ? await this.db.instituteMembership.groupBy({
          by: ['instituteId', 'role'],
          where: { instituteId: { in: instituteIds }, status: 'ACTIVE' },
          _count: { _all: true },
        })
      : [];
    const out = new Map<string, { students: number; teachers: number }>();
    for (const r of rows) {
      const c = out.get(r.instituteId) ?? { students: 0, teachers: 0 };
      if (r.role === 'STUDENT') c.students += r._count._all;
      else if (r.role === 'FACULTY' || r.role === 'TEACHER') c.teachers += r._count._all;
      out.set(r.instituteId, c);
    }
    return out;
  }

  private shape(
    inst: any,
    counts: { students: number; teachers: number } | undefined,
    owner?: { fullName: string; email: string } | null,
  ): InstituteTenantRecord {
    return {
      id: inst.id,
      name: inst.name,
      subdomain: inst.subdomain || inst.slug,
      plan: inst.plan as SubscriptionPlan,
      status: (inst.isActive ? inst.status : 'SUSPENDED') as 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
      ownerName: owner?.fullName || inst.signatoryName || '',
      ownerEmail: owner?.email || inst.contactEmail || '',
      ...(inst.contactPhone ? { ownerPhone: inst.contactPhone } : {}),
      ...(inst.customDomain ? { customDomain: inst.customDomain } : {}),
      isWhiteLabel: !!inst.isWhiteLabel,
      isDedicatedDb: !!inst.isDedicatedDb,
      studentCount: counts?.students ?? 0,
      teacherCount: counts?.teachers ?? 0,
      createdAt: inst.createdAt.toISOString(),
      updatedAt: inst.updatedAt.toISOString(),
      ...(inst.primaryColor ? { themePrimaryColor: inst.primaryColor } : {}),
      ...(inst.logoUrl ? { logoUrl: inst.logoUrl } : {}),
      ...(inst.maxStudents ? { maxStudentsLimit: inst.maxStudents } : {}),
      ...(inst.maxTeachers ? { maxTeachersLimit: inst.maxTeachers } : {}),
    };
  }

  private async owners(instituteIds: string[]) {
    const rows = instituteIds.length
      ? await this.db.instituteMembership.findMany({
          where: { instituteId: { in: instituteIds }, role: 'TUITION_OWNER', status: 'ACTIVE' },
          select: { instituteId: true, user: { select: { fullName: true, email: true } } },
          orderBy: { createdAt: 'asc' },
          take: instituteIds.length * 3,
        })
      : [];
    const out = new Map<string, { fullName: string; email: string }>();
    for (const r of rows) if (!out.has(r.instituteId)) out.set(r.instituteId, r.user);
    return out;
  }

  // --------------------------------------------------------------------------
  // 1. INSTITUTES & TENANT MANAGEMENT
  // --------------------------------------------------------------------------

  async getInstitutes(limit?: unknown): Promise<InstituteTenantRecord[]> {
    const rows = await this.db.institute.findMany({ orderBy: { createdAt: 'desc' }, take: clampLimit(limit, 200, 500) });
    const ids = rows.map((r) => r.id);
    const [counts, owners] = await Promise.all([this.counts(ids), this.owners(ids)]);
    return rows.map((r) => this.shape(r, counts.get(r.id), owners.get(r.id)));
  }

  async getInstituteById(id: string): Promise<InstituteTenantRecord> {
    const inst = await this.db.institute.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException(`Institute tenant "${id}" not found.`);
    const [counts, owners] = await Promise.all([this.counts([id]), this.owners([id])]);
    return this.shape(inst, counts.get(id), owners.get(id));
  }

  async createInstitute(
    dto: CreateInstituteTenantDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    const sub = dto.subdomain.toLowerCase().trim();
    if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(sub)) {
      throw new BadRequestException('Subdomain must be 2-41 lowercase letters, digits or hyphens.');
    }
    const clash = await this.db.institute.findFirst({
      where: {
        OR: [
          { slug: sub },
          { subdomain: sub },
          ...(dto.customDomain ? [{ customDomain: dto.customDomain.toLowerCase().trim() }] : []),
        ],
      },
      select: { id: true },
    });
    if (clash) throw new ConflictException(`Subdomain or domain "${dto.subdomain}" is already claimed by another institute.`);

    let created;
    try {
      created = await this.db.institute.create({
        data: {
          name: dto.name,
          slug: sub,
          subdomain: sub,
          plan: dto.plan,
          status: dto.status || 'ACTIVE',
          isActive: dto.status !== 'SUSPENDED',
          customDomain: dto.customDomain ? dto.customDomain.toLowerCase().trim() : null,
          isWhiteLabel: dto.plan === 'PRO' || dto.plan === 'ENTERPRISE',
          isDedicatedDb: dto.plan === 'ENTERPRISE',
          contactEmail: dto.ownerEmail,
          contactPhone: dto.ownerPhone ?? null,
          signatoryName: dto.ownerName,
          maxStudents: dto.plan === 'STARTER' ? 100 : dto.plan === 'GROWTH' ? 500 : 2500,
          maxTeachers: dto.plan === 'STARTER' ? 5 : dto.plan === 'GROWTH' ? 25 : 100,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException(`Subdomain or domain "${dto.subdomain}" is already claimed by another institute.`);
      throw err;
    }

    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'TENANT_ONBOARDED',
      targetId: created.id,
      targetType: 'INSTITUTE',
      details: `Provisioned new tuition institute "${created.name}" with subdomain "${sub}" on plan "${created.plan}".`,
      status: 'SUCCESS',
    });
    return this.shape(created, { students: 0, teachers: 0 });
  }

  async updateStatus(
    id: string,
    dto: UpdateInstituteStatusDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    const before = await this.getInstituteById(id);
    await this.db.institute.update({
      where: { id },
      data: { status: dto.status, isActive: dto.status !== 'SUSPENDED' },
    });
    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_STATUS_CHANGED',
      targetId: id,
      targetType: 'INSTITUTE',
      details: `Changed status from ${before.status} to ${dto.status}. Reason: ${dto.reason}`,
      status: dto.status === 'SUSPENDED' ? 'WARNING' : 'SUCCESS',
    });
    return this.getInstituteById(id);
  }

  async updatePlan(
    id: string,
    dto: UpdateInstitutePlanDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    const before = await this.getInstituteById(id);
    await this.db.institute.update({
      where: { id },
      data: {
        plan: dto.plan,
        isWhiteLabel: dto.plan === 'PRO' || dto.plan === 'ENTERPRISE',
        isDedicatedDb: dto.plan === 'ENTERPRISE',
      },
    });
    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_PLAN_UPDATED',
      targetId: id,
      targetType: 'SUBSCRIPTION',
      details: `Plan changed from ${before.plan} to ${dto.plan}. Reason: ${dto.reason || 'Admin modification'}`,
      status: 'SUCCESS',
    });
    return this.getInstituteById(id);
  }

  async updateConfig(
    id: string,
    dto: UpdateTenantConfigDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    await this.getInstituteById(id);
    try {
      await this.db.institute.update({
        where: { id },
        data: {
          ...(dto.customDomain !== undefined ? { customDomain: dto.customDomain ? dto.customDomain.toLowerCase().trim() : null } : {}),
          ...(dto.isWhiteLabel !== undefined ? { isWhiteLabel: dto.isWhiteLabel } : {}),
          ...(dto.isDedicatedDb !== undefined ? { isDedicatedDb: dto.isDedicatedDb } : {}),
          ...(dto.themePrimaryColor !== undefined ? { primaryColor: dto.themePrimaryColor } : {}),
          ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
          ...(dto.maxStudentsLimit !== undefined ? { maxStudents: dto.maxStudentsLimit } : {}),
          ...(dto.maxTeachersLimit !== undefined ? { maxTeachers: dto.maxTeachersLimit } : {}),
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException('That custom domain is already in use.');
      throw err;
    }
    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_CONFIG_UPDATED',
      targetId: id,
      targetType: 'WHITE_LABEL_CONFIG',
      details: 'Updated white-label configuration and resource quotas.',
      status: 'SUCCESS',
    });
    return this.getInstituteById(id);
  }

  // --------------------------------------------------------------------------
  // 2. PLATFORM METRICS & OPERATIONAL HEALTH (all aggregates come from the database)
  // --------------------------------------------------------------------------

  async getPlatformStats() {
    const db = this.db;
    const [byPlan, byActive, byRole] = await Promise.all([
      db.institute.groupBy({ by: ['plan'], _count: { _all: true } }),
      db.institute.groupBy({ by: ['isActive'], _count: { _all: true } }),
      db.instituteMembership.groupBy({ by: ['role'], where: { status: 'ACTIVE' }, _count: { _all: true } }),
    ]);
    const plan = (p: string) => byPlan.find((x) => x.plan === p)?._count._all ?? 0;
    const role = (r: string) => byRole.find((x) => x.role === r)?._count._all ?? 0;
    const memoryUsage = process.memoryUsage();
    return {
      tenants: {
        total: byActive.reduce((a, x) => a + x._count._all, 0),
        active: byActive.find((x) => x.isActive)?._count._all ?? 0,
        suspended: byActive.find((x) => !x.isActive)?._count._all ?? 0,
        starterPlan: plan('STARTER'),
        growthPlan: plan('GROWTH'),
        proPlan: plan('PRO'),
        enterprisePlan: plan('ENTERPRISE'),
      },
      users: {
        totalStudents: role('STUDENT'),
        totalTeachers: role('FACULTY') + role('TEACHER'),
      },
      infrastructure: {
        apiStatus: 'HEALTHY',
        databaseStatus: 'CONNECTED',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
        memoryHeapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production',
      },
    };
  }

  // --------------------------------------------------------------------------
  // 3. SECURITY & AUDIT TRAIL
  // --------------------------------------------------------------------------

  async getAuditLogs(limit: number = 50): Promise<PlatformAuditLog[]> {
    const logs = await this.db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: clampLimit(limit, 50, 200),
    });
    return logs.map((l) => ({
      id: l.id,
      timestamp: l.createdAt.toISOString(),
      actorId: l.userId || 'system',
      actorEmail: l.actorEmail || '',
      action: l.action,
      targetId: l.resourceId || undefined,
      targetType: l.resourceType || undefined,
      details: l.details || '',
      status: (l.status as PlatformAuditLog['status']) || 'SUCCESS',
    }));
  }

  /** Awaited (not fire-and-forget): serverless instances freeze after the response, so a floating write is lost. */
  private async recordAuditLog(log: Omit<PlatformAuditLog, 'id' | 'timestamp'>): Promise<void> {
    await this.db.auditLog.create({
      data: {
        instituteId: log.targetType === 'INSTITUTE' ? log.targetId ?? null : null,
        userId: log.actorId,
        actorEmail: log.actorEmail,
        action: log.action,
        resourceType: log.targetType || 'PLATFORM',
        resourceId: log.targetId,
        details: log.details,
        status: log.status,
      },
    });
  }

  // --------------------------------------------------------------------------
  // 4. PLATFORM BROADCAST ANNOUNCEMENTS
  // --------------------------------------------------------------------------

  private shapeAnnouncement(a: any): PlatformAnnouncement {
    return {
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      targetAudience: a.targetAudience,
      createdAt: a.createdAt.toISOString(),
      ...(a.expiresAt ? { expiresAt: a.expiresAt.toISOString() } : {}),
    };
  }

  async getAnnouncements(): Promise<PlatformAnnouncement[]> {
    const anns = await this.db.platformAnnouncement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return anns.map((a) => this.shapeAnnouncement(a));
  }

  async createAnnouncement(
    dto: CreatePlatformAnnouncementDto,
    actor: { id: string; email: string },
  ): Promise<PlatformAnnouncement> {
    let expiresAt: Date | null = null;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) throw new BadRequestException('expiresAt is not a valid date.');
    }
    const created = await this.db.platformAnnouncement.create({
      data: {
        title: dto.title,
        message: dto.message,
        severity: dto.severity,
        targetAudience: dto.targetAudience || 'ALL',
        expiresAt,
        createdById: actor.id,
      },
    });
    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'PLATFORM_ANNOUNCEMENT_POSTED',
      targetId: created.id,
      targetType: 'ANNOUNCEMENT',
      details: `Published global announcement "${dto.title}" with severity "${dto.severity}".`,
      status: 'SUCCESS',
    });
    return this.shapeAnnouncement(created);
  }
}
