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
  onFocusField?: (field: 'email') => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  setEmail,
  emailError,
  onSubmit,
  onBackToLogin,
  isLoading,
  onFocusField,
}) => {
  const { colors, typography, spacing, isDark } = useTheme();
  const [emailFocused, setEmailFocused] = useState(false);
  const emailInputRef = useRef<TextInput>(null);

  const fieldBg = isDark ? colors.surfaceSubtle : '#FFFFFF';

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
              backgroundColor: fieldBg,
              borderColor: emailError ? colors.error : emailFocused ? colors.primary : colors.borderSubtle,
              borderRadius: 14,
            },
            emailFocused && styles.focusedGlow,
          ]}
        >
          <Pressable
            onPress={() => emailInputRef.current?.focus()}
            hitSlop={8}
            style={styles.inputIconContainer}
          >
            <MailIcon color={emailFocused ? colors.primary : colors.textMuted} size={16} />
          </Pressable>
          <TextInput
            ref={emailInputRef}
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="name@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => {
              setEmailFocused(true);
              onFocusField?.('email');
            }}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            editable={!isLoading}
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
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
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
    height: 50,
  },
  focusedGlow: {
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 10,
    width: 20,
    height: '100%',
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
