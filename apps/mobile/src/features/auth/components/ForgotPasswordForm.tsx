import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Caption } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (val: string) => void;
  onSubmit: () => void;
  onBackToLogin: () => void;
  isLoading: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  setEmail,
  onSubmit,
  onBackToLogin,
  isLoading,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <Caption style={{ color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 }}>
        Enter your registered email address. We will verify your account and provide a reset link or instructions.
      </Caption>

      <Input
        label="Email Address"
        placeholder="e.g. rohan.verma@tuition.edu"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Button
        title="Send Reset Instructions"
        variant="primary"
        size="lg"
        onPress={onSubmit}
        loading={isLoading}
      />

      <Button
        title="Back to Sign In"
        variant="ghost"
        size="md"
        onPress={onBackToLogin}
        style={{ marginTop: spacing.sm }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
