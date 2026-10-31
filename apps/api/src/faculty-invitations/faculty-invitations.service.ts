import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertDb } from '../common/db/db.js';
import { hashPassword, verifyPassword, passwordPolicyError } from '../common/security/password.js';
import type {
  CreateFacultyInvitationDto,
  AcceptFacultyInvitationDto,
} from './dto/faculty-invitation.dto.js';

@Injectable()
export class FacultyInvitationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private get db(): PrismaService {
    assertDb(this.prisma);
    return this.prisma;
  }

  /**
   * Generates a secure, single-use faculty invitation.
   * Stores the SHA-256 hash in the database and returns the raw token to the caller.
   */
  async createInvitation(
    instituteId: string,
    invitedById: string,
    dto: CreateFacultyInvitationDto,
  ) {
    if (!dto.email || !dto.email.includes('@')) {
      throw new BadRequestException('A valid faculty email address is required.');
    }
    if (!dto.designation || !dto.designation.trim()) {
      throw new BadRequestException('Faculty designation is required.');
    }

    // Verify batch ownership if batches provided
    if (dto.batchIds && dto.batchIds.length > 0 && this.db.batch?.findMany) {
      const validBatches = await this.db.batch.findMany({
        where: { id: { in: dto.batchIds }, instituteId },
        select: { id: true },
      });
      if (validBatches.length !== dto.batchIds.length) {
        throw new BadRequestException('One or more specified batch IDs are invalid or belong to another institute.');
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiryDays = Math.min(30, Math.max(1, Math.floor(Number(dto.expiryDays) || 7)));
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 3600 * 1000);

    const email = dto.email.toLowerCase().trim();
    // A new invitation supersedes earlier pending ones for the same person in this institute.
    await this.db.facultyInvitation.updateMany({
      where: { instituteId, email, status: 'PENDING' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedById: invitedById },
    });

    const invitation = await this.db.facultyInvitation.create({
      data: {
        instituteId,
        email,
        fullName: dto.fullName || null,
        tokenHash,
        role: 'FACULTY',
        designation: dto.designation.trim(),
        assignedSubjects: dto.assignedSubjects || [],
        batchIds: dto.batchIds || [],
        delegatedPermissions: dto.delegatedPermissions || [],
        compensationType: dto.compensationType || 'FIXED_MONTHLY',
        baseSalary: dto.baseSalary || 0,
        hourlyRate: dto.hourlyRate || 0,
        status: 'PENDING',
        expiresAt,
        invitedById,
      },
    });

    return {
      success: true,
      invitationId: invitation.id,
      token: rawToken,
      acceptPath: `/join-faculty?token=${rawToken}`,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      deliveryStatus: 'NOT_SENT',
    };
  }

  /** Owner view. Never returns token hashes. */
  async listInvitations(instituteId: string) {
    const rows = await this.db.facultyInvitation.findMany({
      where: { instituteId },
      select: { id: true, email: true, fullName: true, designation: true, status: true, expiresAt: true, createdAt: true, acceptedAt: true, deliveryStatus: true, resendCount: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows;
  }

  async revokeInvitation(instituteId: string, id: string, actorId: string) {
    const res = await this.db.facultyInvitation.updateMany({
      where: { id, instituteId, status: 'PENDING' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedById: actorId },
    });
    if (res.count !== 1) throw new NotFoundException('Pending invitation not found.');
    return { success: true };
  }

  /** Rotates the token (the old link stops working) and extends the expiry. The new raw token is shown once. */
  async resendInvitation(instituteId: string, id: string) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 86_400_000);
    const res = await this.db.facultyInvitation.updateMany({
      where: { id, instituteId, status: 'PENDING' },
      data: { tokenHash, expiresAt, resendCount: { increment: 1 } },
    });
    if (res.count !== 1) throw new NotFoundException('Pending invitation not found.');
    return { success: true, token: rawToken, acceptPath: `/join-faculty?token=${rawToken}`, expiresAt, deliveryStatus: 'NOT_SENT' };
  }

  /**
   * Safe preview of a faculty invitation by raw token (for prospect to verify institute before signing up).
   */
  async previewInvitation(rawToken: string) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new BadRequestException('Invitation token is required.');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const invitation = await this.db.facultyInvitation.findUnique({
      where: { tokenHash },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
      },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException('Invitation not found or is no longer active.');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new BadRequestException('This faculty invitation has expired.');
    }

    return {
      valid: true,
      instituteId: invitation.instituteId,
      instituteName: invitation.institute.name,
      instituteLogo: invitation.institute.logoUrl,
      email: invitation.email,
      fullName: invitation.fullName,
      designation: invitation.designation,
      assignedSubjects: invitation.assignedSubjects,
      compensationType: invitation.compensationType,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Atomically accepts the invitation inside a database transaction:
   * 1. Creates/updates User record with hashed password and FACULTY role
   * 2. Upserts InstituteMembership with ACTIVE status and FACULTY role
   * 3. Creates/updates FacultyProfile
   * 4. Enrolls in assigned BatchFaculty entries
   * 5. Marks invitation as ACCEPTED
   */
  async acceptInvitation(dto: AcceptFacultyInvitationDto) {
    if (!dto.token || typeof dto.token !== 'string') {
      throw new BadRequestException('Invitation token is required.');
    }

    const policyErr = passwordPolicyError(dto.password);
    if (policyErr) {
      throw new BadRequestException(policyErr);
    }

    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const invitation = await this.db.facultyInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException('Invalid or inactive faculty invitation.');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new BadRequestException('This faculty invitation has expired.');
    }

    const performAccept = async (tx: any) => {
      // Atomic single-use claim: only one concurrent request can flip PENDING -> ACCEPTED.
      const claim = await tx.facultyInvitation.updateMany({
        where: { id: invitation.id, status: 'PENDING', expiresAt: { gt: new Date() } },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      if (claim.count !== 1) throw new NotFoundException('Invalid or inactive faculty invitation.');

      let user = await tx.user.findUnique({ where: { email: invitation.email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash: await hashPassword(dto.password),
            fullName: dto.fullName || invitation.fullName || 'Faculty Member',
            role: 'FACULTY',
            phone: dto.phone || null,
          },
        });
      } else {
        // An existing account is never taken over by whoever holds the link: it must prove ownership with its
        // current password, which is left unchanged, and its global role is not modified.
        if (!(await verifyPassword(dto.password, user.passwordHash))) {
          throw new UnauthorizedException('An account with this email already exists. Enter its current password to accept.');
        }
        if (!user.isActive) throw new ForbiddenException('This account is deactivated.');
      }

      const existingMembership = await tx.instituteMembership.findUnique({
        where: { instituteId_userId: { instituteId: invitation.instituteId, userId: user.id } },
        select: { role: true },
      });
      if (existingMembership && !['FACULTY', 'TEACHER'].includes(existingMembership.role)) {
        throw new ForbiddenException('This account already holds a different role in the institute.');
      }

      // 2. Upsert InstituteMembership
      await tx.instituteMembership.upsert({
        where: {
          instituteId_userId: {
            instituteId: invitation.instituteId,
            userId: user.id,
          },
        },
        update: {
          role: 'FACULTY',
          status: 'ACTIVE',
        },
        create: {
          instituteId: invitation.instituteId,
          userId: user.id,
          role: 'FACULTY',
          status: 'ACTIVE',
        },
      });

      // 3. Upsert FacultyProfile
      const staffId = `FAC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      await tx.facultyProfile.upsert({
        where: { instituteId_userId: { instituteId: invitation.instituteId, userId: user.id } },
        update: {
          designation: invitation.designation,
          assignedSubjects: invitation.assignedSubjects,
          delegatedPermissions: invitation.delegatedPermissions,
          compensationType: invitation.compensationType,
          baseSalary: invitation.baseSalary,
          hourlyRate: invitation.hourlyRate,
          employmentStatus: 'ACTIVE',
        },
        create: {
          instituteId: invitation.instituteId,
          userId: user.id,
          staffId,
          designation: invitation.designation,
          assignedSubjects: invitation.assignedSubjects,
          delegatedPermissions: invitation.delegatedPermissions,
          compensationType: invitation.compensationType,
          baseSalary: invitation.baseSalary,
          hourlyRate: invitation.hourlyRate,
          employmentStatus: 'ACTIVE',
        },
      });

      // 4. Assign batch faculty if batches were delegated
      if (invitation.batchIds && invitation.batchIds.length > 0 && tx.batchFaculty?.upsert) {
        const valid = await tx.batch.findMany({ where: { id: { in: invitation.batchIds }, instituteId: invitation.instituteId }, select: { id: true } });
        for (const { id: batchId } of valid) {
          await tx.batchFaculty.upsert({
            where: {
              batchId_facultyId: {
                batchId,
                facultyId: user.id,
              },
            },
            update: {},
            create: {
              batchId,
              facultyId: user.id,
              instituteId: invitation.instituteId,
              assignedBy: invitation.invitedById,
            },
          });
        }
      }

      // 5. Mark invitation accepted
      await tx.facultyInvitation.update({
        where: { id: invitation.id },
        data: { acceptedUserId: user.id },
      });

      return {
        success: true,
        message: 'Faculty invitation accepted successfully.',
        userId: user.id,
        instituteId: invitation.instituteId,
      };
    };

    return this.db.$transaction ? this.db.$transaction(performAccept) : performAccept(this.db);
  }
}
