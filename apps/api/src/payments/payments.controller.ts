import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, Query, UseGuards, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
  PaymentsService,
  CreateOrderDto,
  VerifyPaymentDto,
} from './payments.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';

export class UpgradePlanDto {
  plan!: string;
  instituteId?: string;
}

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * STEP 1: BACKEND - Create Order (subscription upgrade flow)
   * Endpoint: POST /api/create-order — requires auth so unauthenticated callers can't burn Razorpay quota.
   */
  @Post('create-order')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async createOrder(@CurrentUser() _user: AuthenticatedUser, @Body() body: CreateOrderDto) {
    return this.paymentsService.createOrder(body);
  }

  /**
   * STEP 3: BACKEND - Verify Signature
   * Endpoint: POST /api/verify-payment
   * instituteId comes from JWT, not from client body — plan is derived from Razorpay order notes.
   */
  @Post('verify-payment')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@CurrentUser() user: AuthenticatedUser, @Body() body: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(body, user);
  }

  /**
   * Alias: POST /api/payments/create-order
   */
  @Post('payments/create-order')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async createOrderAlias(@CurrentUser() _user: AuthenticatedUser, @Body() body: CreateOrderDto) {
    return this.paymentsService.createOrder(body);
  }

  /**
   * Alias: POST /api/payments/verify-payment
   */
  @Post('payments/verify-payment')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyPaymentAlias(@CurrentUser() user: AuthenticatedUser, @Body() body: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(body, user);
  }

  /**
   * Razorpay webhook — POST /api/payments/webhook
   * Verifies X-Razorpay-Signature and handles payment.captured for missed verifications.
   * No auth guard: Razorpay calls this directly with HMAC signature.
   */
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
  ) {
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    return this.paymentsService.handleWebhook(signature, rawBody, body);
  }

  /**
   * Safe public endpoint returning only the KEY_ID (never the secret).
   */
  @Get('payments/key')
  getKey() {
    return { key_id: this.paymentsService.getKeyId() };
  }

  /**
   * Upgrades the institute's subscription plan.
   * Accessible by authenticated tuition owners and institute admins.
   */
  @Post('payments/upgrade-plan')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async upgradePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpgradePlanDto,
  ) {
    const instituteId = body.instituteId || user.instituteId;
    return this.paymentsService.upgradeInstitutePlan(instituteId, body.plan);
  }

  /** Platform-wide revenue summary: total collected, by mode, monthly trend (SUPER_ADMIN only). */
  @Get('payments/revenue')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  getPlatformRevenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('instituteId') instituteId?: string,
  ) {
    return this.paymentsService.getPlatformRevenueSummary({ from, to, instituteId });
  }
}
