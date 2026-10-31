import { Platform, ViewStyle } from 'react-native';

/** Warm "paper" shadows from the Teacher Portal (--shadow-paper / --shadow-lift). Flat in dark mode. */
export const paperShadow = (isDark: boolean, level: 'paper' | 'lift' = 'paper'): ViewStyle => {
  if (isDark) return {};
  const lift = level === 'lift';
  return Platform.select<ViewStyle>({
    android: { elevation: lift ? 4 : 1.5, shadowColor: '#3C3428' },
    default: {
      shadowColor: '#3C3428',
      shadowOffset: { width: 0, height: lift ? 8 : 3 },
      shadowOpacity: lift ? 0.16 : 0.1,
      shadowRadius: lift ? 14 : 8,
    },
  }) as ViewStyle;
};

/** --shadow-neon / btn-primary glow */
export const electricGlow = (): ViewStyle =>
  Platform.select<ViewStyle>({
    android: { elevation: 3, shadowColor: '#1677FF' },
    default: { shadowColor: '#1677FF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8 },
  }) as ViewStyle;
