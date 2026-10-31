import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FacultyInvitationsService } from './faculty-invitations.service.js';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';

describe('FacultyInvitationsService', () => {
  let service: FacultyInvitationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      isConnected: true,
      batch: {
        findMany: vi.fn().mockResolvedValue([{ id: 'btc_1' }]),
      },
      facultyInvitation: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      instituteMembership: {
        upsert: vi.fn(),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      facultyProfile: {
        upsert: vi.fn(),
      },
      batchFaculty: {
        upsert: vi.fn(),
      },
    };
    mockPrisma.$transaction = vi.fn(async (fn: any) => fn(mockPrisma));

    service = new FacultyInvitationsService(mockPrisma);
  });

  describe('createInvitation', () => {
    it('should generate unpredictable token, store tokenHash, and return raw token', async () => {
      mockPrisma.facultyInvitation.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'inv_123',
          ...data,
        });
      });

      const res = await service.createInvitation('inst_apex', 'owner_1', {
        email: 'faculty@example.com',
        designation: 'Senior Math Faculty',
        assignedSubjects: ['Mathematics'],
        batchIds: ['btc_1'],
        expiryDays: 7,
      });

      expect(res.success).toBe(true);
      expect(res.token).toBeDefined();
      expect(typeof res.token).toBe('string');
      expect(res.token.length).toBe(64); // 32 bytes hex = 64 chars

      // Verify tokenHash stored in DB is sha256 of the returned raw token
      const expectedHash = crypto.createHash('sha256').update(res.token).digest('hex');
      expect(mockPrisma.facultyInvitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          instituteId: 'inst_apex',
          email: 'faculty@example.com',
          tokenHash: expectedHash,
          status: 'PENDING',
        }),
      });
    });

    it('should reject invalid email or missing designation', async () => {
      await expect(
        service.createInvitation('inst_apex', 'owner_1', {
          email: 'not-an-email',
          designation: 'Faculty',
          assignedSubjects: [],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createInvitation('inst_apex', 'owner_1', {
          email: 'valid@example.com',
          designation: '',
          assignedSubjects: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('previewInvitation', () => {
    it('should return safe public details for a pending, unexpired invitation', async () => {
      const rawToken = 'testrawtoken123456789012345678901234567890';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.facultyInvitation.findUnique.mockResolvedValue({
        id: 'inv_1',
        instituteId: 'inst_apex',
        email: 'prof@example.com',
        fullName: 'Prof. Sharma',
        tokenHash,
        designation: 'Physics Head',
        assignedSubjects: ['Physics'],
        compensationType: 'FIXED_MONTHLY',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
        institute: {
          id: 'inst_apex',
          name: 'Apex Academy',
          logoUrl: 'https://example.com/logo.png',
          primaryColor: '#1677FF',
        },
      });

      const preview = await service.previewInvitation(rawToken);
      expect(preview.valid).toBe(true);
      expect(preview.instituteName).toBe('Apex Academy');
      expect(preview.email).toBe('prof@example.com');
      expect(preview.designation).toBe('Physics Head');
    });

    it('should throw NotFoundException for unknown or inactive tokens', async () => {
      mockPrisma.facultyInvitation.findUnique.mockResolvedValue(null);
      await expect(service.previewInvitation('invalid_token')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if token is expired', async () => {
      const rawToken = 'expired_token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.facultyInvitation.findUnique.mockResolvedValue({
        id: 'inv_expired',
        tokenHash,
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 10000), // In the past
        institute: { name: 'Apex' },
      });

      await expect(service.previewInvitation(rawToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvitation', () => {
    it('should atomically create user, membership, profile and accept invitation', async () => {
      const rawToken = 'valid_raw_token_for_acceptance_12345678';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.facultyInvitation.findUnique.mockResolvedValue({
        id: 'inv_accept_1',
        instituteId: 'inst_apex',
        email: 'newfaculty@example.com',
        fullName: 'Dr. New Faculty',
        tokenHash,
        designation: 'Chemistry Lecturer',
        assignedSubjects: ['Chemistry'],
        batchIds: ['btc_1'],
        delegatedPermissions: ['MANAGE_ATTENDANCE'],
        compensationType: 'FIXED_MONTHLY',
        baseSalary: 60000,
        hourlyRate: 0,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'usr_new_fac',
        email: 'newfaculty@example.com',
        fullName: 'Dr. New Faculty',
        role: 'FACULTY',
      });

      const res = await service.acceptInvitation({
        token: rawToken,
        password: 'SecurePassword123!',
      });

      expect(res.success).toBe(true);
      expect(res.userId).toBe('usr_new_fac');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.instituteMembership.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            instituteId_userId: {
              instituteId: 'inst_apex',
              userId: 'usr_new_fac',
            },
          },
        }),
      );
      expect(mockPrisma.facultyProfile.upsert).toHaveBeenCalled();
      expect(mockPrisma.facultyInvitation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'inv_accept_1', status: 'PENDING' }),
          data: expect.objectContaining({ status: 'ACCEPTED' }),
        }),
      );
      expect(mockPrisma.facultyProfile.upsert.mock.calls[0][0].where).toEqual({
        instituteId_userId: { instituteId: 'inst_apex', userId: 'usr_new_fac' },
      });
    });

    const pendingInvite = (rawToken: string) => ({
      id: 'inv_2', instituteId: 'inst_apex', email: 'existing@example.com', fullName: 'E', tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
      designation: 'Lecturer', assignedSubjects: [], batchIds: [], delegatedPermissions: [], compensationType: 'FIXED_MONTHLY',
      baseSalary: 0, hourlyRate: 0, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000),
    });

    it('does not let the link holder take over an existing account (password must match, hash untouched)', async () => {
      mockPrisma.facultyInvitation.findUnique.mockResolvedValue(pendingInvite('tok_existing_account_0123456789'));
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u9', email: 'existing@example.com', passwordHash: 'not-a-real-hash', isActive: true });
      await expect(service.acceptInvitation({ token: 'tok_existing_account_0123456789', password: 'SomeOtherPass123!' })).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.instituteMembership.upsert).not.toHaveBeenCalled();
    });

    it('is single use: a lost atomic claim rejects the second acceptance', async () => {
      mockPrisma.facultyInvitation.findUnique.mockResolvedValue(pendingInvite('tok_single_use_0123456789abcdef'));
      mockPrisma.facultyInvitation.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.acceptInvitation({ token: 'tok_single_use_0123456789abcdef', password: 'SecurePassword123!' })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject passwords that do not meet policy', async () => {
      await expect(
        service.acceptInvitation({
          token: 'token',
          password: 'short',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
