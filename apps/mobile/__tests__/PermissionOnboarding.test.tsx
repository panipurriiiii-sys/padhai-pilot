import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PermissionOnboardingScreen } from '../src/features/permissions/PermissionOnboardingScreen';
import { permissionManager } from '../src/features/permissions/permissionManager';
import { ThemeProvider } from '../src/theme/ThemeContext';

jest.mock('../src/features/permissions/permissionManager', () => ({
  permissionManager: {
    requestPermission: jest.fn().mockResolvedValue(true),
    markOnboardingCompleted: jest.fn().mockResolvedValue(undefined),
  },
  TEACHER_PERMISSIONS: [
    {
      key: 'notifications',
      title: 'Instant Class & Doubt Alerts',
      subtitle: 'Stay on top of schedule',
      description: 'Alerts description',
      benefit: 'Alerts benefit',
      icon: 'bell',
      mandatory: false,
    },
    {
      key: 'camera',
      title: 'Camera Access for Homework',
      subtitle: 'Capture documents',
      description: 'Camera description',
      benefit: 'Camera benefit',
      icon: 'camera',
      mandatory: false,
    },
  ],
  STUDENT_PERMISSIONS: [
    {
      key: 'notifications',
      title: 'Lecture & Homework Reminders',
      subtitle: 'Never miss deadlines',
      description: 'Student alerts description',
      benefit: 'Student alerts benefit',
      icon: 'bell',
      mandatory: false,
    },
  ],
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

describe('PermissionOnboardingScreen', () => {
  it('renders teacher permission screen correctly', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider>
            <PermissionOnboardingScreen role="TEACHER" userId="teacher_1" onFinished={jest.fn()} />
          </ThemeProvider>
        </SafeAreaProvider>,
      );
    });
    expect(renderer!.toJSON()).toBeTruthy();
  });

  it('renders student permission screen correctly', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider>
            <PermissionOnboardingScreen role="STUDENT" userId="student_1" onFinished={jest.fn()} />
          </ThemeProvider>
        </SafeAreaProvider>,
      );
    });
    expect(renderer!.toJSON()).toBeTruthy();
  });
});
