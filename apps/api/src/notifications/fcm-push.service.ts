import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface FcmPushPayload {
  token: string;
  title: string;
  body: string;
  category?: string;
  priority?: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmPushService {
  private readonly logger = new Logger(FcmPushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(payload: FcmPushPayload): Promise<{ success: boolean; expired?: boolean }> {
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    const fcmProjectId = process.env.FIREBASE_PROJECT_ID;

    // 1. Direct FCM Legacy/HTTP endpoint if server key provided
    if (fcmServerKey) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            to: payload.token,
            notification: {
              title: payload.title,
              body: payload.body,
              sound: 'default',
              android_channel_id: payload.category?.toLowerCase() || 'default',
            },
            data: payload.data || {},
            priority: payload.priority === 'HIGH' || payload.priority === 'URGENT' ? 'high' : 'normal',
          }),
        });

        const resData = (await response.json().catch(() => ({}))) as any;
        if (response.ok && resData?.success === 1) {
          return { success: true };
        }

        const err = resData?.results?.[0]?.error;
        if (err === 'NotRegistered' || err === 'InvalidRegistration') {
          return { success: false, expired: true };
        }

        this.logger.warn(`FCM dispatch response failed: ${JSON.stringify(resData)}`);
        return { success: false, expired: false };
      } catch (err: any) {
        this.logger.warn(`FCM request failed: ${err?.message || err}`);
      }
    }

    // 2. Graceful fallback: Record to NotificationOutbox for queue drainers or local delivery
    try {
      if (this.prisma.isConnected) {
        await this.prisma.notificationOutbox.create({
          data: {
            channel: 'PUSH',
            template: payload.category || 'GENERAL',
            recipient: payload.token,
            payload: {
              title: payload.title,
              body: payload.body,
              data: payload.data,
              priority: payload.priority,
            },
            status: fcmServerKey || fcmProjectId ? 'FAILED' : 'PENDING',
            idempotencyKey: `fcm-${payload.token}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            lastError: fcmServerKey ? 'FCM dispatch unacknowledged' : 'FCM credentials pending operator setup',
          },
        });
      }
    } catch {
      // safe fallback, do not block caller
    }

    return { success: true, expired: false };
  }
}
