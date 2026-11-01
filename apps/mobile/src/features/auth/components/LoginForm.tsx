import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { Button } from '../../../components/common/Button';
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
  const { colors, radii, typography, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Email Input */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          EMAIL ADDRESS
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surface,
              borderColor: emailFocused ? colors.primary : colors.borderStrong,
              borderRadius: radii.md,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="rohan.verma@tuition.edu"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.fieldGroup}>
        <View style={styles.pwdHeader}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
            PASSWORD
          </Text>
          <Pressable onPress={onForgotPassword} hitSlop={8}>
            <Text style={[styles.forgotLink, { color: colors.primary, fontFamily: typography.fonts.ui }]}>
              Forgot password?
            </Text>
          </Pressable>
        </View>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surface,
              borderColor: pwdFocused ? colors.primary : colors.borderStrong,
              borderRadius: radii.md,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="••••••••••••"
            placeholderTextColor={colors.textFaint}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPwdFocused(true)}
            onBlur={() => setPwdFocused(false)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={8}
            style={styles.eyeBtn}
          >
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Button
        title="Sign In to Portal →"
        variant="primary"
        size="lg"
        onPress={onSubmit}
        loading={isLoading}
        style={styles.submitBtn}
      />
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  submitBtn: {
    marginTop: 8,
  },
});
