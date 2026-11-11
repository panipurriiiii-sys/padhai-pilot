import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { assertDb } from '../common/db/db.js';
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

type InstituteWithRelations = {
  id: string;
  name: string;
  slug: string;
  subdomain?: string | null;
  plan: string;
  status: string;
  isActive: boolean;
  customDomain?: string | null;
  isWhiteLabel: boolean;
  isDedicatedDb: boolean;
  maxStudents?: number | null;
  maxTeachers?: number | null;
  primaryColor?: string | null;
  logoUrl?: string | null;
  contactPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  memberships: Array<{
    user: { fullName: string; email: string; phone?: string | null };
  }>;
  _count: { enrollments: number; facultyProfiles: number };
};

function mapInstitute(inst: InstituteWithRelations): InstituteTenantRecord {
  const owner = inst.memberships[0]?.user;
  return {
    id: inst.id,
    name: inst.name,
    subdomain: inst.subdomain || inst.slug,
    plan: inst.plan as SubscriptionPlan,
    status: (inst.status || (inst.isActive ? 'ACTIVE' : 'SUSPENDED')) as 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
    ownerName: owner?.fullName || 'Tuition Administrator',
    ownerEmail: owner?.email || `admin@${inst.slug}.com`,
    ownerPhone: owner?.phone || inst.contactPhone || undefined,
    customDomain: inst.customDomain || undefined,
    isWhiteLabel: inst.isWhiteLabel,
    isDedicatedDb: inst.isDedicatedDb,
    studentCount: inst._count.enrollments,
    teacherCount: inst._count.facultyProfiles,
    createdAt: inst.createdAt.toISOString(),
    updatedAt: inst.updatedAt.toISOString(),
    themePrimaryColor: inst.primaryColor || undefined,
    logoUrl: inst.logoUrl || undefined,
    maxStudentsLimit: inst.maxStudents || undefined,
    maxTeachersLimit: inst.maxTeachers || undefined,
  };
}

const INSTITUTE_INCLUDE = {
  memberships: {
    where: { role: 'TUITION_OWNER', status: 'ACTIVE' },
    include: { user: { select: { fullName: true, email: true, phone: true } } },
    take: 1,
  },
  _count: { select: { enrollments: true, facultyProfiles: true } },
} as const;

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  // --------------------------------------------------------------------------
  // 1. INSTITUTES & TENANT MANAGEMENT
  // --------------------------------------------------------------------------

  async getInstitutes(): Promise<InstituteTenantRecord[]> {
    assertDb(this.prisma);
    const rows = await this.prisma.institute.findMany({
      include: INSTITUTE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return (rows as unknown as InstituteWithRelations[]).map(mapInstitute);
  }

  async getInstituteById(id: string): Promise<InstituteTenantRecord> {
    assertDb(this.prisma);
    const inst = await this.prisma.institute.findUnique({
      where: { id },
      include: INSTITUTE_INCLUDE,
    });
    if (!inst) {
      throw new NotFoundException(`Institute "${id}" not found.`);
    }
    return mapInstitute(inst as unknown as InstituteWithRelations);
  }

  async createInstitute(
    dto: CreateInstituteTenantDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    assertDb(this.prisma);
    const subdomainLower = dto.subdomain.toLowerCase().trim();

    const collision = await this.prisma.institute.findFirst({
      where: { OR: [{ slug: subdomainLower }, { subdomain: subdomainLower }] },
      select: { id: true },
    });
    if (collision) {
      throw new ConflictException(`Subdomain "${dto.subdomain}" is already claimed by another institute.`);
    }

    const maxStudents = dto.plan === 'STARTER' ? 100 : dto.plan === 'GROWTH' ? 500 : 2500;
    const maxTeachers = dto.plan === 'STARTER' ? 5 : dto.plan === 'GROWTH' ? 25 : 100;
    const statusValue = dto.status || 'ACTIVE';

    const created = await this.prisma.institute.create({
      data: {
        name: dto.name,
        slug: subdomainLower,
        subdomain: subdomainLower,
        plan: dto.plan,
        status: statusValue,
        isActive: statusValue !== 'SUSPENDED',
        customDomain: dto.customDomain || null,
        isWhiteLabel: dto.plan === 'PRO' || dto.plan === 'ENTERPRISE',
        isDedicatedDb: dto.plan === 'ENTERPRISE',
        maxStudents,
        maxTeachers,
        contactPhone: dto.ownerPhone || null,
      },
    });

    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'TENANT_ONBOARDED',
      targetId: created.id,
      targetType: 'INSTITUTE',
      details: `Provisioned new institute "${dto.name}" with subdomain "${subdomainLower}" on plan "${dto.plan}".`,
      status: 'SUCCESS',
    });

    return {
      id: created.id,
      name: created.name,
      subdomain: (created as any).subdomain || created.slug,
      plan: created.plan as SubscriptionPlan,
      status: statusValue as 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
      ownerName: dto.ownerName,
      ownerEmail: dto.ownerEmail,
      ownerPhone: dto.ownerPhone,
      customDomain: (created as any).customDomain || undefined,
      isWhiteLabel: (created as any).isWhiteLabel,
      isDedicatedDb: (created as any).isDedicatedDb,
      studentCount: 0,
      teacherCount: 1,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      maxStudentsLimit: maxStudents,
      maxTeachersLimit: maxTeachers,
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateInstituteStatusDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    assertDb(this.prisma);
    const existing = await this.getInstituteById(id);

    await this.prisma.institute.update({
      where: { id },
      data: {
        status: dto.status,
        isActive: dto.status !== 'SUSPENDED',
      },
    });

    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_STATUS_CHANGED',
      targetId: id,
      targetType: 'INSTITUTE',
      details: `Changed status from ${existing.status} to ${dto.status}. Reason: ${dto.reason}`,
      status: dto.status === 'SUSPENDED' ? 'WARNING' : 'SUCCESS',
    });

    return { ...existing, status: dto.status, updatedAt: new Date().toISOString() };
  }

  async updatePlan(
    id: string,
    dto: UpdateInstitutePlanDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    assertDb(this.prisma);
    const existing = await this.getInstituteById(id);

    await this.prisma.institute.update({
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
      details: `Changed plan from ${existing.plan} to ${dto.plan}. Reason: ${dto.reason || 'Admin modification'}`,
      status: 'SUCCESS',
    });

    return {
      ...existing,
      plan: dto.plan,
      isWhiteLabel: dto.plan === 'PRO' || dto.plan === 'ENTERPRISE',
      isDedicatedDb: dto.plan === 'ENTERPRISE',
      updatedAt: new Date().toISOString(),
    };
  }

  async updateConfig(
    id: string,
    dto: UpdateTenantConfigDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    assertDb(this.prisma);
    const existing = await this.getInstituteById(id);

    await this.prisma.institute.update({
      where: { id },
      data: {
        ...(dto.customDomain !== undefined ? { customDomain: dto.customDomain } : {}),
        ...(dto.isWhiteLabel !== undefined ? { isWhiteLabel: dto.isWhiteLabel } : {}),
        ...(dto.isDedicatedDb !== undefined ? { isDedicatedDb: dto.isDedicatedDb } : {}),
        ...(dto.themePrimaryColor !== undefined ? { primaryColor: dto.themePrimaryColor } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.maxStudentsLimit !== undefined ? { maxStudents: dto.maxStudentsLimit } : {}),
        ...(dto.maxTeachersLimit !== undefined ? { maxTeachers: dto.maxTeachersLimit } : {}),
      },
    });

    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_CONFIG_UPDATED',
      targetId: id,
      targetType: 'WHITE_LABEL_CONFIG',
      details: `Updated white-label configuration and resource quotas for "${existing.name}".`,
      status: 'SUCCESS',
    });

    return {
      ...existing,
      ...(dto.customDomain !== undefined ? { customDomain: dto.customDomain } : {}),
      ...(dto.isWhiteLabel !== undefined ? { isWhiteLabel: dto.isWhiteLabel } : {}),
      ...(dto.isDedicatedDb !== undefined ? { isDedicatedDb: dto.isDedicatedDb } : {}),
      ...(dto.themePrimaryColor !== undefined ? { themePrimaryColor: dto.themePrimaryColor } : {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.maxStudentsLimit !== undefined ? { maxStudentsLimit: dto.maxStudentsLimit } : {}),
      ...(dto.maxTeachersLimit !== undefined ? { maxTeachersLimit: dto.maxTeachersLimit } : {}),
      updatedAt: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // 2. PLATFORM METRICS & OPERATIONAL HEALTH
  // --------------------------------------------------------------------------

  async getPlatformStats() {
    const institutes = await this.getInstitutes();
    const totalStudents = institutes.reduce((acc, i) => acc + (i.studentCount || 0), 0);
    const totalTeachers = institutes.reduce((acc, i) => acc + (i.teacherCount || 0), 0);
    const activeTenants = institutes.filter((i) => i.status === 'ACTIVE').length;
    const suspendedTenants = institutes.filter((i) => i.status === 'SUSPENDED').length;

    const memoryUsage = process.memoryUsage();

    return {
      tenants: {
        total: institutes.length,
        active: activeTenants,
        suspended: suspendedTenants,
        starterPlan: institutes.filter((i) => i.plan === 'STARTER').length,
        growthPlan: institutes.filter((i) => i.plan === 'GROWTH').length,
        proPlan: institutes.filter((i) => i.plan === 'PRO').length,
        enterprisePlan: institutes.filter((i) => i.plan === 'ENTERPRISE').length,
      },
      users: {
        totalStudents,
        totalTeachers,
        estimatedDailyActive: Math.round(totalStudents * 0.72),
      },
      infrastructure: {
        apiStatus: 'HEALTHY',
        databaseStatus: this.prisma.isConnected ? 'CONNECTED' : 'STANDBY_FALLBACK',
        redisStatus: 'ACTIVE',
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
    assertDb(this.prisma);
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs.map((l) => ({
      id: l.id,
      timestamp: l.createdAt.toISOString(),
      actorId: l.userId || 'system',
      actorEmail: l.actorEmail || 'unknown@padhaipilot.com',
      action: l.action,
      targetId: l.resourceId || undefined,
      targetType: l.resourceType || undefined,
      details: l.details || '',
      status: (l.status as any) || 'SUCCESS',
    }));
  }

  private async recordAuditLog(log: Omit<PlatformAuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (!this.prisma.isConnected) return;
    await this.prisma.auditLog
      .create({
        data: {
          instituteId: log.targetType === 'INSTITUTE' ? log.targetId : null,
          userId: log.actorId,
          actorEmail: log.actorEmail,
          action: log.action,
          resourceType: log.targetType || 'PLATFORM',
          resourceId: log.targetId,
          details: log.details,
          status: log.status,
        },
      })
      .catch(() => {});
  }

  // --------------------------------------------------------------------------
  // 4. PLATFORM BROADCAST ANNOUNCEMENTS
  // --------------------------------------------------------------------------

  async getAnnouncements(): Promise<PlatformAnnouncement[]> {
    assertDb(this.prisma);
    const anns = await this.prisma.platformAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return anns.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity as any,
      targetAudience: a.targetAudience as any,
      createdAt: a.createdAt.toISOString(),
      expiresAt: a.expiresAt ? a.expiresAt.toISOString() : undefined,
    }));
  }

  async createAnnouncement(
    dto: CreatePlatformAnnouncementDto,
    actor: { id: string; email: string },
  ): Promise<PlatformAnnouncement> {
    assertDb(this.prisma);
    const created = await this.prisma.platformAnnouncement.create({
      data: {
        title: dto.title,
        message: dto.message,
        severity: dto.severity,
        targetAudience: dto.targetAudience || 'ALL',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
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

    return {
      id: created.id,
      title: created.title,
      message: created.message,
      severity: created.severity as any,
      targetAudience: created.targetAudience as any,
      createdAt: created.createdAt.toISOString(),
      expiresAt: created.expiresAt ? created.expiresAt.toISOString() : undefined,
    };
  }
}
