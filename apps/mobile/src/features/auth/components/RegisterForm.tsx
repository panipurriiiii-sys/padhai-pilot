import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AuthRole } from './RoleSelector';

interface RegisterFormProps {
  activeRole: AuthRole;
  fullName: string;
  setFullName: (val: string) => void;
  nameError?: string | null;
  email: string;
  setEmail: (val: string) => void;
  emailError?: string | null;
  password: string;
  setPassword: (val: string) => void;
  passwordError?: string | null;
  phone: string;
  setPhone: (val: string) => void;
  invitationCode: string;
  setInvitationCode: (val: string) => void;
  codeError?: string | null;
  subject: string;
  setSubject: (val: string) => void;
  subjectError?: string | null;
  onSubmit: () => void;
  isLoading: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  activeRole,
  fullName,
  setFullName,
  nameError,
  email,
  setEmail,
  emailError,
  password,
  setPassword,
  passwordError,
  phone,
  setPhone,
  invitationCode,
  setInvitationCode,
  codeError,
  subject,
  setSubject,
  subjectError,
  onSubmit,
  isLoading,
}) => {
  const { colors, radii, typography } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Full Name
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: nameError ? colors.error : focusedField === 'name' ? colors.primary : colors.borderStrong,
              borderRadius: radii.lg,
            },
            focusedField === 'name' && styles.focusedGlow,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <Text style={[styles.inputIcon, { color: focusedField === 'name' ? colors.primary : colors.textMuted }]}>
              👤
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder={activeRole === 'STUDENT' ? 'e.g. Alok Verma' : 'e.g. Dr. Rajesh Gupta'}
            placeholderTextColor={colors.textFaint}
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
          />
        </View>
        {nameError ? (
          <Text style={[styles.errorHelper, { color: colors.error, fontFamily: typography.fonts.ui }]}>
            {nameError}
          </Text>
        ) : null}
      </View>

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
              borderColor: emailError ? colors.error : focusedField === 'email' ? colors.primary : colors.borderStrong,
              borderRadius: radii.lg,
            },
            focusedField === 'email' && styles.focusedGlow,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <Text style={[styles.inputIcon, { color: focusedField === 'email' ? colors.primary : colors.textMuted }]}>
              ✉
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="name@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
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

      {/* Password */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Password (min 6 characters)
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: passwordError ? colors.error : focusedField === 'password' ? colors.primary : colors.borderStrong,
              borderRadius: radii.lg,
            },
            focusedField === 'password' && styles.focusedGlow,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <Text style={[styles.inputIcon, { color: focusedField === 'password' ? colors.primary : colors.textMuted }]}>
              🔒
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="••••••••"
            placeholderTextColor={colors.textFaint}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12} style={styles.eyeBtn}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
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

      {/* Role-specific Fields */}
      {activeRole === 'STUDENT' ? (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
            Batch Enrollment Code
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: codeError ? colors.error : focusedField === 'code' ? colors.primary : colors.borderStrong,
                borderRadius: radii.lg,
              },
              focusedField === 'code' && styles.focusedGlow,
            ]}
          >
            <View style={styles.inputIconContainer}>
              <Text style={[styles.inputIcon, { color: focusedField === 'code' ? colors.primary : colors.textMuted }]}>
                🏷
              </Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
              placeholder="e.g. BATCH-2026-X"
              placeholderTextColor={colors.textFaint}
              value={invitationCode}
              onChangeText={setInvitationCode}
              onFocus={() => setFocusedField('code')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="characters"
            />
          </View>
        </View>
      ) : (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
            Teaching Subject
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: subjectError ? colors.error : focusedField === 'subject' ? colors.primary : colors.borderStrong,
                borderRadius: radii.lg,
              },
              focusedField === 'subject' && styles.focusedGlow,
            ]}
          >
            <View style={styles.inputIconContainer}>
              <Text style={[styles.inputIcon, { color: focusedField === 'subject' ? colors.primary : colors.textMuted }]}>
                📚
              </Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
              placeholder="e.g. Mathematics / Physics"
              placeholderTextColor={colors.textFaint}
              value={subject}
              onChangeText={setSubject}
              onFocus={() => setFocusedField('subject')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>
      )}

      {/* Submit Button */}
      <Pressable
        onPress={onSubmit}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.submitBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: radii.lg,
            opacity: pressed || isLoading ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <Text style={[styles.submitText, { fontFamily: typography.fonts.ui }]}>
          {isLoading ? 'Creating Account...' : `Create ${activeRole === 'STUDENT' ? 'Student' : 'Faculty'} Account`}
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
    marginBottom: 14,
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
    marginRight: 8,
    width: 20,
    alignItems: 'center',
  },
  inputIcon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
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
