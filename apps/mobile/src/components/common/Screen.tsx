import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ScreenContainer } from './ScreenContainer';
import { Title, Caption } from './Typography';
import { Badge } from './Badge';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}

/** Standard page chrome: header, pull-to-refresh, safe areas. Keeps every screen visually consistent. */
export const Screen: React.FC<ScreenProps> = ({ eyebrow, title, subtitle, refreshing, onRefresh, children }) => {
  const { colors, spacing } = useTheme();
  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.giant }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        <View style={{ marginBottom: spacing.lg }}>
          {eyebrow ? <Badge label={eyebrow} variant="primary" /> : null}
          <Title style={styles.title}>{title}</Title>
          {subtitle ? <Caption>{subtitle}</Caption> : null}
        </View>
        {children}
      </ScrollView>
    </ScreenContainer>
  );
};

export const SectionTitle: React.FC<{ children: string }> = ({ children }) => {
  const { spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
      <Caption style={styles.section}>{children}</Caption>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { marginTop: 4 },
  section: { textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
});
