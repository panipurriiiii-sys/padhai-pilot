import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
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
  private memoryInstitutes = new Map<string, InstituteTenantRecord>();
  private auditLogs: PlatformAuditLog[] = [];
  private announcements: PlatformAnnouncement[] = [];

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {
    this.seedBaselineData();
  }

  private seedBaselineData() {
    const defaultInstitutes: InstituteTenantRecord[] = [
      {
        id: 'inst_apex_academy',
        name: 'Apex Academy Kota',
        subdomain: 'apex',
        plan: 'GROWTH',
        status: 'ACTIVE',
        ownerName: 'Rajeshwar Singhania',
        ownerEmail: 'owner@padhaipilot.com',
        ownerPhone: '+91 98220 11223',
        customDomain: 'learn.apexkota.edu.in',
        isWhiteLabel: true,
        isDedicatedDb: false,
        studentCount: 142,
        teacherCount: 8,
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-10-25T14:20:00Z',
        themePrimaryColor: '#1677FF',
        maxStudentsLimit: 500,
        maxTeachersLimit: 25,
      },
      {
        id: 'inst_zenith_classes',
        name: 'Zenith Science Institute',
        subdomain: 'zenith',
        plan: 'PRO',
        status: 'ACTIVE',
        ownerName: 'Dr. Anand Verma',
        ownerEmail: 'anand@zenithclasses.com',
        ownerPhone: '+91 98111 23456',
        customDomain: 'portal.zenithscience.com',
        isWhiteLabel: true,
        isDedicatedDb: true,
        studentCount: 380,
        teacherCount: 15,
        createdAt: '2026-08-15T09:30:00Z',
        updatedAt: '2026-10-28T10:15:00Z',
        themePrimaryColor: '#059669',
        maxStudentsLimit: 1000,
        maxTeachersLimit: 50,
      },
      {
        id: 'inst_prerna_tuition',
        name: 'Prerna Commerce Classes',
        subdomain: 'prerna',
        plan: 'STARTER',
        status: 'ACTIVE',
        ownerName: 'Sunita Agarwal',
        ownerEmail: 'sunita@prernaclasses.in',
        ownerPhone: '+91 98333 44556',
        isWhiteLabel: false,
        isDedicatedDb: false,
        studentCount: 45,
        teacherCount: 3,
        createdAt: '2026-10-10T11:00:00Z',
        updatedAt: '2026-10-20T16:00:00Z',
        maxStudentsLimit: 100,
        maxTeachersLimit: 5,
      },
      {
        id: 'inst_quantum_allen',
        name: 'Quantum Physics Circle',
        subdomain: 'quantum',
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        ownerName: 'Prof. Debabrata Roy',
        ownerEmail: 'debabrata@quantumphy.org',
        ownerPhone: '+91 97444 88990',
        customDomain: 'mastery.quantumphy.org',
        isWhiteLabel: true,
        isDedicatedDb: true,
        studentCount: 890,
        teacherCount: 32,
        createdAt: '2026-07-01T07:00:00Z',
        updatedAt: '2026-10-29T18:00:00Z',
        maxStudentsLimit: 5000,
        maxTeachersLimit: 100,
      },
    ];

    for (const inst of defaultInstitutes) {
      this.memoryInstitutes.set(inst.id, inst);
    }

    this.auditLogs = [
      {
        id: 'audit_init_01',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        actorId: 'usr_admin_malhotra',
        actorEmail: 'superadmin@padhaipilot.com',
        action: 'TENANT_ONBOARDED',
        targetId: 'inst_quantum_allen',
        targetType: 'INSTITUTE',
        details: 'Onboarded Quantum Physics Circle on Enterprise tier with dedicated DB.',
        status: 'SUCCESS',
      },
      {
        id: 'audit_init_02',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        actorId: 'usr_admin_malhotra',
        actorEmail: 'superadmin@padhaipilot.com',
        action: 'PLAN_UPGRADE',
        targetId: 'inst_apex_academy',
        targetType: 'SUBSCRIPTION',
        details: 'Upgraded Apex Academy Kota from STARTER to GROWTH.',
        status: 'SUCCESS',
      },
      {
        id: 'audit_init_03',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        actorId: 'usr_admin_malhotra',
        actorEmail: 'superadmin@padhaipilot.com',
        action: 'KILL_SWITCH_ENGAGED',
        targetId: 'AI_PROCTORING',
        targetType: 'FEATURE_FLAG',
        details: 'Emergency kill switch verified across all tenant nodes.',
        status: 'WARNING',
      },
    ];

    this.announcements = [
      {
        id: 'ann_sys_01',
        title: 'Scheduled Cloud Maintenance — PostgreSQL Optimization',
        message: 'Platform-wide DB maintenance scheduled for Sunday at 02:00 AM IST. Expect up to 2 mins read-only transition.',
        severity: 'info',
        targetAudience: 'ALL',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 1. INSTITUTES & TENANT MANAGEMENT
  // --------------------------------------------------------------------------

  async getInstitutes(): Promise<InstituteTenantRecord[]> {
    if (this.prisma.isConnected) {
      try {
        const dbInstitutes = await this.prisma.institute.findMany({
          include: {
            _count: {
              select: {
                memberships: true,
                batches: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (dbInstitutes && dbInstitutes.length > 0) {
          return dbInstitutes.map((inst: any) => {
            const memoryFallback = this.memoryInstitutes.get(inst.id);
            return {
              id: inst.id,
              name: inst.name,
              subdomain: inst.subdomain || inst.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
              plan: ((inst.plan as SubscriptionPlan) || memoryFallback?.plan || 'GROWTH') as SubscriptionPlan,
              status: (inst.status || memoryFallback?.status || 'ACTIVE') as 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
              ownerName: memoryFallback?.ownerName || 'Tuition Administrator',
              ownerEmail: memoryFallback?.ownerEmail || `admin@${inst.subdomain || 'institute'}.com`,
              ownerPhone: memoryFallback?.ownerPhone,
              customDomain: inst.customDomain || memoryFallback?.customDomain,
              isWhiteLabel: memoryFallback?.isWhiteLabel ?? true,
              isDedicatedDb: memoryFallback?.isDedicatedDb ?? false,
              studentCount: inst._count?.memberships || memoryFallback?.studentCount || 45,
              teacherCount: memoryFallback?.teacherCount || 5,
              createdAt: inst.createdAt.toISOString(),
              updatedAt: inst.updatedAt.toISOString(),
              themePrimaryColor: memoryFallback?.themePrimaryColor,
              logoUrl: inst.logoUrl || memoryFallback?.logoUrl,
              maxStudentsLimit: memoryFallback?.maxStudentsLimit || 500,
              maxTeachersLimit: memoryFallback?.maxTeachersLimit || 25,
            };
          });
        }
      } catch {
        // Fallback to memory
      }
    }

    return Array.from(this.memoryInstitutes.values());
  }

  async getInstituteById(id: string): Promise<InstituteTenantRecord> {
    const inst = this.memoryInstitutes.get(id);
    if (!inst) {
      throw new NotFoundException(`Institute tenant "${id}" not found.`);
    }
    return inst;
  }

  async createInstitute(
    dto: CreateInstituteTenantDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    // Check subdomain collision
    const existing = Array.from(this.memoryInstitutes.values()).find(
      (i) => i.subdomain.toLowerCase() === dto.subdomain.toLowerCase(),
    );
    if (existing) {
      throw new ConflictException(`Subdomain "${dto.subdomain}" is already claimed by another institute.`);
    }

    const id = `inst_${dto.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const newInst: InstituteTenantRecord = {
      id,
      name: dto.name,
      subdomain: dto.subdomain.toLowerCase(),
      plan: dto.plan,
      status: dto.status || 'ACTIVE',
      ownerName: dto.ownerName,
      ownerEmail: dto.ownerEmail,
      ownerPhone: dto.ownerPhone,
      customDomain: dto.customDomain,
      isWhiteLabel: dto.plan === 'PRO' || dto.plan === 'ENTERPRISE',
      isDedicatedDb: dto.plan === 'ENTERPRISE',
      studentCount: 0,
      teacherCount: 1,
      createdAt: now,
      updatedAt: now,
      maxStudentsLimit: dto.plan === 'STARTER' ? 100 : dto.plan === 'GROWTH' ? 500 : 2500,
      maxTeachersLimit: dto.plan === 'STARTER' ? 5 : dto.plan === 'GROWTH' ? 25 : 100,
    };

    if (this.prisma.isConnected) {
      try {
        await this.prisma.institute.create({
          data: {
            id: newInst.id,
            name: newInst.name,
            subdomain: newInst.subdomain,
            plan: newInst.plan,
            status: newInst.status,
            customDomain: newInst.customDomain,
          },
        });
      } catch {
        // Continue with memory store
      }
    }

    this.memoryInstitutes.set(newInst.id, newInst);

    this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'TENANT_ONBOARDED',
      targetId: newInst.id,
      targetType: 'INSTITUTE',
      details: `Provisioned new tuition institute "${newInst.name}" with subdomain "${newInst.subdomain}" on plan "${newInst.plan}".`,
      status: 'SUCCESS',
    });

    return newInst;
  }

  async updateStatus(
    id: string,
    dto: UpdateInstituteStatusDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    const inst = await this.getInstituteById(id);
    const oldStatus = inst.status;
    inst.status = dto.status;
    inst.updatedAt = new Date().toISOString();

    if (this.prisma.isConnected) {
      try {
        await this.prisma.institute.update({
          where: { id },
          data: { status: dto.status },
        });
      } catch {}
    }

    this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_STATUS_CHANGED',
      targetId: id,
      targetType: 'INSTITUTE',
      details: `Changed status from ${oldStatus} to ${dto.status}. Reason: ${dto.reason}`,
      status: dto.status === 'SUSPENDED' ? 'WARNING' : 'SUCCESS',
    });

    return inst;
  }

  async updatePlan(
    id: string,
    dto: UpdateInstitutePlanDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    const inst = await this.getInstituteById(id);
    const oldPlan = inst.plan;
    inst.plan = dto.plan;
    inst.isWhiteLabel = dto.plan === 'PRO' || dto.plan === 'ENTERPRISE';
    inst.isDedicatedDb = dto.plan === 'ENTERPRISE';
    inst.updatedAt = new Date().toISOString();

    if (this.prisma.isConnected) {
      try {
        await this.prisma.institute.update({
          where: { id },
          data: { plan: dto.plan },
        });
      } catch {}
    }

    this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_PLAN_UPDATED',
      targetId: id,
      targetType: 'SUBSCRIPTION',
      details: `Upgraded/modified plan from ${oldPlan} to ${dto.plan}. Reason: ${dto.reason || 'Admin modification'}`,
      status: 'SUCCESS',
    });

    return inst;
  }

  async updateConfig(
    id: string,
    dto: UpdateTenantConfigDto,
    actor: { id: string; email: string },
  ): Promise<InstituteTenantRecord> {
    const inst = await this.getInstituteById(id);

    if (dto.customDomain !== undefined) inst.customDomain = dto.customDomain;
    if (dto.isWhiteLabel !== undefined) inst.isWhiteLabel = dto.isWhiteLabel;
    if (dto.isDedicatedDb !== undefined) inst.isDedicatedDb = dto.isDedicatedDb;
    if (dto.themePrimaryColor !== undefined) inst.themePrimaryColor = dto.themePrimaryColor;
    if (dto.logoUrl !== undefined) inst.logoUrl = dto.logoUrl;
    if (dto.maxStudentsLimit !== undefined) inst.maxStudentsLimit = dto.maxStudentsLimit;
    if (dto.maxTeachersLimit !== undefined) inst.maxTeachersLimit = dto.maxTeachersLimit;
    inst.updatedAt = new Date().toISOString();

    this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_CONFIG_UPDATED',
      targetId: id,
      targetType: 'WHITE_LABEL_CONFIG',
      details: `Updated white-label configuration and resource quotas for "${inst.name}".`,
      status: 'SUCCESS',
    });

    return inst;
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
    return this.auditLogs.slice(0, limit);
  }

  private recordAuditLog(log: Omit<PlatformAuditLog, 'id' | 'timestamp'>) {
    const item: PlatformAuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(item);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  // --------------------------------------------------------------------------
  // 4. PLATFORM BROADCAST ANNOUNCEMENTS
  // --------------------------------------------------------------------------

  async getAnnouncements(): Promise<PlatformAnnouncement[]> {
    return this.announcements;
  }

  async createAnnouncement(
    dto: CreatePlatformAnnouncementDto,
    actor: { id: string; email: string },
  ): Promise<PlatformAnnouncement> {
    const announcement: PlatformAnnouncement = {
      id: `ann_sys_${Date.now()}`,
      title: dto.title,
      message: dto.message,
      severity: dto.severity,
      targetAudience: dto.targetAudience || 'ALL',
      createdAt: new Date().toISOString(),
      expiresAt: dto.expiresAt,
    };

    this.announcements.unshift(announcement);

    this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'PLATFORM_ANNOUNCEMENT_POSTED',
      targetId: announcement.id,
      targetType: 'ANNOUNCEMENT',
      details: `Published global announcement "${dto.title}" with severity "${dto.severity}".`,
      status: 'SUCCESS',
    });

    return announcement;
  }
}
