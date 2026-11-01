import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { MailIcon, LockIcon } from './AuthFieldIcons';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  emailError?: string | null;
  password: string;
  setPassword: (val: string) => void;
  passwordError?: string | null;
  onSubmit: () => void;
  onForgotPassword: () => void;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  emailError,
  password,
  setPassword,
  passwordError,
  onSubmit,
  onForgotPassword,
  isLoading,
}) => {
  const { colors, radii, typography } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const pwdInputRef = useRef<TextInput>(null);

  const emailBorder = emailError
    ? colors.error
    : emailFocused
    ? colors.primary
    : colors.borderStrong;

  const pwdBorder = passwordError
    ? colors.error
    : pwdFocused
    ? colors.primary
    : colors.borderStrong;

  return (
    <View style={styles.container}>
      {/* Email Address */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Email Address
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: emailBorder,
              borderRadius: radii.lg,
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
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                fontFamily: typography.fonts.ui,
              },
            ]}
            placeholder="name@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => pwdInputRef.current?.focus()}
            editable={!isLoading}
          />
        </View>
        {emailError ? (
          <Text style={[styles.errorHelper, { color: colors.error, fontFamily: typography.fonts.ui }]}>
            {emailError}
          </Text>
        ) : null}
      </View>

      {/* Password */}
      <View style={styles.fieldGroup}>
        <View style={styles.pwdHeader}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
            Password
          </Text>
          <Pressable onPress={onForgotPassword} hitSlop={10}>
            <Text style={[styles.forgotLink, { color: colors.primary, fontFamily: typography.fonts.ui }]}>
              Forgot password?
            </Text>
          </Pressable>
        </View>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: pwdBorder,
              borderRadius: radii.lg,
            },
            pwdFocused && styles.focusedGlow,
          ]}
        >
          <Pressable
            onPress={() => pwdInputRef.current?.focus()}
            hitSlop={8}
            style={styles.inputIconContainer}
          >
            <LockIcon color={pwdFocused ? colors.primary : colors.textMuted} size={16} />
          </Pressable>
          <TextInput
            ref={pwdInputRef}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                fontFamily: typography.fonts.ui,
              },
            ]}
            placeholder="••••••••"
            placeholderTextColor={colors.textFaint}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPwdFocused(true)}
            onBlur={() => setPwdFocused(false)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            editable={!isLoading}
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={10}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontFamily: typography.fonts.ui,
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </Pressable>
        </View>
        {passwordError ? (
          <Text style={[styles.errorHelper, { color: colors.error, fontFamily: typography.fonts.ui }]}>
            {passwordError}
          </Text>
        ) : null}
      </View>

      {/* Submit Button */}
      <Pressable
        onPress={onSubmit}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.submitBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: radii.lg,
            opacity: isLoading ? 0.7 : pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
      >
        <Text style={[styles.submitText, { fontFamily: typography.fonts.ui }]}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Text>
        {!isLoading && <Text style={styles.submitArrow}>→</Text>}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  pwdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
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
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  errorHelper: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  submitBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  submitArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
});
