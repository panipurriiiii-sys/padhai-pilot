import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface AuthFooterToggleProps {
  mode: 'SIGN_IN' | 'REGISTER';
  onToggle: () => void;
}

export const AuthFooterToggle: React.FC<AuthFooterToggleProps> = ({ mode, onToggle }) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
        {mode === 'SIGN_IN'
          ? "Don't have an account yet? "
          : 'Already have an active account? '}
      </Text>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={mode === 'SIGN_IN' ? 'Create new account' : 'Sign in to account'}
      >
        <Text style={[styles.action, { color: colors.primary, fontFamily: typography.fonts.ui }]}>
          {mode === 'SIGN_IN' ? 'Create account' : 'Sign in'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 16,
  },
  prompt: {
    fontSize: 12,
  },
  action: {
    fontSize: 12,
    fontWeight: '700',
  },
});
