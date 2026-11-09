import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  PaymentsService,
  CreateOrderDto,
  VerifyPaymentDto,
} from './payments.service.js';

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
}
