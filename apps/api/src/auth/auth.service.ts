import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { AuthenticatedUser } from '../common/types.js';
import { getJwtSecret, isDemoMode, JWT_EXPIRES_IN } from '../common/security/runtime.js';
import {
  burnPasswordCheck,
  hashPassword,
  passwordPolicyError,
  verifyPassword,
} from '../common/security/password.js';

const PLATFORM_INSTITUTE_ID = 'inst_padhaipilot_platform';
const PLATFORM_INSTITUTE_NAME = 'PadhaiPilot Platform Control Plane';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

type Role = AuthenticatedUser['role'];

interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  instituteId: string;
  instituteName: string;
  phone?: string;
  avatarUrl?: string;
}

interface DbUserWithMemberships {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  passwordHash: string;
  tokenVersion?: number;
  memberships: Array<{
    instituteId: string;
    role: string;
    status: string;
    institute: { name: string; isActive: boolean };
  }>;
}

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  // Demo-mode only (never populated in production): seeded demo accounts and non-DB fallbacks.
  private memoryUsers = new Map<string, MemoryUser>();
  private resetTokens = new Map<string, { email: string; expiresAt: number }>();
  private readonly demoReady: Promise<void>;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {
    this.demoReady = isDemoMode() ? this.seedDemoUsers() : Promise.resolve();
  }

  private async seedDemoUsers(): Promise<void> {
    const passwordHash = await hashPassword('password123');
    const apex = { instituteId: 'inst_apex_academy', instituteName: 'Apex IIT-JEE & Medical Academy' };
    const seed: MemoryUser[] = [
      { id: 'usr_teacher_sharma', email: 'teacher@padhaipilot.com', passwordHash, fullName: 'Prof. Rajesh Sharma', role: 'TEACHER', ...apex, phone: '+91 98765 43210' },
      { id: 'usr_owner_singhania', email: 'owner@padhaipilot.com', passwordHash, fullName: 'Rajeshwar Singhania', role: 'TUITION_OWNER', ...apex, phone: '+91 98220 11223' },
      { id: 'usr_admin_malhotra', email: 'super@padhaipilot.com', passwordHash, fullName: 'Dr. Vikram Malhotra (Platform Owner)', role: 'SUPER_ADMIN', instituteId: PLATFORM_INSTITUTE_ID, instituteName: PLATFORM_INSTITUTE_NAME, phone: '+91 99000 88776' },
      { id: 'std_01', email: 'student@padhaipilot.com', passwordHash, fullName: 'Aarav Patel', role: 'STUDENT', ...apex, phone: '+91 98111 22334' },
    ];
    for (const u of seed) this.memoryUsers.set(u.email, u);
    this.memoryUsers.set('admin@padhaipilot.com', { ...seed[2], email: 'admin@padhaipilot.com' });
  }

  /** Fail closed: without a database, only demo mode may fall back to the in-memory store. */
  private useDatabase(): boolean {
    if (this.prisma.isConnected) return true;
    if (isDemoMode()) return false;
    throw new ServiceUnavailableException('The service is temporarily unavailable. Please try again shortly.');
  }

  private issue(user: AuthenticatedUser): { user: AuthenticatedUser; token: string } {
    const token = jwt.sign(user, getJwtSecret(), {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
    return { user, token };
  }

  private toAuthUser(u: DbUserWithMemberships): AuthenticatedUser {
    if (u.role === 'SUPER_ADMIN') {
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: 'SUPER_ADMIN',
        instituteId: PLATFORM_INSTITUTE_ID,
        instituteName: PLATFORM_INSTITUTE_NAME,
        avatarUrl: u.avatarUrl || undefined,
        tv: u.tokenVersion ?? 0,
      };
    }
    const membership = u.memberships.find((m) => m.status === 'ACTIVE' && m.institute.isActive);
    if (!membership) {
      throw new ForbiddenException('Your account has no active institute membership.');
    }
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: membership.role as Role,
      instituteId: membership.instituteId,
      instituteName: membership.institute.name,
      avatarUrl: u.avatarUrl || undefined,
      tv: u.tokenVersion ?? 0,
    };
  }

  private fromMemory(u: MemoryUser): AuthenticatedUser {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      instituteId: u.instituteId,
      instituteName: u.instituteName,
      avatarUrl: u.avatarUrl,
    };
  }

  // -------------------------------------------------------------
  // 1. LOGIN
  // -------------------------------------------------------------
  async validateAndLogin(
    email: string,
    pass: string,
    ip: string = '127.0.0.1',
  ): Promise<{ user: AuthenticatedUser; token: string }> {
    if (typeof email !== 'string' || typeof pass !== 'string' || !email || !pass) {
      throw new BadRequestException('Email and password are required.');
    }
    const normalized = email.toLowerCase().trim();
    // Max attempts per minute per IP + account identifier
    await this.redis.enforceRateLimit(`${ip}:${normalized}`, 'login');
    await this.demoReady;

    if (this.useDatabase()) {
      const dbUser = (await this.prisma.user.findUnique({
        where: { email: normalized },
        include: { memberships: { include: { institute: true } } },
      })) as DbUserWithMemberships | null;

      const valid = dbUser ? await verifyPassword(pass, dbUser.passwordHash) : await burnPasswordCheck(pass);
      if (!dbUser || !valid || !dbUser.isActive) {
        throw new UnauthorizedException('Invalid email address or password.');
      }
      return this.issue(this.toAuthUser(dbUser));
    }

    const record = this.memoryUsers.get(normalized);
    const valid = record ? await verifyPassword(pass, record.passwordHash) : await burnPasswordCheck(pass);
    if (!record || !valid) {
      throw new UnauthorizedException('Invalid email address or password.');
    }
    return this.issue(this.fromMemory(record));
  }

  // -------------------------------------------------------------
  // 2. TUITION OWNER / FACULTY REGISTRATION
  // Public self-registration can only create a new tuition (TUITION_OWNER). Faculty accounts must be
  // provisioned through an owner invitation, so public sign-up can never join an existing institute
  // as staff. SUPER_ADMIN can never be created here (see scripts/bootstrap-super-admin).
  // -------------------------------------------------------------
  async registerTeacher(data: {
    fullName: string;
    email: string;
    password: string;
    invitationCode?: string;
    instituteName?: string;
    subject?: string;
    role?: 'TEACHER' | 'TUITION_OWNER';
  }): Promise<{ user: AuthenticatedUser; token: string }> {
    if (!data?.fullName?.trim() || !data?.email?.trim() || !data?.password) {
      throw new BadRequestException('Full name, email, and password are required.');
    }
    const policyError = passwordPolicyError(data.password);
    if (policyError) throw new BadRequestException(policyError);

    const wantsOwner = data.role === 'TUITION_OWNER';
    if (!wantsOwner && !isDemoMode()) {
      throw new ForbiddenException(
        'Faculty accounts are created from an invitation sent by your tuition owner. Ask your owner for an invitation.',
      );
    }

    const email = data.email.toLowerCase().trim();
    await this.redis.enforceRateLimit(email, 'register');
    await this.demoReady;
    const role: Role = wantsOwner ? 'TUITION_OWNER' : 'TEACHER';
    const passwordHash = await hashPassword(data.password);

    if (this.useDatabase()) {
      if (await this.prisma.user.findUnique({ where: { email } })) {
        throw new BadRequestException('An account with this email address already exists.');
      }
      const instName = data.instituteName?.trim() || 'PadhaiPilot Academy';
      const cleanSlug = instName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'academy';
      const slug = `${cleanSlug}-${crypto.randomBytes(3).toString('hex')}`;

      const { institute, newUser } = await this.prisma.$transaction(async (tx) => {
        const institute = await tx.institute.create({ data: { name: instName, slug, plan: 'GROWTH' } });
        const newUser = await tx.user.create({
          data: {
            email,
            fullName: data.fullName.trim(),
            passwordHash,
            role,
            memberships: { create: { instituteId: institute.id, role, status: 'ACTIVE' } },
          },
        });
        if (role === 'TUITION_OWNER') {
          await tx.institute.update({ where: { id: institute.id }, data: { ownerId: newUser.id } });
        }
        return { institute, newUser };
      });

      return this.issue({
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role,
        instituteId: institute.id,
        instituteName: institute.name,
      });
    }

    if (this.memoryUsers.has(email)) {
      throw new BadRequestException('An account with this email address already exists.');
    }
    const record: MemoryUser = {
      id: `usr_${crypto.randomBytes(6).toString('hex')}`,
      email,
      passwordHash,
      fullName: data.fullName.trim(),
      role,
      instituteId: 'inst_default',
      instituteName: data.instituteName?.trim() || 'PadhaiPilot Academy',
    };
    this.memoryUsers.set(email, record);
    return this.issue(this.fromMemory(record));
  }

  // -------------------------------------------------------------
  // 3. STUDENT REGISTRATION (optionally redeeming an invitation code atomically)
  // -------------------------------------------------------------
  async registerStudent(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    invitationCode?: string;
  }): Promise<{ user: AuthenticatedUser; token: string }> {
    if (!data?.fullName?.trim() || !data?.email?.trim() || !data?.password) {
      throw new BadRequestException('Full name, email, and password are required.');
    }
    const policyError = passwordPolicyError(data.password);
    if (policyError) throw new BadRequestException(policyError);

    const email = data.email.toLowerCase().trim();
    await this.redis.enforceRateLimit(email, 'register');
    await this.demoReady;
    const passwordHash = await hashPassword(data.password);
    const code = data.invitationCode?.trim();

    if (this.useDatabase()) {
      if (await this.prisma.user.findUnique({ where: { email } })) {
        throw new BadRequestException('An account with this email address already exists.');
      }

      const invalidCode = () =>
        new BadRequestException('The provided invitation code is invalid, expired, or exhausted.');

      return this.prisma
        .$transaction(async (tx) => {
          let instituteId = '';
          let instituteName = '';
          let batchId: string | undefined;

          if (code) {
            const inv = await tx.invitationCode.findUnique({ where: { code }, include: { institute: true } });
            if (!inv || !inv.institute.isActive) throw invalidCode();
            // Atomic claim: concurrent redemptions cannot exceed maxUses or revive revoked/expired codes.
            const claimed = await tx.invitationCode.updateMany({
              where: { id: inv.id, isRevoked: false, expiresAt: { gt: new Date() }, usedCount: { lt: inv.maxUses } },
              data: { usedCount: { increment: 1 } },
            });
            if (claimed.count !== 1) throw invalidCode();
            instituteId = inv.instituteId;
            instituteName = inv.institute.name;
            batchId = inv.batchId || undefined;
          }

          const newUser = await tx.user.create({
            data: {
              email,
              fullName: data.fullName.trim(),
              phone: data.phone?.trim() || null,
              passwordHash,
              role: 'STUDENT',
              ...(instituteId
                ? { memberships: { create: { instituteId, role: 'STUDENT', status: 'ACTIVE' } } }
                : {}),
              ...(instituteId && batchId
                ? {
                    enrollments: {
                      create: {
                        instituteId,
                        batchId,
                        rollNumber: `STU-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
                        status: 'ACTIVE',
                      },
                    },
                  }
                : {}),
            },
          });

          return this.issue({
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: 'STUDENT',
            instituteId,
            instituteName,
          });
        })
        .catch((err: unknown) => {
          if ((err as { code?: string })?.code === 'P2002') {
            throw new BadRequestException('An account with this email address already exists.');
          }
          throw err;
        });
    }

    if (this.memoryUsers.has(email)) {
      throw new BadRequestException('An account with this email address already exists.');
    }
    const record: MemoryUser = {
      id: `usr_std_${crypto.randomBytes(6).toString('hex')}`,
      email,
      passwordHash,
      fullName: data.fullName.trim(),
      phone: data.phone,
      role: 'STUDENT',
      instituteId: 'inst_apex_academy',
      instituteName: 'Apex IIT-JEE & Medical Academy',
    };
    this.memoryUsers.set(email, record);
    return this.issue(this.fromMemory(record));
  }

  // -------------------------------------------------------------
  // 4. FORGOT / RESET PASSWORD
  // The response is identical whether or not the account exists. No email provider is wired yet, so
  // outside demo mode the token is created but cannot be delivered (see docs/PROJECT_AUDIT.md).
  // -------------------------------------------------------------
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; debugToken?: string }> {
    const message = 'If an account exists for that email, password reset instructions have been sent.';
    if (typeof email !== 'string' || !email.trim()) throw new BadRequestException('Email is required.');
    const normalized = email.toLowerCase().trim();
    await this.redis.enforceRateLimit(normalized, 'forgotPassword');
    await this.demoReady;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
    let accountExists = false;

    if (this.useDatabase()) {
      const result = await this.prisma.user.updateMany({
        where: { email: normalized, isActive: true },
        data: { resetPasswordToken: sha256(token), resetPasswordExpiry: new Date(expiresAt) },
      });
      accountExists = result.count > 0;
    } else if (this.memoryUsers.has(normalized)) {
      this.resetTokens.set(sha256(token), { email: normalized, expiresAt });
      accountExists = true;
    }

    // TODO(email-provider): deliver `token` by email once a provider is configured.
    return { success: true, message, ...(isDemoMode() && accountExists ? { debugToken: token } : {}) };
  }

  async resetPassword(token: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const policyError = passwordPolicyError(newPass);
    if (typeof token !== 'string' || !token || policyError) {
      throw new BadRequestException(policyError || 'A valid reset token is required.');
    }
    await this.demoReady;
    const invalid = () => new BadRequestException('The password reset token is invalid or has expired.');
    const tokenHash = sha256(token);
    const passwordHash = await hashPassword(newPass);

    if (this.useDatabase()) {
      // Single-use: the token is consumed in the same statement that checks it.
      const result = await this.prisma.user.updateMany({
        where: { resetPasswordToken: tokenHash, resetPasswordExpiry: { gt: new Date() } },
        data: { passwordHash, resetPasswordToken: null, resetPasswordExpiry: null, tokenVersion: { increment: 1 } },
      });
      if (result.count !== 1) throw invalid();
    } else {
      const record = this.resetTokens.get(tokenHash);
      if (!record || Date.now() > record.expiresAt) throw invalid();
      const user = this.memoryUsers.get(record.email);
      if (user) user.passwordHash = passwordHash;
      this.resetTokens.delete(tokenHash);
    }

    return {
      success: true,
      message: 'Password has been reset successfully. You may now sign in with your new password.',
    };
  }

  // -------------------------------------------------------------
  // 5. CHANGE PASSWORD (authenticated)
  // -------------------------------------------------------------
  async changePassword(
    userId: string,
    oldPass: string,
    newPass: string,
  ): Promise<{ success: boolean; session?: { user: AuthenticatedUser; token: string } }> {
    const policyError = passwordPolicyError(newPass);
    if (policyError) throw new BadRequestException(policyError);
    if (typeof oldPass !== 'string' || !oldPass) throw new BadRequestException('Current password is required.');
    await this.demoReady;

    if (this.useDatabase()) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !(await verifyPassword(oldPass, user.passwordHash))) {
        throw new BadRequestException('Current password does not match.');
      }
      // Bumping tokenVersion signs every other device out; the caller gets a fresh token below.
      const updated = (await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(newPass), tokenVersion: { increment: 1 } },
        include: { memberships: { include: { institute: true } } },
      })) as DbUserWithMemberships;
      return { success: true, session: this.issue(this.toAuthUser(updated)) };
    }

    const record = [...this.memoryUsers.values()].find((u) => u.id === userId);
    if (!record || !(await verifyPassword(oldPass, record.passwordHash))) {
      throw new BadRequestException('Current password does not match.');
    }
    const passwordHash = await hashPassword(newPass);
    for (const u of this.memoryUsers.values()) if (u.id === userId) u.passwordHash = passwordHash;
    return { success: true };
  }

  // -------------------------------------------------------------
  // 6. UPDATE PROFILE
  // -------------------------------------------------------------
  async updateProfile(userId: string, data: { fullName?: string; phone?: string }): Promise<AuthenticatedUser> {
    await this.demoReady;
    const fullName = typeof data?.fullName === 'string' ? data.fullName.trim() : undefined;
    const phone = typeof data?.phone === 'string' ? data.phone.trim() : undefined;

    if (this.useDatabase()) {
      const exists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!exists) throw new NotFoundException('User profile not found.');
      const updated = (await this.prisma.user.update({
        where: { id: userId },
        data: { ...(fullName ? { fullName } : {}), ...(phone ? { phone } : {}) },
        include: { memberships: { include: { institute: true } } },
      })) as DbUserWithMemberships;
      return this.toAuthUser(updated);
    }

    const matches = [...this.memoryUsers.values()].filter((u) => u.id === userId);
    if (matches.length === 0) throw new NotFoundException('User profile not found.');
    for (const u of matches) {
      if (fullName) u.fullName = fullName;
      if (phone) u.phone = phone;
    }
    return this.fromMemory(matches[0]);
  }

  // -------------------------------------------------------------
  // DEMO LOGINS (non-production only; the controller also 404s these routes in production)
  // -------------------------------------------------------------
  private async demoLogin(email: string): Promise<{ user: AuthenticatedUser; token: string }> {
    if (!isDemoMode()) throw new NotFoundException();
    await this.demoReady;
    const record = this.memoryUsers.get(email);
    if (!record) throw new NotFoundException();
    return this.issue(this.fromMemory(record));
  }

  getDemoTeacher() { return this.demoLogin('teacher@padhaipilot.com'); }
  getDemoOwner() { return this.demoLogin('owner@padhaipilot.com'); }
  getDemoAdmin() { return this.demoLogin('admin@padhaipilot.com'); }
  getDemoStudent() { return this.demoLogin('student@padhaipilot.com'); }
}
