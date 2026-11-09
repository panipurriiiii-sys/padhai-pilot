import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { InAppNotification, NotificationCategory, NotificationPreferences, DeviceTokenPayload } from '@padhai-pilot/shared';

const DEFAULT_PREFERENCES: NotificationPreferences = {
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
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(
    userId: string,
    query: {
      category?: NotificationCategory;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ items: InAppNotification[]; unreadCount: number; total: number }> {
    const limit = Math.min(query.limit ?? 30, 100);
    const offset = query.offset ?? 0;

    const where: any = { userId };
    if (query.unreadOnly) {
      where.isRead = false;
    }

    if (query.category && query.category !== 'ALL') {
      if (query.category === 'ACADEMICS') {
        where.type = { in: ['RESULT_PUBLISHED', 'QUIZ_PUBLISHED', 'TEST_PUBLISHED', 'HOMEWORK_ASSIGNED'] };
      } else if (query.category === 'FEES') {
        where.type = { in: ['FEE_DUE_REMINDER', 'FEE_PAYMENT_RECEIPT', 'FEE_PAYMENT_VOID', 'SALARY_PAID'] };
      } else if (query.category === 'LEAVES') {
        where.type = { in: ['STUDENT_LEAVE', 'STUDENT_LEAVE_REVIEW', 'FACULTY_LEAVE'] };
      } else if (query.category === 'NOTICES') {
        where.type = { in: ['ANNOUNCEMENT', 'BROADCAST_NOTICE', 'EMERGENCY_NOTICE'] };
      } else if (query.category === 'ATTENDANCE') {
        where.type = { in: ['STUDENT_ABSENT', 'ATTENDANCE_MARKED'] };
      }
    }

    const [items, unreadCount, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        instituteId: item.instituteId,
        userId: item.userId,
        title: item.title,
        message: item.message,
        type: item.type,
        category: this.inferCategory(item.type),
        link: item.link || undefined,
        actionButtons: (item.actionButtons as any) || undefined,
        priority: (item.priority as any) || 'NORMAL',
        isRead: item.isRead,
        createdAt: item.createdAt.toISOString(),
      })),
      unreadCount,
      total,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Notification not found.');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updatedCount: res.count };
  }

  async registerDeviceToken(userId: string, payload: DeviceTokenPayload): Promise<{ success: boolean; id: string }> {
    if (!payload?.token?.trim()) {
      throw new BadRequestException('Device token or endpoint is required.');
    }

    const platform = payload.platform?.toUpperCase() || 'WEB';
    const record = await this.prisma.deviceToken.upsert({
      where: { token: payload.token.trim() },
      update: {
        userId,
        platform,
        endpoint: payload.endpoint || null,
        p256dh: payload.p256dh || null,
        auth: payload.auth || null,
        userAgent: payload.userAgent || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token: payload.token.trim(),
        platform,
        endpoint: payload.endpoint || null,
        p256dh: payload.p256dh || null,
        auth: payload.auth || null,
        userAgent: payload.userAgent || null,
      },
    });

    return { success: true, id: record.id };
  }

  async removeDeviceToken(userId: string, token: string): Promise<{ success: boolean }> {
    if (!token) return { success: true };
    await this.prisma.deviceToken.deleteMany({
      where: { userId, token: token.trim() },
    });
    return { success: true };
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const prefs = (user.notificationPreferences as unknown as Partial<NotificationPreferences>) || {};
    return { ...DEFAULT_PREFERENCES, ...prefs };
  }

  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const merged: NotificationPreferences = { ...current, ...updates };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged as any },
    });

    return merged;
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

