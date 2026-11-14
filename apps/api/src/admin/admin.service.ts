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
import { validateStateTransition, INSTITUTE_TRANSITIONS, type InstituteStatus } from '../common/state/state-machine.js';
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
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED';
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
  isTrialActive?: boolean;
  trialEndsAt?: string | null;
  trialDaysLeft?: number;
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
    const feat = (inst.features || {}) as Record<string, any>;
    const trialEndsAt = feat.trialEndsAt ? new Date(feat.trialEndsAt).toISOString() : null;
    const now = Date.now();
    const isTrialActive = Boolean(
      (inst.status === 'TRIAL' || feat.isTrial === true) &&
      trialEndsAt &&
      new Date(trialEndsAt).getTime() > now
    );
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: inst.id,
      name: inst.name,
      subdomain: inst.subdomain || inst.slug,
      plan: inst.plan as SubscriptionPlan,
      status: (inst.isActive || inst.status === 'ARCHIVED' ? inst.status : 'SUSPENDED') as InstituteTenantRecord['status'],
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
      isTrialActive,
      trialEndsAt,
      trialDaysLeft,
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
    validateStateTransition('Institute', before.status as InstituteStatus, dto.status as InstituteStatus, INSTITUTE_TRANSITIONS);
    const existing = await this.db.institute.findUnique({ where: { id }, select: { features: true } });
    const feat = ((existing?.features || {}) as Record<string, any>);

    if (dto.status === 'TRIAL') {
      const trialDurationDays = (dto as any).trialDays || 7;
      const trialEndsAt = new Date(Date.now() + trialDurationDays * 24 * 60 * 60 * 1000).toISOString();
      feat.isTrial = true;
      feat.trialStartedAt = new Date().toISOString();
      feat.trialEndsAt = trialEndsAt;
      feat.trialDays = trialDurationDays;
    } else if (dto.status === 'ACTIVE') {
      feat.isTrial = false;
    }

    const updateData: Record<string, any> = {
      status: dto.status,
      isActive: dto.status !== 'SUSPENDED' && dto.status !== 'ARCHIVED',
    };
    if (dto.status === 'TRIAL' || dto.status === 'ACTIVE') {
      updateData.features = feat;
    }

    await this.db.institute.update({
      where: { id },
      data: updateData,
    });
    if (this.redis && typeof this.redis.invalidateTenant === 'function') {
      await this.redis.invalidateTenant(id).catch(() => {});
    }
    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'INSTITUTE_STATUS_CHANGED',
      targetId: id,
      targetType: 'INSTITUTE',
      details: `Changed status from ${before.status} to ${dto.status}. Reason: ${dto.reason}${dto.status === 'TRIAL' ? ' (7-Day Free Trial Activated)' : ''}`,
      status: dto.status === 'SUSPENDED' || dto.status === 'ARCHIVED' ? 'WARNING' : 'SUCCESS',
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
    try {
      const anns = await this.db.platformAnnouncement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
      return anns.map((a) => this.shapeAnnouncement(a));
    } catch (e: any) {
      if (e?.code === 'P2021' || e?.message?.includes('does not exist')) {
        // Table not migrated yet on this database instance - return empty list gracefully
        return [];
      }
      throw e;
    }
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

  async deleteAnnouncement(
    id: string,
    actor: { id: string; email: string },
  ): Promise<{ success: boolean; message: string }> {
    if (!id) throw new BadRequestException('Announcement ID is required.');
    const existing = await this.db.platformAnnouncement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Platform announcement not found.');

    await this.db.platformAnnouncement.delete({ where: { id } });
    await this.recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'PLATFORM_ANNOUNCEMENT_DELETED',
      targetId: id,
      targetType: 'ANNOUNCEMENT',
      details: `Deleted global announcement "${existing.title}".`,
      status: 'SUCCESS',
    });
    return { success: true, message: `Announcement "${existing.title}" deleted.` };
  }

  async seedLibraryMaterials(uploadedBy: string): Promise<{ migrated: boolean; inserted: number; skipped: number }> {
    // Apply pending DDL (idempotent — IF NOT EXISTS guards)
    let migrated = false;
    try {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "actionButtons" JSONB`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'NORMAL'`);
      await this.prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "DeviceToken" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"token" TEXT NOT NULL,"platform" TEXT NOT NULL,"endpoint" TEXT,"p256dh" TEXT,"auth" TEXT,"userAgent" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id"))`);
      await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DeviceToken_token_key" ON "DeviceToken"("token")`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DeviceToken_userId_idx" ON "DeviceToken"("userId")`);
      await this.prisma.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='DeviceToken_userId_fkey') THEN ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$`);
      await this.prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "LibraryMaterial" ("id" TEXT NOT NULL,"instituteId" TEXT,"uploadedBy" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT,"board" TEXT NOT NULL,"classLevel" TEXT,"subject" TEXT,"contentType" TEXT NOT NULL,"fileUrl" TEXT,"externalUrl" TEXT,"yearOrEdition" TEXT,"tags" TEXT[] DEFAULT ARRAY[]::TEXT[],"isApproved" BOOLEAN NOT NULL DEFAULT false,"viewCount" INTEGER NOT NULL DEFAULT 0,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "LibraryMaterial_pkey" PRIMARY KEY ("id"))`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LibraryMaterial_board_classLevel_subject_idx" ON "LibraryMaterial"("board","classLevel","subject")`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LibraryMaterial_instituteId_idx" ON "LibraryMaterial"("instituteId")`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LibraryMaterial_contentType_idx" ON "LibraryMaterial"("contentType")`);
      await this.prisma.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='LibraryMaterial_uploadedBy_fkey') THEN ALTER TABLE "LibraryMaterial" ADD CONSTRAINT "LibraryMaterial_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$`);
      migrated = true;
    } catch (e: any) {
      // Log but continue to seed
      console.error('Migration step error (may already be applied):', e.message);
    }
    const seeds = [
      { title:'NCERT Class 6 All Subjects', board:'CBSE', classLevel:'6', subject:null as string|null, contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php', yearOrEdition:'2024', tags:['ncert','class6'] },
      { title:'NCERT Class 7 All Subjects', board:'CBSE', classLevel:'7', subject:null, contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php', yearOrEdition:'2024', tags:['ncert','class7'] },
      { title:'NCERT Class 8 All Subjects', board:'CBSE', classLevel:'8', subject:null, contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php', yearOrEdition:'2024', tags:['ncert','class8'] },
      { title:'NCERT Class 9 Mathematics', board:'CBSE', classLevel:'9', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iemh1=0-15', yearOrEdition:'2024', tags:['ncert','maths'] },
      { title:'NCERT Class 9 Science', board:'CBSE', classLevel:'9', subject:'Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iesc1=0-15', yearOrEdition:'2024', tags:['ncert','science'] },
      { title:'NCERT Class 9 Social Science', board:'CBSE', classLevel:'9', subject:'Social Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iess1=0-5', yearOrEdition:'2024', tags:['ncert','sst'] },
      { title:'NCERT Class 9 English', board:'CBSE', classLevel:'9', subject:'English', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iebs1=0-11', yearOrEdition:'2024', tags:['ncert','english'] },
      { title:'NCERT Class 10 Mathematics', board:'CBSE', classLevel:'10', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jemh1=0-15', yearOrEdition:'2024', tags:['ncert','maths','board'] },
      { title:'NCERT Class 10 Science', board:'CBSE', classLevel:'10', subject:'Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jesc1=0-16', yearOrEdition:'2024', tags:['ncert','science','board'] },
      { title:'NCERT Class 10 English First Flight', board:'CBSE', classLevel:'10', subject:'English', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jebf1=0-11', yearOrEdition:'2024', tags:['ncert','english','board'] },
      { title:'NCERT Class 10 Social Science', board:'CBSE', classLevel:'10', subject:'Social Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jess1=0-5', yearOrEdition:'2024', tags:['ncert','sst','board'] },
      { title:'NCERT Class 11 Physics Part I', board:'CBSE', classLevel:'11', subject:'Physics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?keph1=0-8', yearOrEdition:'2024', tags:['ncert','physics'] },
      { title:'NCERT Class 11 Chemistry Part I', board:'CBSE', classLevel:'11', subject:'Chemistry', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?kech1=0-7', yearOrEdition:'2024', tags:['ncert','chemistry'] },
      { title:'NCERT Class 11 Mathematics', board:'CBSE', classLevel:'11', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?kemh1=0-16', yearOrEdition:'2024', tags:['ncert','maths'] },
      { title:'NCERT Class 11 Biology', board:'CBSE', classLevel:'11', subject:'Biology', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?kebo1=0-22', yearOrEdition:'2024', tags:['ncert','biology'] },
      { title:'NCERT Class 12 Physics Part I', board:'CBSE', classLevel:'12', subject:'Physics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?leph1=0-9', yearOrEdition:'2024', tags:['ncert','physics','board'] },
      { title:'NCERT Class 12 Chemistry Part I', board:'CBSE', classLevel:'12', subject:'Chemistry', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?lech1=0-8', yearOrEdition:'2024', tags:['ncert','chemistry','board'] },
      { title:'NCERT Class 12 Mathematics Part I', board:'CBSE', classLevel:'12', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?lemh1=0-6', yearOrEdition:'2024', tags:['ncert','maths','board'] },
      { title:'NCERT Class 12 Biology', board:'CBSE', classLevel:'12', subject:'Biology', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?lebo1=0-16', yearOrEdition:'2024', tags:['ncert','biology','board'] },
      { title:'CBSE Class 10 Question Papers 2024', board:'CBSE', classLevel:'10', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://cbse.gov.in/cbsenew/question-paper.html', yearOrEdition:'2024', tags:['cbse','board','pyq'] },
      { title:'CBSE Class 12 Question Papers 2024', board:'CBSE', classLevel:'12', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://cbse.gov.in/cbsenew/question-paper.html', yearOrEdition:'2024', tags:['cbse','board','pyq'] },
      { title:'CBSE Sample Papers 2024-25', board:'CBSE', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://cbseacademic.nic.in/SQP_CLASSXII_2024-25.html', yearOrEdition:'2024-25', tags:['cbse','sample'] },
      { title:'CBSE Syllabus 2024-25', board:'CBSE', classLevel:null, subject:null, contentType:'SYLLABUS', externalUrl:'https://cbseacademic.nic.in/Curriculum_2024-25.html', yearOrEdition:'2024-25', tags:['cbse','syllabus'] },
      { title:'ICSE Specimen Papers 2025', board:'ICSE', classLevel:'10', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://www.cisce.org/specimen-question-papers.aspx', yearOrEdition:'2025', tags:['icse','specimen'] },
      { title:'ISC Specimen Papers 2025', board:'ICSE', classLevel:'12', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://www.cisce.org/specimen-question-papers.aspx', yearOrEdition:'2025', tags:['isc','specimen'] },
      { title:'RBSE Textbooks Rajasthan', board:'RBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://rajeduboard.rajasthan.gov.in/', yearOrEdition:'2024', tags:['rbse','rajasthan'] },
      { title:'RBSE Old Question Papers', board:'RBSE', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://rajeduboard.rajasthan.gov.in/', yearOrEdition:'2024', tags:['rbse','pyq'] },
      { title:'Maharashtra SSC Board Resources', board:'MH_SSC', classLevel:'10', subject:null, contentType:'TEXTBOOK', externalUrl:'https://www.mahahsscboard.in/', yearOrEdition:'2024', tags:['maharashtra','ssc'] },
      { title:'Maharashtra HSC Board Resources', board:'MH_HSC', classLevel:'12', subject:null, contentType:'TEXTBOOK', externalUrl:'https://www.mahahsscboard.in/', yearOrEdition:'2024', tags:['maharashtra','hsc'] },
      { title:'UP Board Textbooks and Papers', board:'UPMSP', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://upmsp.edu.in/', yearOrEdition:'2024', tags:['up','upmsp'] },
      { title:'UP Board Previous Year Papers', board:'UPMSP', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://upmsp.edu.in/', yearOrEdition:'2024', tags:['up','pyq'] },
      { title:'West Bengal Board WBBSE Resources', board:'WBBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://wbbse.wb.gov.in/', yearOrEdition:'2024', tags:['wb','wbbse'] },
      { title:'Bihar Board BSEB Resources', board:'BSEB', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://biharboardonline.com/', yearOrEdition:'2024', tags:['bihar','bseb'] },
      { title:'Bihar Board BSEB Previous Papers', board:'BSEB', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://biharboardonline.com/', yearOrEdition:'2024', tags:['bihar','pyq'] },
      { title:'Gujarat Board GSEB Resources', board:'GSEB', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://gseb.org/', yearOrEdition:'2024', tags:['gseb','gujarat'] },
      { title:'HP Board HPBOSE Resources', board:'HPBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://www.hpbose.org/', yearOrEdition:'2024', tags:['hp','hpbose'] },
      { title:'Punjab Board PSEB Resources', board:'PSEB', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://pseb.ac.in/', yearOrEdition:'2024', tags:['punjab','pseb'] },
      { title:'MP Board MPBSE Resources', board:'MPBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://mpbse.nic.in/', yearOrEdition:'2024', tags:['mp','mpbse'] },
      { title:'NCERT Solutions and Study Material', board:'CBSE', classLevel:null, subject:null, contentType:'SOLUTION', externalUrl:'https://ncert.nic.in/', yearOrEdition:'2024', tags:['ncert','solutions'] },
      { title:'CBSE Official Website', board:'CBSE', classLevel:null, subject:null, contentType:'SYLLABUS', externalUrl:'https://cbse.gov.in/', yearOrEdition:'2024-25', tags:['cbse'] },
    ];
    let inserted = 0, skipped = 0;
    for (const s of seeds) {
      const key = Buffer.from(`${s.title}||${s.board}||${s.contentType}`).toString('base64').slice(0, 25).replace(/[^a-zA-Z0-9]/g, 'x');
      try {
        await this.prisma.libraryMaterial.upsert({
          where: { id: key },
          create: { id: key, uploadedBy, instituteId: null, isApproved: true, viewCount: 0, ...s },
          update: { externalUrl: s.externalUrl, isApproved: true },
        });
        inserted++;
      } catch { skipped++; }
    }
    return { migrated, inserted, skipped };
  }
}
