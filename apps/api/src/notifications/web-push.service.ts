import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_VAPID_PUBLIC_KEY,
  DEFAULT_VAPID_PRIVATE_KEY,
  DEFAULT_VAPID_SUBJECT,
} from './web-push.config.js';

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    link?: string;
    notificationId?: string;
    category?: string;
    actionButtons?: Array<{ id: string; title: string; actionUrl: string }>;
  };
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private webPush: any = null;

  /**
   * Loads `web-push` and configures VAPID on first send.
   *
   * The API is a single serverless function, so a module-scope import of `web-push` was paid on
   * every cold start (~110 ms) even though only push dispatch needs it. VAPID keys are constants,
   * so configuring them here instead of in the constructor costs nothing and keeps the library
   * off the boot path. Returns null when the library cannot be configured.
   */
  private async getWebPush(): Promise<any | null> {
    if (this.webPush) return this.webPush;
    try {
      const mod = await import('web-push');
      const webPush: any = (mod as any).default || mod;
      webPush.setVapidDetails(
        DEFAULT_VAPID_SUBJECT,
        DEFAULT_VAPID_PUBLIC_KEY,
        DEFAULT_VAPID_PRIVATE_KEY,
      );
      this.webPush = webPush;
      return webPush;
    } catch (err) {
      this.logger.warn(`Failed to configure VAPID keys for Web Push: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  getPublicKey(): string {
    return DEFAULT_VAPID_PUBLIC_KEY;
  }

  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: WebPushPayload,
  ): Promise<{ success: boolean; expired?: boolean }> {
    const webPush = await this.getWebPush();
    if (!webPush) {
      return { success: false, expired: false };
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webPush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24 }, // 24 hours TTL
      );
      return { success: true };
    } catch (error: any) {
      const statusCode = error?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        this.logger.debug(`Web push subscription has expired or is unsubscribed: ${subscription.endpoint}`);
        return { success: false, expired: true };
      }
      this.logger.warn(`Failed to dispatch web push to endpoint: ${error?.message || error}`);
      return { success: false, expired: false };
    }
  }
}

