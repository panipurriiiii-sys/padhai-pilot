import { notificationService } from '../src/services/notification/NotificationService';
import notifee, { AndroidImportance } from '@notifee/react-native';

jest.mock('@notifee/react-native', () => {
  return {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    createChannel: jest.fn().mockResolvedValue('channel_created'),
    displayNotification: jest.fn().mockResolvedValue('notif_123'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    onForegroundEvent: jest.fn().mockReturnValue(jest.fn()),
    AndroidImportance: {
      DEFAULT: 3,
      HIGH: 4,
    },
    AndroidColor: {
      BLUE: '#0000FF',
      YELLOW: '#FFFF00',
    },
    EventType: {
      PRESS: 1,
    },
  };
});

describe('NotificationService with @notifee/react-native', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.resetForTesting();
  });

  it('initializes and requests notification permission', async () => {
    const granted = await notificationService.initialize();
    expect(granted).toBe(true);
    expect(notifee.requestPermission).toHaveBeenCalled();
  });

  it('creates Android channels for academic, announcements, and fees', async () => {
    await notificationService.initialize();
    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'academic',
        name: 'Academic & Classes',
        importance: AndroidImportance.HIGH,
      })
    );
    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'announcements',
        name: 'Announcements & Notices',
        importance: AndroidImportance.HIGH,
      })
    );
    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'fees',
        name: 'Fees & Finance',
      })
    );
  });

  it('displays a notification successfully', async () => {
    const notifId = await notificationService.displayNotification({
      title: 'New Assignment',
      body: 'Mathematics Unit 1 homework has been posted.',
      channel: 'academic',
      data: { assignmentId: 'asg_999' },
    });

    expect(notifId).toBe('notif_123');
    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Assignment',
        body: 'Mathematics Unit 1 homework has been posted.',
        android: expect.objectContaining({
          channelId: 'academic',
        }),
      })
    );
  });

  it('cancels specific and all notifications safely', async () => {
    await notificationService.cancel('notif_123');
    expect(notifee.cancelNotification).toHaveBeenCalledWith('notif_123');

    await notificationService.cancelAll();
    expect(notifee.cancelAllNotifications).toHaveBeenCalled();
  });

  it('registers foreground event listener', () => {
    const handler = jest.fn();
    const unsub = notificationService.onForegroundEvent(handler);
    expect(notifee.onForegroundEvent).toHaveBeenCalledWith(handler);
    expect(typeof unsub).toBe('function');
  });

  it('handles notifee failure gracefully without crashing', async () => {
    (notifee.displayNotification as jest.Mock).mockRejectedValueOnce(new Error('Device error'));
    const result = await notificationService.displayNotification({
      title: 'Error Test',
      body: 'Should not crash',
    });
    expect(result).toBeNull();
  });
});
