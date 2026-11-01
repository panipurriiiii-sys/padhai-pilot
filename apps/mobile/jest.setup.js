/* eslint-env jest */
jest.mock('@notifee/react-native', () => {
  return {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    createChannel: jest.fn().mockResolvedValue('channel_id'),
    displayNotification: jest.fn().mockResolvedValue('notif_123'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    onForegroundEvent: jest.fn().mockReturnValue(jest.fn()),
    onBackgroundEvent: jest.fn().mockReturnValue(jest.fn()),
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
