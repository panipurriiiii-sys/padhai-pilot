import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WebPushService } from './web-push.service.js';
import { FcmPushService } from './fcm-push.service.js';
import type { NotificationCategory, NotificationActionButton, NotificationPreferences } from '@padhai-pilot/shared';

export interface DispatchNotificationOptions {
  instituteId: string;
  userIds: string[];
  title: string;
  message: string;
  type: string;
  category?: NotificationCategory;
  link?: string;
  actionButtons?: NotificationActionButton[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dedupeKeyPrefix?: string;
}

const DEFAULT_PREFS: NotificationPreferences = {
  inApp: true,
  push: true,
  email: true,
  attendance: true,
  results: true,
  fees: true,
  homework: true,
  diary: true,
  announcements: true,
  leaves: true,
  sound: true,
};

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
    private readonly fcmPush: FcmPushService,
  ) {}

  /**
   * Dispatches notifications to recipient users across In-App, Web Push, and Mobile Push.
   */
  async dispatch(opts: DispatchNotificationOptions): Promise<{ createdCount: number }> {
    if (!opts.userIds || opts.userIds.length === 0) {
      return { createdCount: 0 };
    }

    const uniqueUserIds = [...new Set(opts.userIds)];
    const category = opts.category || this.inferCategory(opts.type);
    const priority = opts.priority || 'NORMAL';

    // 1. Fetch user notification preferences
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, notificationPreferences: true },
    });

    const eligibleUserIds: string[] = [];
    const pushEligibleUserIds: string[] = [];

    for (const u of users) {
      const prefs: NotificationPreferences = {
        ...DEFAULT_PREFS,
        ...((u.notificationPreferences as unknown as Partial<NotificationPreferences>) || {}),
      };

      if (!prefs.inApp) continue;

      // Check category-specific opt-out
      if (category === 'ATTENDANCE' && !prefs.attendance) continue;
      if (category === 'ACADEMICS' && !prefs.results && !prefs.homework) continue;
      if (category === 'FEES' && !prefs.fees) continue;
      if (category === 'LEAVES' && !prefs.leaves) continue;
      if (category === 'NOTICES' && !prefs.announcements) continue;

      eligibleUserIds.push(u.id);
      if (prefs.push) {
        pushEligibleUserIds.push(u.id);
      }
    }

    if (eligibleUserIds.length === 0) {
      return { createdCount: 0 };
    }

    // 2. Persist In-App notifications
    const createData = eligibleUserIds.map((userId) => ({
      instituteId: opts.instituteId,
      userId,
      title: opts.title,
      message: opts.message,
      type: opts.type,
      link: opts.link || null,
      actionButtons: (opts.actionButtons as any) || null,
      priority,
      isRead: false,
      dedupeKey: opts.dedupeKeyPrefix ? `${opts.dedupeKeyPrefix}:${userId}` : null,
    }));

    let createdCount = 0;
    try {
      if (this.prisma.notification?.createMany) {
        const res = await this.prisma.notification.createMany({
          data: createData,
          skipDuplicates: true,
        });
        createdCount = res.count;
      } else {
        for (const d of createData) {
          await this.prisma.notification.create({ data: d }).catch(() => {});
          createdCount++;
        }
      }
    } catch (err) {
      this.logger.warn(`Failed persisting in-app notifications: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 3. Dispatch Out-App Push Notifications (Web Push & Mobile FCM)
    if (pushEligibleUserIds.length > 0) {
      this.dispatchOutAppPush(pushEligibleUserIds, {
        title: opts.title,
        message: opts.message,
        category,
        priority,
        link: opts.link,
        actionButtons: opts.actionButtons,
      }).catch((err) => {
        this.logger.warn(`Background push dispatch error: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    return { createdCount };
  }

  private async dispatchOutAppPush(
    userIds: string[],
    meta: {
      title: string;
      message: string;
      category: NotificationCategory;
      priority: string;
      link?: string;
      actionButtons?: NotificationActionButton[];
    },
  ): Promise<void> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
    });

    const deadTokenIds: string[] = [];

    for (const tokenRecord of tokens) {
      if (tokenRecord.platform === 'WEB' && tokenRecord.endpoint && tokenRecord.p256dh && tokenRecord.auth) {
        const res = await this.webPush.send(
          {
            endpoint: tokenRecord.endpoint,
            p256dh: tokenRecord.p256dh,
            auth: tokenRecord.auth,
          },
          {
            title: meta.title,
            body: meta.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              link: meta.link,
              category: meta.category,
              actionButtons: meta.actionButtons,
            },
            actions: meta.actionButtons?.map((b) => ({ action: b.id, title: b.title })),
          },
        );
        if (res.expired) {
          deadTokenIds.push(tokenRecord.id);
        }
      } else if (tokenRecord.platform === 'ANDROID' || tokenRecord.platform === 'IOS') {
        const res = await this.fcmPush.send({
          token: tokenRecord.token,
          title: meta.title,
          body: meta.message,
          category: meta.category,
          priority: meta.priority,
          data: {
            link: meta.link || '',
            category: meta.category,
            actionButtons: JSON.stringify(meta.actionButtons || []),
          },
        });
        if (res.expired) {
          deadTokenIds.push(tokenRecord.id);
        }
      }
    }

    // Auto-clean expired / dead tokens
    if (deadTokenIds.length > 0) {
      await this.prisma.deviceToken.deleteMany({
        where: { id: { in: deadTokenIds } },
      }).catch(() => {});
      this.logger.debug(`Pruned ${deadTokenIds.length} expired device push tokens.`);
    }
  }

  private inferCategory(type: string): NotificationCategory {
    const upper = type.toUpperCase();
    if (upper.includes('ATTENDANCE')) return 'ATTENDANCE';
    if (upper.includes('RESULT') || upper.includes('QUIZ') || upper.includes('TEST') || upper.includes('HOMEWORK')) return 'ACADEMICS';
    if (upper.includes('FEE') || upper.includes('PAYMENT') || upper.includes('SALARY')) return 'FEES';
    if (upper.includes('LEAVE')) return 'LEAVES';
    if (upper.includes('ANNOUNCEMENT') || upper.includes('BROADCAST')) return 'NOTICES';
    return 'GENERAL';
  }
}

