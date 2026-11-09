import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';

export class CreateOrderDto {
  amount!: number; // in paise (e.g. 100 = 1 INR)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  order_id: string;
  amount: number;
  currency: string;
  receipt?: string;
}

export class VerifyPaymentDto {
  razorpay_order_id?: string;
  order_id?: string;
  razorpay_payment_id?: string;
  payment_id?: string;
  razorpay_signature?: string;
  signature?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  message: string;
  order_id: string;
  payment_id: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpayInstance: Razorpay | null = null;

  private getRazorpay(): Razorpay {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new UnauthorizedException('Razorpay credentials are not configured in environment.');
    }

    if (!this.razorpayInstance) {
      this.razorpayInstance = new Razorpay({
        key_id,
        key_secret,
      });
    }

    return this.razorpayInstance;
  }

  /**
   * STEP 1: BACKEND - Create Order
   * Calls Razorpay Orders API: POST https://api.razorpay.com/v1/orders
   * Validates minimum amount >= 100 paise (1 INR).
   */
  async createOrder(input: CreateOrderDto): Promise<CreateOrderResult> {
    const { amount, currency = 'INR', receipt, notes } = input;

    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new BadRequestException('Amount must be a valid number.');
    }

    const amountInPaise = Math.round(amount);

    if (amountInPaise < 100) {
      throw new BadRequestException('Minimum order amount must be at least 100 paise (₹1.00).');
    }

    const rzp = this.getRazorpay();

    try {
      const generatedReceipt = receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: generatedReceipt,
        notes: notes || {},
      });

      return {
        order_id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        receipt: String(order.receipt || generatedReceipt),
      };
    } catch (error: any) {
      this.logger.error(`Razorpay order creation failed: ${error?.message || error}`, error?.stack);
      if (error?.statusCode === 401 || error?.error?.code === 'BAD_REQUEST_ERROR' && error?.message?.includes('auth')) {
        throw new UnauthorizedException('Razorpay authentication failed.');
      }
      throw new InternalServerErrorException(
        error?.error?.description || error?.message || 'Failed to create Razorpay order.',
      );
    }
  }

  /**
   * STEP 3: BACKEND - Verify Signature
   * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
   * Validates that received signature matches expected signature in constant time.
   */
  async verifyPayment(input: VerifyPaymentDto): Promise<VerifyPaymentResult> {
    const order_id = input.razorpay_order_id || input.order_id;
    const payment_id = input.razorpay_payment_id || input.payment_id;
    const signature = input.razorpay_signature || input.signature;

    if (!order_id || !payment_id || !signature) {
      throw new BadRequestException('Missing required fields: order_id, payment_id, and signature are required.');
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      throw new UnauthorizedException('Razorpay KEY_SECRET is not configured.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    const isMatch =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      this.logger.warn(`Razorpay payment signature mismatch for order ${order_id} and payment ${payment_id}`);
      throw new BadRequestException('Payment verification failed: signature mismatch.');
    }

    this.logger.log(`Razorpay payment verified successfully for order ${order_id}, payment ${payment_id}`);

    return {
      success: true,
      message: 'Payment verified successfully.',
      order_id,
      payment_id,
    };
  }

  getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || '';
  }
}
