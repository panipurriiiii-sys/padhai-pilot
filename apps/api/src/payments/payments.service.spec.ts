import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PaymentsService } from './payments.service.js';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';

describe('PaymentsService - Razorpay Standard Checkout', () => {
  let service: PaymentsService;
  const mockKeyId = 'rzp_test_TxwR5OYFQBCDbY';
  const mockKeySecret = 'vGxHSnZ3p5Qrw1eT6iJobT9D';

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;
    service = new PaymentsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createOrder', () => {
    it('should reject amount less than 100 paise (1 INR)', async () => {
      await expect(service.createOrder({ amount: 50 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder({ amount: 99 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid non-number amounts', async () => {
      await expect(service.createOrder({ amount: NaN })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create an order with valid parameters', async () => {
      const mockOrder = {
        id: 'order_test_12345',
        amount: 50000,
        currency: 'INR',
        receipt: 'rcpt_001',
      };

      // Mock razorpay instance orders.create
      (service as any).razorpayInstance = {
        orders: {
          create: vi.fn().mockResolvedValue(mockOrder),
        },
      };

      const result = await service.createOrder({
        amount: 50000,
        currency: 'INR',
        receipt: 'rcpt_001',
      });

      expect(result).toEqual({
        order_id: 'order_test_12345',
        amount: 50000,
        currency: 'INR',
        receipt: 'rcpt_001',
      });
    });

    it('should fail with UnauthorizedException if credentials are missing', async () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
      const unauthService = new PaymentsService();

      await expect(unauthService.createOrder({ amount: 50000 })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyPayment', () => {
    const testOrderId = 'order_EKwxwAgItmmXdp';
    const testPaymentId = 'pay_29MoEhabDOHen7';

    it('should verify payment signature successfully when valid', async () => {
      // Generate genuine HMAC-SHA256 signature
      const validSignature = crypto
        .createHmac('sha256', mockKeySecret)
        .update(`${testOrderId}|${testPaymentId}`)
        .digest('hex');

      const result = await service.verifyPayment({
        razorpay_order_id: testOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSignature,
      });

      expect(result.success).toBe(true);
      expect(result.order_id).toBe(testOrderId);
      expect(result.payment_id).toBe(testPaymentId);
    });

    it('should reject payment verification when signature is invalid (mismatch)', async () => {
      await expect(
        service.verifyPayment({
          razorpay_order_id: testOrderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: 'invalid_tampered_signature_hex_value_1234567890abcdef',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when required fields are missing', async () => {
      await expect(
        service.verifyPayment({
          razorpay_order_id: testOrderId,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.verifyPayment({
          razorpay_payment_id: testPaymentId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('upgradeInstitutePlan', () => {
    it('should reject invalid subscription plan', async () => {
      await expect(
        service.upgradeInstitutePlan('inst_test', 'SUPER_TIER_INVALID'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update institute plan in database when prisma is present', async () => {
      const mockPrisma = {
        institute: {
          update: vi.fn().mockResolvedValue({ id: 'inst_test', plan: 'GROWTH' }),
        },
      };
      const mockRedis = {
        invalidateTenant: vi.fn().mockResolvedValue(true),
      };
      const svc = new PaymentsService(mockPrisma as any, mockRedis as any);
      const res = await svc.upgradeInstitutePlan('inst_test', 'GROWTH');
      expect(res.success).toBe(true);
      expect(res.plan).toBe('GROWTH');
      expect(mockPrisma.institute.update).toHaveBeenCalledWith({
        where: { id: 'inst_test' },
        data: { plan: 'GROWTH', status: 'ACTIVE', isActive: true },
      });
      expect(mockRedis.invalidateTenant).toHaveBeenCalledWith('inst_test');
    });
  });
});

