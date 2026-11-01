import { useEffect, useCallback } from 'react';
import { notificationService, DisplayNotificationOptions, NotificationChannelType } from './NotificationService';

export function useNotifications() {
  useEffect(() => {
    notificationService.initialize().catch(() => {});
  }, []);

  const notify = useCallback(async (opts: DisplayNotificationOptions) => {
    return notificationService.displayNotification(opts);
  }, []);

  const notifyAcademic = useCallback(async (title: string, body: string, data?: Record<string, string | number | boolean>) => {
    return notificationService.displayNotification({
      title,
      body,
      channel: 'academic',
      data,
    });
  }, []);

  const notifyAnnouncement = useCallback(async (title: string, body: string, data?: Record<string, string | number | boolean>) => {
    return notificationService.displayNotification({
      title,
      body,
      channel: 'announcements',
      data,
    });
  }, []);

  const notifyFee = useCallback(async (title: string, body: string, data?: Record<string, string | number | boolean>) => {
    return notificationService.displayNotification({
      title,
      body,
      channel: 'fees',
      data,
    });
  }, []);

  return {
    notify,
    notifyAcademic,
    notifyAnnouncement,
    notifyFee,
  };
}
