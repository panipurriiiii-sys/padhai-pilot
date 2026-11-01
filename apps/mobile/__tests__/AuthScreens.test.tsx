import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LoginScreen } from '../src/features/auth/screens/LoginScreen';
import { GetStartedScreen } from '../src/features/auth/screens/GetStartedScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

describe('Auth & Onboarding Screens', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const initialMetrics = {
    frame: { x: 0, y: 0, width: 375, height: 812 },
    insets: { top: 44, left: 0, right: 0, bottom: 34 },
  };

  it('renders GetStartedScreen with anime illustrations correctly', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider>
            <GetStartedScreen onFinish={jest.fn()} onLoginPress={jest.fn()} />
          </ThemeProvider>
        </SafeAreaProvider>
      );
      jest.advanceTimersByTime(500);
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree?.toJSON());
    expect(str).toContain('STUDY ZONE');
    expect(str).toContain('Focus & Master Your Goals');
  });

  it('renders LoginScreen root into onboarding by default', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider>
            <LoginScreen />
          </ThemeProvider>
        </SafeAreaProvider>
      );
      jest.advanceTimersByTime(500);
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree?.toJSON());
    expect(str).toContain('STUDY ZONE');
  });
});
