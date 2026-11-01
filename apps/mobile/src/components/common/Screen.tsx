import React from 'react';
import { View, ScrollView, RefreshControl, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeskBackground } from './Paper';
import { Badge } from './Badge';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenProps {
  /** Small uppercase line above the title, e.g. "Faculty Operations". */
  eyebrow?: string;
  /** Green session badge next to the eyebrow, e.g. "Academic Session 2026–27". */
  tag?: string;
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}

/**
 * Standard page: clean tranquil background, Apple/Linear inspired calm editorial header,
 * pull-to-refresh, safe areas.
 */
export const Screen: React.FC<ScreenProps> = ({ eyebrow, tag, title, subtitle, refreshing, onRefresh, children }) => {
  const { colors, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <DeskBackground />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
        }
      >
        <View style={{ marginBottom: 18 }}>
          {eyebrow || tag ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {eyebrow ? (
                <Text style={{ fontFamily: typography.fonts.ui, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted }}>
                  {eyebrow}
                </Text>
              ) : null}
              {eyebrow && tag ? <Text style={{ color: colors.textFaint }}>•</Text> : null}
              {tag ? <Badge label={tag} variant="success" /> : null}
            </View>
          ) : null}
          <Text style={{ fontFamily: typography.fonts.display, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4, color: colors.textPrimary }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontFamily: typography.fonts.ui, fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </View>
  );
};

/** Back-compat small label used by older screens; prefer SectionHeader from Paper. */
export const SectionTitle: React.FC<{ children: string }> = ({ children }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={{ marginTop: 20, marginBottom: 10 }}>
      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted }}>
        {children}
      </Text>
    </View>
  );
};
