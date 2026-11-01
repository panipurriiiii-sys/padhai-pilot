import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { Button } from '../../../components/common/Button';
import { useTheme } from '../../../theme/ThemeContext';
import { MailIcon } from './AuthFieldIcons';

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
  const emailInputRef = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      <Text style={[styles.guideText, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
        Enter your registered email address to receive password reset instructions.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Email Address
        </Text>
        <Pressable
          onPress={() => emailInputRef.current?.focus()}
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: emailError ? colors.error : emailFocused ? colors.primary : colors.borderStrong,
              borderRadius: radii.lg,
            },
            emailFocused && styles.focusedGlow,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <MailIcon color={emailFocused ? colors.primary : colors.textMuted} size={16} />
          </View>
          <TextInput
            ref={emailInputRef}
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="name@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            editable={!isLoading}
          />
        </Pressable>
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
    borderWidth: 1.2,
    paddingHorizontal: 12,
    height: 48,
  },
  focusedGlow: {
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 10,
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  errorHelper: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
