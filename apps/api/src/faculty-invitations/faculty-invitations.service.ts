import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertDb } from '../common/db/db.js';
import { hashPassword, passwordPolicyError } from '../common/security/password.js';
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
    const expiryDays = dto.expiryDays || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 3600 * 1000);

    const invitation = await this.db.facultyInvitation.create({
      data: {
        instituteId,
        email: dto.email.toLowerCase().trim(),
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
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    };
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

    const passwordHash = await hashPassword(dto.password);

    const performAccept = async (tx: any) => {
      // 1. User creation or linking
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash,
            fullName: dto.fullName || invitation.fullName || 'Faculty Member',
            role: 'FACULTY',
            instituteId: invitation.instituteId,
            phone: dto.phone || null,
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            role: 'FACULTY',
            ...(dto.fullName ? { fullName: dto.fullName } : {}),
            ...(dto.phone ? { phone: dto.phone } : {}),
          },
        });
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
      const staffId = `FAC-${Date.now().toString().slice(-4)}`;
      await tx.facultyProfile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          instituteId: invitation.instituteId,
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
        for (const batchId of invitation.batchIds) {
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
            },
          });
        }
      }

      // 5. Mark invitation accepted
      await tx.facultyInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedUserId: user.id,
        },
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
