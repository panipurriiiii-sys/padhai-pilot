import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Title, Subtitle, Caption } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = false,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.lg }]}>
      {showBack && onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={[styles.backButton, { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Caption style={{ color: colors.primary, fontWeight: '700' }}>← Back</Caption>
        </Pressable>
      )}
      <Title style={[styles.title, { color: colors.textPrimary }]}>{title}</Title>
      {subtitle ? (
        <Subtitle style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Subtitle>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});

