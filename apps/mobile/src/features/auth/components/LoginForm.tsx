import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Caption } from '../../../components/common/Typography';
import { useTheme } from '../../../theme/ThemeContext';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  onForgotPassword,
  isLoading,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <Input
        label="Email Address"
        placeholder="e.g. rohan.verma@tuition.edu"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Input
        label="Password"
        placeholder="Enter your account password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Pressable
        onPress={onForgotPassword}
        hitSlop={8}
        style={[styles.forgotBtn, { marginBottom: spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="Forgot password"
      >
        <Caption style={{ color: colors.primary, fontWeight: '600' }}>
          Forgot password?
        </Caption>
      </Pressable>

      <Button
        title="Sign In to Portal"
        variant="primary"
        size="lg"
        onPress={onSubmit}
        loading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
});
