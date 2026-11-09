import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { NotificationDispatcherService } from './notification-dispatcher.service.js';
import { WebPushService } from './web-push.service.js';
import { FcmPushService } from './fcm-push.service.js';

describe('Notifications System', () => {
  let notificationsService: NotificationsService;
  let dispatcherService: NotificationDispatcherService;
  let mockPrisma: any;
  let mockWebPush: any;
  let mockFcmPush: any;

  const mockUser = { id: 'usr_student_01', email: 'student@padhaipilot.com' };
  const mockInstituteId = 'inst_apex_01';

  beforeEach(() => {
    mockPrisma = {
      notification: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
      },
      deviceToken: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    mockWebPush = {
      getPublicKey: vi.fn().mockReturnValue('mock-vapid-public-key'),
      send: vi.fn().mockResolvedValue({ success: true }),
    };

    mockFcmPush = {
      send: vi.fn().mockResolvedValue({ success: true }),
    };

    notificationsService = new NotificationsService(mockPrisma);
    dispatcherService = new NotificationDispatcherService(mockPrisma, mockWebPush, mockFcmPush);
  });

  describe('NotificationsService', () => {
    it('should retrieve notifications with correct unread count', async () => {
      const mockItems = [
        {
          id: 'n1',
          instituteId: mockInstituteId,
          userId: mockUser.id,
          title: 'Quiz Published',
          message: 'Physics Quiz is live',
          type: 'QUIZ_PUBLISHED',
          isRead: false,
          createdAt: new Date('2026-11-09T10:00:00Z'),
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockItems);
      mockPrisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await notificationsService.getUserNotifications(mockUser.id);
      expect(result.items).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
      expect(result.items[0].category).toBe('ACADEMICS');
    });

    it('should mark a notification as read', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'n1', userId: mockUser.id });
      mockPrisma.notification.update.mockResolvedValue({ id: 'n1', isRead: true });

      const res = await notificationsService.markAsRead(mockUser.id, 'n1');
      expect(res.success).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isRead: true },
      });
    });

    it('should mark all notifications as read for a user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });
      const res = await notificationsService.markAllAsRead(mockUser.id);
      expect(res.updatedCount).toBe(5);
    });

    it('should register a device push token', async () => {
      mockPrisma.deviceToken.upsert.mockResolvedValue({ id: 'dt_01' });

      const res = await notificationsService.registerDeviceToken(mockUser.id, {
        token: 'fcm_token_123',
        platform: 'ANDROID',
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.deviceToken.upsert).toHaveBeenCalled();
    });

    it('should manage user notification preferences', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        notificationPreferences: { attendance: false },
      });
      mockPrisma.user.update.mockResolvedValue({});

      const prefs = await notificationsService.getUserPreferences(mockUser.id);
      expect(prefs.attendance).toBe(false);
      expect(prefs.inApp).toBe(true);

      const updated = await notificationsService.updateUserPreferences(mockUser.id, { attendance: true });
      expect(updated.attendance).toBe(true);
    });
  });

  describe('NotificationDispatcherService', () => {
    it('should dispatch in-app and push notifications to eligible users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', notificationPreferences: { inApp: true, push: true, results: true } },
      ]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.deviceToken.findMany.mockResolvedValue([
        { id: 'd1', platform: 'WEB', endpoint: 'https://push.com', p256dh: 'p256', auth: 'auth' },
        { id: 'd2', platform: 'ANDROID', token: 'fcm_123' },
      ]);

      const res = await dispatcherService.dispatch({
        instituteId: mockInstituteId,
        userIds: ['u1'],
        title: 'Exam Result Published',
        message: 'Your Mathematics mid-term results are published.',
        type: 'RESULT_PUBLISHED',
        category: 'ACADEMICS',
        actionButtons: [{ id: 'view_result', title: 'View Result', actionUrl: '/results' }],
      });

      expect(res.createdCount).toBe(1);
      expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    });

    it('should skip users who have muted the specific category', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', notificationPreferences: { inApp: true, attendance: false } },
      ]);

      const res = await dispatcherService.dispatch({
        instituteId: mockInstituteId,
        userIds: ['u1'],
        title: 'Attendance Notice',
        message: 'Student marked absent',
        type: 'STUDENT_ABSENT',
        category: 'ATTENDANCE',
      });

      expect(res.createdCount).toBe(0);
      expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
    });
  });
});
