import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

describe('AuthService Lifecycle & Security', () => {
  let authService: AuthService;
  let redisService: RedisService;

  beforeEach(() => {
    const prisma = new PrismaService();
    redisService = new RedisService();
    redisService.onModuleInit();
    authService = new AuthService(prisma, redisService);
  });

  it('should authenticate demo faculty with password123', async () => {
    const res = await authService.validateAndLogin('teacher@padhaipilot.com', 'password123');
    expect(res.user).toBeDefined();
    expect(res.user.role).toBe('TEACHER');
    expect(res.token).toBeDefined();
  });

  it('should reject invalid credentials with UnauthorizedException', async () => {
    await expect(
      authService.validateAndLogin('teacher@padhaipilot.com', 'wrongpassword'),
    ).rejects.toThrow();
  });

  it('should register a new teacher account and issue a valid JWT token', async () => {
    const uniqueEmail = `teacher_${Date.now()}@apexacademy.edu`;
    const res = await authService.registerTeacher({
      fullName: 'Dr. Sunita Rao',
      email: uniqueEmail,
      password: 'securePassword99',
      subject: 'Organic Chemistry',
    });

    expect(res.user.email).toBe(uniqueEmail);
    expect(res.user.fullName).toBe('Dr. Sunita Rao');
    expect(res.token).toBeDefined();

    // Verify newly registered user can log in
    const loginRes = await authService.validateAndLogin(uniqueEmail, 'securePassword99');
    expect(loginRes.user.fullName).toBe('Dr. Sunita Rao');
  });

  it('should prevent duplicate email registration', async () => {
    await expect(
      authService.registerTeacher({
        fullName: 'Duplicate Prof',
        email: 'teacher@padhaipilot.com',
        password: 'password123',
      }),
    ).rejects.toThrow();
  });

  it('should execute forgot password, issue token, and reset password successfully', async () => {
    const resetReq = await authService.requestPasswordReset('teacher@padhaipilot.com');
    expect(resetReq.success).toBe(true);
    expect(resetReq.debugToken).toBeDefined();

    // Reset password with token
    const token = resetReq.debugToken!;
    const resetRes = await authService.resetPassword(token, 'newSecretPassword2026');
    expect(resetRes.success).toBe(true);

    // Verify login with new password works
    const newLogin = await authService.validateAndLogin('teacher@padhaipilot.com', 'newSecretPassword2026');
    expect(newLogin.user).toBeDefined();

    // Verify token cannot be reused
    await expect(
      authService.resetPassword(token, 'anotherPassword'),
    ).rejects.toThrow();
  });
});

