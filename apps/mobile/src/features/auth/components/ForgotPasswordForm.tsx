import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Button } from '../../../components/common/Button';
import { useTheme } from '../../../theme/ThemeContext';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (val: string) => void;
  emailError?: string | null;
  onSubmit: () => void;
  onBackToLogin: () => void;
  isLoading: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  setEmail,
  emailError,
  onSubmit,
  onBackToLogin,
  isLoading,
}) => {
  const { colors, radii, typography, spacing } = useTheme();
  const [emailFocused, setEmailFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.guideText, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
        Enter your registered email address to receive password reset instructions.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Email Address
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: emailError ? colors.error : emailFocused ? colors.primary : colors.borderStrong,
              borderRadius: radii.lg,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="name@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {emailError ? (
          <Text style={[styles.errorHelper, { color: colors.error, fontFamily: typography.fonts.ui }]}>
            {emailError}
          </Text>
        ) : null}
      </View>

      <Button
        title="Send Reset Code"
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
  guideText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  errorHelper: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
