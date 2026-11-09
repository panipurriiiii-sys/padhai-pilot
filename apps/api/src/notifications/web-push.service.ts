import { Injectable, Logger } from '@nestjs/common';
import webPush from 'web-push';
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
  private initialized = false;

  constructor() {
    this.initVapid();
  }

  private initVapid(): void {
    try {
      webPush.setVapidDetails(
        DEFAULT_VAPID_SUBJECT,
        DEFAULT_VAPID_PUBLIC_KEY,
        DEFAULT_VAPID_PRIVATE_KEY,
      );
      this.initialized = true;
    } catch (err) {
      this.logger.warn(`Failed to configure VAPID keys for Web Push: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  getPublicKey(): string {
    return DEFAULT_VAPID_PUBLIC_KEY;
  }

  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: WebPushPayload,
  ): Promise<{ success: boolean; expired?: boolean }> {
    if (!this.initialized) {
      this.initVapid();
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
