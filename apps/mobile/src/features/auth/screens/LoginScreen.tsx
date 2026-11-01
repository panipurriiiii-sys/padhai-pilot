import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/common/Card';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useTheme } from '../../../theme/ThemeContext';

import { AuthHeader } from '../components/AuthHeader';
import { RoleSelector, AuthRole } from '../components/RoleSelector';
import { AuthBanner } from '../components/AuthBanner';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { DemoCredentialsBox } from '../components/DemoCredentialsBox';
import { AuthFooterToggle } from '../components/AuthFooterToggle';
import { GetStartedScreen } from './GetStartedScreen';

type AuthViewMode = 'ONBOARDING' | 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const LoginScreen: React.FC = () => {
  const { spacing } = useTheme();
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

  const handleDemoStudent = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();
    try {
      await loginDemo();
      setTab('student_dashboard');
    } catch {}
  };

  const handleDemoTeacher = async () => {
    setFormError(null);
    setSuccessMsg(null);
    clearError();
    try {
      await loginDemoTeacher();
      setTab('teacher_dashboard');
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
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'FORGOT_PASSWORD' ? (
            <AuthHeader
              title="Reset Password"
              subtitle="Recover access to your academic account"
              showBack
              onBack={() => {
                setFormError(null);
                setSuccessMsg(null);
                setViewMode('SIGN_IN');
              }}
            />
          ) : viewMode === 'REGISTER' ? (
            <AuthHeader
              title="Create Account"
              subtitle="Join as a Student or Faculty member"
              showBack
              onBack={() => setViewMode('ONBOARDING')}
            />
          ) : (
            <AuthHeader
              title="Welcome Back"
              subtitle="Sign in to your tuition dashboard"
              showBack
              onBack={() => setViewMode('ONBOARDING')}
            />
          )}

          {viewMode !== 'FORGOT_PASSWORD' && (
            <RoleSelector
              activeRole={activeRole}
              onSelectRole={(r) => {
                setActiveRole(r);
                clearError();
                setFormError(null);
              }}
            />
          )}

          <AuthBanner type="error" message={displayedError} />
          <AuthBanner type="success" message={successMsg} />

          <Card variant="default" style={[styles.card, { padding: spacing.lg }]}>
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
          </Card>

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

          {viewMode === 'SIGN_IN' && (
            <DemoCredentialsBox
              activeRole={activeRole}
              onDemoStudent={handleDemoStudent}
              onDemoTeacher={handleDemoTeacher}
              isLoading={isLoading}
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
  card: {
    width: '100%',
  },
});
