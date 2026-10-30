import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label } from '../../../components/common/Typography';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useTheme } from '../../../theme/ThemeContext';

type ActiveRole = 'STUDENT' | 'TEACHER';
type AuthMode = 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const LoginScreen: React.FC = () => {
  const { colors, spacing, radii, typography } = useTheme();
  const {
    login,
    registerStudent,
    registerTeacher,
    forgotPassword,
    loginDemo,
    loginDemoTeacher,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const { setTab } = useNavigationStore();

  const [activeRole, setActiveRole] = useState<ActiveRole>('STUDENT');
  const [authMode, setAuthMode] = useState<AuthMode>('SIGN_IN');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [subject, setSubject] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Email address is required.');
      return;
    }

    if (authMode === 'FORGOT_PASSWORD') {
      try {
        const res = await forgotPassword(cleanEmail);
        setSuccessMsg(res.message || 'Password reset link sent to your registered email.');
      } catch {
        // error stored in zustand
      }
      return;
    }

    if (!password) {
      setFormError('Password is required.');
      return;
    }

    if (authMode === 'REGISTER') {
      if (!fullName.trim()) {
        setFormError('Full name is required.');
        return;
      }

      if (activeRole === 'STUDENT') {
        try {
          await registerStudent({
            fullName: fullName.trim(),
            email: cleanEmail,
            password,
            phone: phone.trim() || undefined,
            invitationCode: invitationCode.trim() || undefined,
          });
          setTab('student_dashboard');
        } catch {}
      } else {
        try {
          await registerTeacher({
            fullName: fullName.trim(),
            email: cleanEmail,
            password,
            phone: phone.trim() || undefined,
            subject: subject.trim() || 'General Faculty',
          });
          setTab('teacher_dashboard');
        } catch {}
      }
      return;
    }

    // SIGN_IN mode
    try {
      await login({
        email: cleanEmail,
        password,
      });

      if (activeRole === 'TEACHER') {
        setTab('teacher_dashboard');
      } else {
        setTab('student_dashboard');
      }
    } catch {
      // Error is stored in useAuthStore
    }
  };

  const handleDemoStudentLogin = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();
    try {
      await loginDemo();
      setTab('student_dashboard');
    } catch {}
  };

  const handleDemoTeacherLogin = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();
    try {
      await loginDemoTeacher();
      setTab('teacher_dashboard');
    } catch {}
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={[styles.header, { marginBottom: spacing.xl }]}>
            <View
              style={[
                styles.brandLogo,
                { backgroundColor: colors.primary, borderRadius: radii.md },
              ]}
            >
              <Text style={[styles.brandLogoText, { fontFamily: typography.fonts.display }]}>P</Text>
            </View>
            <Title style={{ fontFamily: typography.fonts.display, textAlign: 'center' }}>
              PadhaiPilot
            </Title>
            <Caption style={{ textAlign: 'center', color: colors.textMuted, marginTop: spacing.xs }}>
              Unified Tuition & Academic Mobile Suite
            </Caption>
          </View>

          {/* Role Selector Tabs */}
          <View
            style={[
              styles.roleSelector,
              {
                backgroundColor: colors.surfaceSubtle,
                borderRadius: radii.lg,
                padding: spacing.xs,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setActiveRole('STUDENT');
                clearError();
                setFormError(null);
              }}
              style={[
                styles.roleTab,
                {
                  borderRadius: radii.md,
                  backgroundColor: activeRole === 'STUDENT' ? colors.surface : 'transparent',
                },
              ]}
            >
              <Label
                style={{
                  color: activeRole === 'STUDENT' ? colors.primary : colors.textMuted,
                  fontWeight: activeRole === 'STUDENT' ? '700' : '500',
                  fontFamily: typography.fonts.ui,
                }}
              >
                Student Portal
              </Label>
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveRole('TEACHER');
                clearError();
                setFormError(null);
              }}
              style={[
                styles.roleTab,
                {
                  borderRadius: radii.md,
                  backgroundColor: activeRole === 'TEACHER' ? colors.surface : 'transparent',
                },
              ]}
            >
              <Label
                style={{
                  color: activeRole === 'TEACHER' ? colors.primary : colors.textMuted,
                  fontWeight: activeRole === 'TEACHER' ? '700' : '500',
                  fontFamily: typography.fonts.ui,
                }}
              >
                Teacher / Faculty
              </Label>
            </Pressable>
          </View>

          {/* Authentication Card */}
          <Card style={[styles.formCard, { padding: spacing.xl, borderRadius: radii.xl }]}>
            <View style={styles.cardHeader}>
              <Subtitle style={{ fontFamily: typography.fonts.display, fontSize: typography.sizes.lg }}>
                {authMode === 'SIGN_IN' && `Sign In as ${activeRole === 'STUDENT' ? 'Student' : 'Faculty'}`}
                {authMode === 'REGISTER' && `New ${activeRole === 'STUDENT' ? 'Student' : 'Faculty'} Account`}
                {authMode === 'FORGOT_PASSWORD' && 'Reset Password'}
              </Subtitle>
              <Badge
                variant={activeRole === 'STUDENT' ? 'primary' : 'warning'}
                label={activeRole === 'STUDENT' ? 'Classroom' : 'Faculty Pass'}
              />
            </View>

            {/* Error or Success Alert */}
            {(formError || error) && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.errorSubtle, borderRadius: radii.md },
                ]}
              >
                <Caption style={{ color: colors.error, fontWeight: '600' }}>
                  {formError || error}
                </Caption>
              </View>
            )}

            {successMsg && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.successSubtle, borderRadius: radii.md },
                ]}
              >
                <Caption style={{ color: colors.success, fontWeight: '600' }}>
                  {successMsg}
                </Caption>
              </View>
            )}

            {/* Registration Fields */}
            {authMode === 'REGISTER' && (
              <View style={[styles.inputGroup, { marginBottom: spacing.md }]}>
                <Input
                  label="Full Name"
                  placeholder="e.g. Aarav Patel"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Universal Email Input */}
            <View style={[styles.inputGroup, { marginBottom: spacing.md }]}>
              <Input
                label="Registered Email"
                placeholder={activeRole === 'STUDENT' ? 'student@padhaipilot.com' : 'teacher@padhaipilot.com'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone (optional during registration) */}
            {authMode === 'REGISTER' && (
              <View style={[styles.inputGroup, { marginBottom: spacing.md }]}>
                <Input
                  label="Contact Phone (Optional)"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            {/* Invitation Code (Students) or Subject (Teachers) */}
            {authMode === 'REGISTER' && activeRole === 'STUDENT' && (
              <View style={[styles.inputGroup, { marginBottom: spacing.md }]}>
                <Input
                  label="Tuition Invitation Code (Optional)"
                  placeholder="e.g. APEX-JEE-2026"
                  value={invitationCode}
                  onChangeText={setInvitationCode}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {authMode === 'REGISTER' && activeRole === 'TEACHER' && (
              <View style={[styles.inputGroup, { marginBottom: spacing.md }]}>
                <Input
                  label="Primary Teaching Subject"
                  placeholder="e.g. Mathematics / Physics"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>
            )}

            {/* Password Field (except in forgot password mode) */}
            {authMode !== 'FORGOT_PASSWORD' && (
              <View style={[styles.inputGroup, { marginBottom: spacing.md }]}>
                <Input
                  label="Password"
                  placeholder="••••••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            )}

            {/* Action Button */}
            <Button
              title={
                isLoading
                  ? 'Verifying...'
                  : authMode === 'SIGN_IN'
                  ? 'Sign In to Workspace'
                  : authMode === 'REGISTER'
                  ? 'Create Verified Account'
                  : 'Send Reset Link'
              }
              onPress={handleSubmit}
              loading={isLoading}
              variant="primary"
              style={{ marginTop: spacing.sm }}
            />

            {/* Toggles between Sign In, Register, Forgot Password */}
            <View style={[styles.toggleContainer, { marginTop: spacing.lg }]}>
              {authMode === 'SIGN_IN' ? (
                <>
                  <Pressable
                    onPress={() => {
                      setAuthMode('FORGOT_PASSWORD');
                      setFormError(null);
                      setSuccessMsg(null);
                    }}
                  >
                    <Caption style={{ color: colors.primary, fontWeight: '600' }}>
                      Forgot Password?
                    </Caption>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setAuthMode('REGISTER');
                      setFormError(null);
                      setSuccessMsg(null);
                    }}
                  >
                    <Caption style={{ color: colors.primary, fontWeight: '600' }}>
                      New user? Register here
                    </Caption>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={() => {
                    setAuthMode('SIGN_IN');
                    setFormError(null);
                    setSuccessMsg(null);
                  }}
                  style={{ alignSelf: 'center' }}
                >
                  <Caption style={{ color: colors.primary, fontWeight: '600' }}>
                    Already have an account? Sign In
                  </Caption>
                </Pressable>
              )}
            </View>
          </Card>

          {/* Quick Demo Access Bar */}
          <View style={[styles.demoSection, { marginTop: spacing.xl }]}>
            <Caption style={{ textAlign: 'center', color: colors.textMuted, marginBottom: spacing.sm }}>
              Instant Demo Access for Testing
            </Caption>
            <View style={styles.demoButtonsRow}>
              <Button
                title="⚡ Demo Student (Aarav)"
                variant="outline"
                size="small"
                onPress={handleDemoStudentLogin}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="⚡ Demo Faculty (Prof. Sharma)"
                variant="outline"
                size="small"
                onPress={handleDemoTeacherLogin}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  brandLogo: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#1677FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  brandLogoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleSelector: {
    flexDirection: 'row',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBox: {
    padding: 10,
    marginBottom: 12,
  },
  inputGroup: {
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoSection: {
    width: '100%',
  },
  demoButtonsRow: {
    flexDirection: 'row',
  },
});
