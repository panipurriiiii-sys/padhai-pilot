import { Controller, Post, Get, Body, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
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
   * STEP 1: BACKEND - Create Order
   * Endpoint: POST /api/create-order
   */
  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  async createOrder(@Body() body: CreateOrderDto) {
    return this.paymentsService.createOrder(body);
  }

  /**
   * STEP 3: BACKEND - Verify Signature
   * Endpoint: POST /api/verify-payment
   */
  @Post('verify-payment')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() body: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(body);
  }

  /**
   * Alias: POST /api/payments/create-order
   */
  @Post('payments/create-order')
  @HttpCode(HttpStatus.OK)
  async createOrderAlias(@Body() body: CreateOrderDto) {
    return this.paymentsService.createOrder(body);
  }

  /**
   * Alias: POST /api/payments/verify-payment
   */
  @Post('payments/verify-payment')
  @HttpCode(HttpStatus.OK)
  async verifyPaymentAlias(@Body() body: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(body);
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
  getPlatformRevenue(@Query('from') from?: string, @Query('to') to?: string) {
    return this.paymentsService.getPlatformRevenueSummary({ from, to });
  }
}
