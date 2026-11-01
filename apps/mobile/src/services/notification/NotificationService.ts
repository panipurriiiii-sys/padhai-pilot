import notifee, {
  AndroidImportance,
  AndroidColor,
  EventType,
  Event,
  Notification,
} from '@notifee/react-native';
import { Platform } from 'react-native';

export type NotificationChannelType = 'default' | 'academic' | 'announcements' | 'fees';

export interface DisplayNotificationOptions {
  id?: string;
  title: string;
  body: string;
  channel?: NotificationChannelType;
  data?: Record<string, string | number | boolean>;
}

export class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * For testing purposes only: resets the singleton initialization state.
   */
  public resetForTesting(): void {
    this.initialized = false;
  }

  /**
   * Initializes notification channels and requests notification permissions.
   * Safe to call multiple times (idempotent).
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // 1. Request permission
      const settings = await notifee.requestPermission();
      const hasPermission = settings.authorizationStatus >= 1; // Authorized or Provisional

      // 2. Set up Android channels
      await this.createDefaultChannels();

      this.initialized = true;
      return hasPermission;
    } catch (error) {
      // Do not crash if device feature is unavailable
      return false;
    }
  }

  /**
   * Creates Android notification channels for distinct notification types.
   */
  private async createDefaultChannels(): Promise<void> {
    try {
      await notifee.createChannel({
        id: 'academic',
        name: 'Academic & Classes',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: AndroidColor.BLUE,
      });

      await notifee.createChannel({
        id: 'announcements',
        name: 'Announcements & Notices',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: AndroidColor.YELLOW,
      });

      await notifee.createChannel({
        id: 'fees',
        name: 'Fees & Finance',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      });

      await notifee.createChannel({
        id: 'default',
        name: 'General Notifications',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      });
    } catch {
      // Ignore channel creation errors on platforms/emulators without support
    }
  }

  /**
   * Displays an immediate local notification with high prominence.
   */
  public async displayNotification(opts: DisplayNotificationOptions): Promise<string | null> {
    try {
      await this.initialize();

      const channelId = opts.channel || 'default';

      const notificationId = await notifee.displayNotification({
        id: opts.id,
        title: opts.title,
        body: opts.body,
        data: opts.data,
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.HIGH,
          color: '#1677FF',
        },
        ios: {
          sound: 'default',
        },
      });

      return notificationId;
    } catch {
      return null;
    }
  }

  /**
   * Cancels a specific notification by ID.
   */
  public async cancel(id: string): Promise<void> {
    try {
      await notifee.cancelNotification(id);
    } catch {
      // safe fallback
    }
  }

  /**
   * Cancels all active notifications.
   */
  public async cancelAll(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch {
      // safe fallback
    }
  }

  /**
   * Registers foreground event listener for notification interaction.
   */
  public onForegroundEvent(handler: (event: Event) => void): () => void {
    try {
      return notifee.onForegroundEvent(handler);
    } catch {
      return () => {};
    }
  }
}

export const notificationService = NotificationService.getInstance();
