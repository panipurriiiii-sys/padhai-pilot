/* eslint-env jest */
const mockStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((k, v) => {
    mockStorage.set(k, v);
    return Promise.resolve(null);
  }),
  getItem: jest.fn((k) => Promise.resolve(mockStorage.get(k) ?? null)),
  removeItem: jest.fn((k) => {
    mockStorage.delete(k);
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    mockStorage.clear();
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, mockStorage.get(k) ?? null]))),
  multiSet: jest.fn((entries) => {
    entries.forEach(([k, v]) => mockStorage.set(k, v));
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => mockStorage.delete(k));
    return Promise.resolve(null);
  }),
}));

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
