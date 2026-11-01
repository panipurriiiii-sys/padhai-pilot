import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Caption } from '../../../components/common/Typography';
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
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <Input
        label="Full Name"
        placeholder="e.g. Dr. Ramesh Sharma"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />

      <Input
        label="Email Address"
        placeholder="e.g. ramesh@tuition.edu"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Input
        label="Password (min 6 characters)"
        placeholder="Choose a strong password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Input
        label="Contact Phone (Optional)"
        placeholder="e.g. +91 98765 43210"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {activeRole === 'STUDENT' ? (
        <View>
          <Input
            label="Institute / Batch Enrollment Code"
            placeholder="e.g. BATCH-2026-X"
            value={invitationCode}
            onChangeText={setInvitationCode}
            autoCapitalize="characters"
          />
          <Caption
            style={{
              color: colors.textMuted,
              marginTop: -spacing.xs,
              marginBottom: spacing.md,
            }}
          >
            Enter the 6-character or custom enrollment code provided by your teacher.
          </Caption>
        </View>
      ) : (
        <View>
          <Input
            label="Teaching Subject / Specialization"
            placeholder="e.g. Advanced Physics / Mathematics"
            value={subject}
            onChangeText={setSubject}
          />
          <Input
            label="Faculty Invitation Code"
            placeholder="Optional invite code if joining an institute"
            value={invitationCode}
            onChangeText={setInvitationCode}
            autoCapitalize="characters"
          />
        </View>
      )}

      <Button
        title={`Register as ${activeRole === 'STUDENT' ? 'Student' : 'Faculty'}`}
        variant="primary"
        size="lg"
        onPress={onSubmit}
        loading={isLoading}
        style={{ marginTop: spacing.xs }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
