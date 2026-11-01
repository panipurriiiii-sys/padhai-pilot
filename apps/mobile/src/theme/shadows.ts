import { Platform, ViewStyle } from 'react-native';

/** Neutral, soft ambient shadows. Flat in dark mode. */
export const paperShadow = (isDark: boolean, level: 'paper' | 'lift' = 'paper'): ViewStyle => {
  if (isDark) {
    return Platform.select<ViewStyle>({
      android: { elevation: 1 },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
    }) as ViewStyle;
  }
  const lift = level === 'lift';
  return Platform.select<ViewStyle>({
    android: { elevation: lift ? 3 : 1.5 },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: lift ? 6 : 2 },
      shadowOpacity: lift ? 0.08 : 0.04,
      shadowRadius: lift ? 12 : 6,
    },
  }) as ViewStyle;
};

/** Electric blue micro-glow */
export const electricGlow = (): ViewStyle =>
  Platform.select<ViewStyle>({
    android: { elevation: 2 },
    default: {
      shadowColor: '#1677FF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
  }) as ViewStyle;
