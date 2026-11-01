import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Caption } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';

interface AuthFooterToggleProps {
  mode: 'SIGN_IN' | 'REGISTER';
  onToggle: () => void;
}

export const AuthFooterToggle: React.FC<AuthFooterToggleProps> = ({ mode, onToggle }) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { marginTop: spacing.xl, marginBottom: spacing.lg }]}>
      <Caption style={{ color: colors.textSecondary }}>
        {mode === 'SIGN_IN'
          ? "Don't have an account yet? "
          : 'Already have an active account? '}
      </Caption>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={mode === 'SIGN_IN' ? 'Switch to Register' : 'Switch to Sign In'}
      >
        <Caption style={{ color: colors.primary, fontWeight: '700' }}>
          {mode === 'SIGN_IN' ? 'Register here' : 'Sign In'}
        </Caption>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

