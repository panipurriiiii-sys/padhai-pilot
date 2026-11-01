import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { Button } from '../../../components/common/Button';
import { useTheme } from '../../../theme/ThemeContext';
import { AuthRole } from './RoleSelector';

interface RegisterFormProps {
  activeRole: AuthRole;
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  invitationCode: string;
  setInvitationCode: (val: string) => void;
  subject: string;
  setSubject: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  activeRole,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  phone,
  setPhone,
  invitationCode,
  setInvitationCode,
  subject,
  setSubject,
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
          FULL NAME
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surface,
              borderColor: focusedField === 'name' ? colors.primary : colors.borderStrong,
              borderRadius: radii.md,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder={activeRole === 'STUDENT' ? 'Rohan Verma' : 'Dr. Ramesh Sharma'}
            placeholderTextColor={colors.textFaint}
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Email */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          EMAIL ADDRESS
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surface,
              borderColor: focusedField === 'email' ? colors.primary : colors.borderStrong,
              borderRadius: radii.md,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
            placeholder="rohan@tuition.edu"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      {/* Password */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
          PASSWORD (MIN 6 CHARACTERS)
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surface,
              borderColor: focusedField === 'password' ? colors.primary : colors.borderStrong,
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
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} style={styles.eyeBtn}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Role specific inputs */}
      {activeRole === 'STUDENT' ? (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
            ENROLLMENT CODE (OPTIONAL)
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: focusedField === 'code' ? colors.primary : colors.borderStrong,
                borderRadius: radii.md,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fonts.ui }]}
              placeholder="e.g. BATCH-X"
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
            TEACHING SUBJECT
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: focusedField === 'subject' ? colors.primary : colors.borderStrong,
                borderRadius: radii.md,
              },
            ]}
          >
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

      <Button
        title={`Create ${activeRole === 'STUDENT' ? 'Student' : 'Faculty'} Account →`}
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
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
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
