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
  const { colors, typography, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const pwdInputRef = useRef<TextInput>(null);

  const emailBorder = emailError
    ? colors.error
    : emailFocused
    ? colors.primary
    : colors.borderSubtle;

  const pwdBorder = passwordError
    ? colors.error
    : pwdFocused
    ? colors.primary
    : colors.borderSubtle;

  const fieldBg = isDark ? colors.surfaceSubtle : '#F8FAFC';

  return (
    <View style={styles.container}>
      {/* Email Address */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Email Address
        </Text>
        <Pressable
          onPress={() => emailInputRef.current?.focus()}
          style={[
            styles.inputWrapper,
            {
              backgroundColor: fieldBg,
              borderColor: emailBorder,
            },
            emailFocused && styles.focusedGlow,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <MailIcon color={emailFocused ? colors.primary : colors.textMuted} size={16} />
          </View>
          <TextInput
            ref={emailInputRef}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
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
        </Pressable>
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
        <Pressable
          onPress={() => pwdInputRef.current?.focus()}
          style={[
            styles.inputWrapper,
            {
              backgroundColor: fieldBg,
              borderColor: pwdBorder,
            },
            pwdFocused && styles.focusedGlow,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <LockIcon color={pwdFocused ? colors.primary : colors.textMuted} size={16} />
          </View>
          <TextInput
            ref={pwdInputRef}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
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
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            editable={!isLoading}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={12}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '600' }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </Pressable>
        {passwordError ? (
          <Text style={[styles.errorHelper, { color: colors.error, fontFamily: typography.fonts.ui }]}>
            {passwordError}
          </Text>
        ) : null}
      </View>

      {/* Submit Action */}
      <Pressable
        onPress={onSubmit}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.submitBtn,
          {
            backgroundColor: colors.primary,
            opacity: isLoading ? 0.7 : pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
      >
        <Text style={[styles.submitText, { fontFamily: typography.fonts.ui }]}>
          {isLoading ? 'Signing In...' : 'Sign In'}
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  pwdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  focusedGlow: {
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 8,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    paddingVertical: 4,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  errorHelper: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
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
