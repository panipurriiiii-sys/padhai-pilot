import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, lightColors, darkColors, spacing, radii, typography, hitSlop } from './tokens';

export type ColorSchemePreference = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  hitSlop: typeof hitSlop;
  preference: ColorSchemePreference;
  setPreference: (pref: ColorSchemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState<ColorSchemePreference>('system');

  const isDark = useMemo(() => {
    if (preference === 'dark') return true;
    if (preference === 'light') return false;
    return systemColorScheme === 'dark';
  }, [preference, systemColorScheme]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(
    () => ({
      isDark,
      colors,
      spacing,
      radii,
      typography,
      hitSlop,
      preference,
      setPreference,
    }),
    [isDark, colors, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
