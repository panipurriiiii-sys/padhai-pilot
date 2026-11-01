import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AuthRole } from './RoleSelector';
import { UserIcon, MailIcon, LockIcon, TagIcon, BookIcon } from './AuthFieldIcons';

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
  onFocusField?: (field: 'name' | 'email' | 'pwd' | 'phone' | 'extra') => void;
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
  onFocusField,
}) => {
  const { colors, typography, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const pwdInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const extraInputRef = useRef<TextInput>(null);

  const fieldBg = isDark ? colors.surfaceSubtle : '#FFFFFF';

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
              backgroundColor: fieldBg,
              borderColor: nameError ? colors.error : focusedField === 'name' ? colors.primary : colors.borderSubtle,
              borderRadius: 14,
            },
            focusedField === 'name' && styles.focusedGlow,
          ]}
        >
          <Pressable
            onPress={() => nameInputRef.current?.focus()}
            hitSlop={8}
            style={styles.inputIconContainer}
          >
            <UserIcon color={focusedField === 'name' ? colors.primary : colors.textMuted} size={16} />
          </Pressable>
          <TextInput
            ref={nameInputRef}
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder={activeRole === 'STUDENT' ? 'e.g. Alok Verma' : 'e.g. Dr. Rajesh Gupta'}
            placeholderTextColor={colors.textFaint}
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => {
              setFocusedField('name');
              onFocusField?.('name');
            }}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            editable={!isLoading}
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
              backgroundColor: fieldBg,
              borderColor: emailError ? colors.error : focusedField === 'email' ? colors.primary : colors.borderSubtle,
              borderRadius: 14,
            },
            focusedField === 'email' && styles.focusedGlow,
          ]}
        >
          <Pressable
            onPress={() => emailInputRef.current?.focus()}
            hitSlop={8}
            style={styles.inputIconContainer}
          >
            <MailIcon color={focusedField === 'email' ? colors.primary : colors.textMuted} size={16} />
          </Pressable>
          <TextInput
            ref={emailInputRef}
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="name@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => {
              setFocusedField('email');
              onFocusField?.('email');
            }}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
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
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Password
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: fieldBg,
              borderColor: passwordError ? colors.error : focusedField === 'pwd' ? colors.primary : colors.borderSubtle,
              borderRadius: 14,
            },
            focusedField === 'pwd' && styles.focusedGlow,
          ]}
        >
          <Pressable
            onPress={() => pwdInputRef.current?.focus()}
            hitSlop={8}
            style={styles.inputIconContainer}
          >
            <LockIcon color={focusedField === 'pwd' ? colors.primary : colors.textMuted} size={16} />
          </Pressable>
          <TextInput
            ref={pwdInputRef}
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="Min. 8 characters"
            placeholderTextColor={colors.textFaint}
            value={password}
            onChangeText={setPassword}
            onFocus={() => {
              setFocusedField('pwd');
              onFocusField?.('pwd');
            }}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => phoneInputRef.current?.focus()}
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

      {/* Phone Number (Optional) */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          Phone Number <Text style={styles.optionalLabel}>(Optional)</Text>
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: fieldBg,
              borderColor: focusedField === 'phone' ? colors.primary : colors.borderSubtle,
              borderRadius: 14,
            },
            focusedField === 'phone' && styles.focusedGlow,
          ]}
        >
          <Pressable
            onPress={() => phoneInputRef.current?.focus()}
            hitSlop={8}
            style={styles.inputIconContainer}
          >
            <TagIcon color={focusedField === 'phone' ? colors.primary : colors.textMuted} size={16} />
          </Pressable>
          <TextInput
            ref={phoneInputRef}
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.textFaint}
            value={phone}
            onChangeText={setPhone}
            onFocus={() => {
              setFocusedField('phone');
              onFocusField?.('phone');
            }}
            onBlur={() => setFocusedField(null)}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => extraInputRef.current?.focus()}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Role specific input: Student = Invitation Code, Teacher = Subject */}
      {activeRole === 'STUDENT' ? (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
            Batch Invitation Code <Text style={styles.optionalLabel}>(Optional)</Text>
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: fieldBg,
                borderColor: codeError ? colors.error : focusedField === 'code' ? colors.primary : colors.borderSubtle,
                borderRadius: 14,
              },
              focusedField === 'code' && styles.focusedGlow,
            ]}
          >
            <Pressable
              onPress={() => extraInputRef.current?.focus()}
              hitSlop={8}
              style={styles.inputIconContainer}
            >
              <TagIcon color={focusedField === 'code' ? colors.primary : colors.textMuted} size={16} />
            </Pressable>
            <TextInput
              ref={extraInputRef}
              style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
              placeholder="e.g. APEX-PHYS-2026"
              placeholderTextColor={colors.textFaint}
              value={invitationCode}
              onChangeText={setInvitationCode}
              onFocus={() => {
                setFocusedField('code');
                onFocusField?.('extra');
              }}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              editable={!isLoading}
            />
          </View>
          {codeError ? (
            <Text style={[styles.errorHelper, { color: colors.error, fontFamily: typography.fonts.ui }]}>
              {codeError}
            </Text>
          ) : (
            <Text style={[styles.helperText, { color: colors.textMuted, fontFamily: typography.fonts.ui }]}>
              You can also join a batch later from your profile.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
            Teaching Subject <Text style={styles.optionalLabel}>(Optional)</Text>
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: fieldBg,
                borderColor: subjectError ? colors.error : focusedField === 'subject' ? colors.primary : colors.borderSubtle,
                borderRadius: 14,
              },
              focusedField === 'subject' && styles.focusedGlow,
            ]}
          >
            <Pressable
              onPress={() => extraInputRef.current?.focus()}
              hitSlop={8}
              style={styles.inputIconContainer}
            >
              <BookIcon color={focusedField === 'subject' ? colors.primary : colors.textMuted} size={16} />
            </Pressable>
            <TextInput
              ref={extraInputRef}
              style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
              placeholder="e.g. Advanced Physics"
              placeholderTextColor={colors.textFaint}
              value={subject}
              onChangeText={setSubject}
              onFocus={() => {
                setFocusedField('subject');
                onFocusField?.('extra');
              }}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              editable={!isLoading}
            />
          </View>
          {subjectError ? (
            <Text style={[styles.errorHelper, { color: colors.error, fontFamily: typography.fonts.ui }]}>
              {subjectError}
            </Text>
          ) : null}
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
            borderRadius: 14,
            opacity: isLoading ? 0.7 : pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create account"
      >
        <Text style={[styles.submitText, { fontFamily: typography.fonts.ui }]}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
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
  optionalLabel: {
    fontWeight: '400',
    opacity: 0.7,
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
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  errorHelper: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
  },
  submitBtn: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
