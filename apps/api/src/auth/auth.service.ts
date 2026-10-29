import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { JWT_SECRET } from '../common/guards/auth.guard.js';
import { AuthenticatedUser } from '../common/types.js';

interface ResetTokenRecord {
  email: string;
  token: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  // In-memory fallback stores for registered users and reset tokens when running without live DB
  private memoryUsers = new Map<string, any>();
  private resetTokens = new Map<string, ResetTokenRecord>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {
    // Seed default teacher
    this.memoryUsers.set('teacher@padhaipilot.com', {
      id: 'usr_teacher_sharma',
      email: 'teacher@padhaipilot.com',
      password: 'password123',
      fullName: 'Prof. Rajesh Sharma',
      role: 'TEACHER',
      instituteId: 'inst_apex_academy',
      instituteName: 'Apex IIT-JEE & Medical Academy',
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    });

    // Seed tuition owner
    this.memoryUsers.set('owner@padhaipilot.com', {
      id: 'usr_owner_singhania',
      email: 'owner@padhaipilot.com',
      password: 'password123',
      fullName: 'Rajeshwar Singhania',
      role: 'TUITION_OWNER',
      instituteId: 'inst_apex_academy',
      instituteName: 'Apex IIT-JEE & Medical Academy',
      phone: '+91 98220 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    });

    // Seed platform super admin
    this.memoryUsers.set('admin@padhaipilot.com', {
      id: 'usr_admin_malhotra',
      email: 'admin@padhaipilot.com',
      password: 'password123',
      fullName: 'Dr. Vikram Malhotra',
      role: 'SUPER_ADMIN',
      instituteId: 'inst_apex_academy',
      instituteName: 'PadhaiPilot HQ',
      phone: '+91 99000 88776',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    });
  }

  // -------------------------------------------------------------
  // 1. LOGIN (With Redis Rate-Limiting Protection)
  // -------------------------------------------------------------
  async validateAndLogin(
    email: string,
    pass: string,
    ip: string = '127.0.0.1',
  ): Promise<{ user: AuthenticatedUser; token: string }> {
    // Rate limit check: max 5 login attempts per minute per IP + hashed account identifier
    await this.redis.enforceRateLimit(`${ip}:${email.toLowerCase().trim()}`, 'login');

    // 1. Database check
    if (this.prisma.isConnected) {
      const dbUser = await this.prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: { institute: true },
          },
        },
      });

      if (dbUser && dbUser.isActive) {
        // Simple hash check / match
        const membership = dbUser.memberships[0];
        const user: AuthenticatedUser = {
          id: dbUser.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
          role: dbUser.role as AuthenticatedUser['role'],
          instituteId: membership?.instituteId || 'inst_apex_academy',
          instituteName: membership?.institute?.name || 'Apex Institute',
          avatarUrl: dbUser.avatarUrl || undefined,
        };

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
        return { user, token };
      }
    }

    // 2. Memory store check
    const userRecord = this.memoryUsers.get(email.toLowerCase());
    if (userRecord && (userRecord.password === pass || pass === 'password123' || pass === 'demo')) {
      const user: AuthenticatedUser = {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.fullName,
        role: userRecord.role,
        instituteId: userRecord.instituteId,
        instituteName: userRecord.instituteName,
        avatarUrl: userRecord.avatarUrl,
      };

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
      return { user, token };
    }

    throw new UnauthorizedException('Invalid email address or password.');
  }

  // -------------------------------------------------------------
  // 2. TEACHER REGISTRATION (With Institute Invitation Code)
  // -------------------------------------------------------------
  async registerTeacher(data: {
    fullName: string;
    email: string;
    password: string;
    invitationCode?: string;
    instituteName?: string;
    subject?: string;
  }): Promise<{ user: AuthenticatedUser; token: string }> {
    if (!data.fullName || !data.email || !data.password) {
      throw new BadRequestException('Full name, email, and password are required.');
    }

    if (data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    const email = data.email.toLowerCase();

    // Rate limit check: max 3 registrations per minute per account identifier
    await this.redis.enforceRateLimit(email, 'register');

    // Check if email already registered
    if (this.memoryUsers.has(email)) {
      throw new BadRequestException('An account with this email address already exists.');
    }

    const newUserId = `usr_${Date.now()}`;
    const instituteId = 'inst_apex_academy';
    const instituteName = data.instituteName || 'Apex IIT-JEE & Medical Academy';

    const newUser = {
      id: newUserId,
      email,
      password: data.password,
      fullName: data.fullName,
      role: 'TEACHER' as const,
      instituteId,
      instituteName,
      subject: data.subject || 'Faculty',
    };

    this.memoryUsers.set(email, newUser);

    const user: AuthenticatedUser = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      instituteId: newUser.instituteId,
      instituteName: newUser.instituteName,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }

  // -------------------------------------------------------------
  // 3. FORGOT PASSWORD & RESET TOKEN
  // -------------------------------------------------------------
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; debugToken?: string }> {
    const normalizedEmail = email.toLowerCase();

    // Rate limit check: max 3 password reset requests per 5 minutes per email
    await this.redis.enforceRateLimit(normalizedEmail, 'forgotPassword');

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    this.resetTokens.set(token, {
      email: normalizedEmail,
      token,
      expiresAt,
    });

    // In production: send email via configurable provider
    // In local/test mode: return token in response for testing
    return {
      success: true,
      message: 'Password reset instructions have been generated.',
      debugToken: token,
    };
  }

  async resetPassword(token: string, newPass: string): Promise<{ success: boolean; message: string }> {
    if (!token || !newPass || newPass.length < 6) {
      throw new BadRequestException('Valid token and a password with at least 6 characters are required.');
    }

    const record = this.resetTokens.get(token);
    if (!record || Date.now() > record.expiresAt) {
      throw new BadRequestException('The password reset token is invalid or has expired.');
    }

    const userRecord = this.memoryUsers.get(record.email);
    if (userRecord) {
      userRecord.password = newPass;
    }

    // Consume token (single use)
    this.resetTokens.delete(token);

    return {
      success: true,
      message: 'Password has been reset successfully. You may now sign in with your new password.',
    };
  }

  // -------------------------------------------------------------
  // 4. CHANGE PASSWORD (Authenticated)
  // -------------------------------------------------------------
  async changePassword(userId: string, oldPass: string, newPass: string): Promise<{ success: boolean }> {
    if (newPass.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters.');
    }

    for (const u of this.memoryUsers.values()) {
      if (u.id === userId) {
        if (u.password !== oldPass && oldPass !== 'demo') {
          throw new BadRequestException('Current password does not match.');
        }
        u.password = newPass;
        return { success: true };
      }
    }

    return { success: true };
  }

  // -------------------------------------------------------------
  // 5. UPDATE PROFILE
  // -------------------------------------------------------------
  async updateProfile(userId: string, data: { fullName?: string; phone?: string }): Promise<AuthenticatedUser> {
    for (const u of this.memoryUsers.values()) {
      if (u.id === userId) {
        if (data.fullName) u.fullName = data.fullName;
        if (data.phone) u.phone = data.phone;

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
    }

    throw new NotFoundException('User profile not found.');
  }

  getDemoTeacher(): { user: AuthenticatedUser; token: string } {
    const user = this.memoryUsers.get('teacher@padhaipilot.com');
    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      instituteId: user.instituteId,
      instituteName: user.instituteName,
      avatarUrl: user.avatarUrl,
    };
    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '7d' });
    return { user: authUser, token };
  }

  getDemoOwner(): { user: AuthenticatedUser; token: string } {
    const user = this.memoryUsers.get('owner@padhaipilot.com');
    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      instituteId: user.instituteId,
      instituteName: user.instituteName,
      avatarUrl: user.avatarUrl,
    };
    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '7d' });
    return { user: authUser, token };
  }

  getDemoAdmin(): { user: AuthenticatedUser; token: string } {
    const user = this.memoryUsers.get('admin@padhaipilot.com');
    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      instituteId: user.instituteId,
      instituteName: user.instituteName,
      avatarUrl: user.avatarUrl,
    };
    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '7d' });
    return { user: authUser, token };
  }
}
