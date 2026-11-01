import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useTheme } from '../../../theme/ThemeContext';

import { LuxuryHeader } from '../components/LuxuryHeader';
import { LuxuryCard } from '../components/LuxuryCard';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { AuthBanner } from '../components/AuthBanner';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { AuthFooterToggle } from '../components/AuthFooterToggle';
import { GetStartedScreen } from './GetStartedScreen';
import { AuthRole } from '../components/RoleSelector';

type AuthViewMode = 'ONBOARDING' | 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const LoginScreen: React.FC = () => {
  const { spacing, colors, typography } = useTheme();
  const {
    login,
    registerStudent,
    registerTeacher,
    forgotPassword,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const { setTab } = useNavigationStore();

  const [viewMode, setViewMode] = useState<AuthViewMode>('ONBOARDING');
  const [activeRole, setActiveRole] = useState<AuthRole>('STUDENT');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [subject, setSubject] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If currently in onboarding flow
  if (viewMode === 'ONBOARDING') {
    return (
      <GetStartedScreen
        onFinish={() => setViewMode('REGISTER')}
        onLoginPress={() => setViewMode('SIGN_IN')}
      />
    );
  }

  const handleSignIn = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Email address is required.');
      return;
    }
    if (!password) {
      setFormError('Password is required.');
      return;
    }

    try {
      await login({ email: cleanEmail, password });
      setTab(activeRole === 'STUDENT' ? 'student_dashboard' : 'teacher_dashboard');
    } catch {
      // Handled via useAuthStore error
    }
  };

  const handleRegister = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    const cleanEmail = email.trim();
    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!cleanEmail) {
      setFormError('Email address is required.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
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
          subject: subject.trim() || undefined,
          invitationCode: invitationCode.trim() || undefined,
        });
        setTab('teacher_dashboard');
      } catch {}
    }
  };

  const handleForgotPassword = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your registered email address.');
      return;
    }

    try {
      const res = await forgotPassword(cleanEmail);
      setSuccessMsg(res.message || 'Password reset link sent to your registered email.');
    } catch {}
  };

  const displayedError = formError || error;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand & Session Header */}
          <LuxuryHeader
            showBack={viewMode !== 'SIGN_IN'}
            onBack={() => {
              setFormError(null);
              setSuccessMsg(null);
              if (viewMode === 'FORGOT_PASSWORD') {
                setViewMode('SIGN_IN');
              } else {
                setViewMode('ONBOARDING');
              }
            }}
          />

          {/* Luxury Floating Paper Card */}
          <LuxuryCard>
            {/* Card Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={[styles.mainTitle, { color: colors.textPrimary, fontFamily: typography.fonts.display }]}>
                {viewMode === 'SIGN_IN' && 'Sign In'}
                {viewMode === 'REGISTER' && 'Create Account'}
                {viewMode === 'FORGOT_PASSWORD' && 'Reset Password'}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
                {viewMode === 'SIGN_IN' && 'Access your academic records, batches, or attendance.'}
                {viewMode === 'REGISTER' && 'Join as a student or register your teaching specialization.'}
                {viewMode === 'FORGOT_PASSWORD' && 'Enter your email to verify and reset your credentials.'}
              </Text>
            </View>

            {/* Auth Mode Toggle (Sign In vs Register) */}
            {(viewMode === 'SIGN_IN' || viewMode === 'REGISTER') && (
              <SegmentedToggle
                options={[
                  { key: 'SIGN_IN', label: 'Sign In' },
                  { key: 'REGISTER', label: 'Create Account' },
                ]}
                activeKey={viewMode}
                onSelect={(k) => {
                  setFormError(null);
                  setSuccessMsg(null);
                  clearError();
                  setViewMode(k);
                }}
              />
            )}

            {/* Role Toggle for Register */}
            {viewMode === 'REGISTER' && (
              <SegmentedToggle
                options={[
                  { key: 'STUDENT', label: 'Student' },
                  { key: 'TEACHER', label: 'Faculty / Teacher' },
                ]}
                activeKey={activeRole}
                onSelect={(r) => {
                  setActiveRole(r);
                  clearError();
                  setFormError(null);
                }}
              />
            )}

            {/* Notification Banners */}
            <AuthBanner type="error" message={displayedError} />
            <AuthBanner type="success" message={successMsg} />

            {/* Active View Form */}
            {viewMode === 'SIGN_IN' && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSignIn}
                onForgotPassword={() => {
                  setFormError(null);
                  setSuccessMsg(null);
                  clearError();
                  setViewMode('FORGOT_PASSWORD');
                }}
                isLoading={isLoading}
              />
            )}

            {viewMode === 'REGISTER' && (
              <RegisterForm
                activeRole={activeRole}
                fullName={fullName}
                setFullName={setFullName}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                phone={phone}
                setPhone={setPhone}
                invitationCode={invitationCode}
                setInvitationCode={setInvitationCode}
                subject={subject}
                setSubject={setSubject}
                onSubmit={handleRegister}
                isLoading={isLoading}
              />
            )}

            {viewMode === 'FORGOT_PASSWORD' && (
              <ForgotPasswordForm
                email={email}
                setEmail={setEmail}
                onSubmit={handleForgotPassword}
                onBackToLogin={() => {
                  setFormError(null);
                  setSuccessMsg(null);
                  clearError();
                  setViewMode('SIGN_IN');
                }}
                isLoading={isLoading}
              />
            )}
          </LuxuryCard>

          {/* Bottom Footer switch link */}
          {viewMode !== 'FORGOT_PASSWORD' && (
            <AuthFooterToggle
              mode={viewMode === 'SIGN_IN' ? 'SIGN_IN' : 'REGISTER'}
              onToggle={() => {
                setFormError(null);
                setSuccessMsg(null);
                clearError();
                setViewMode(viewMode === 'SIGN_IN' ? 'REGISTER' : 'SIGN_IN');
              }}
            />
          )}
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
  titleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
