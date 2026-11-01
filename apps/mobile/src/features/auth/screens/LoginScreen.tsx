import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useTheme } from '../../../theme/ThemeContext';

import { LuxuryHeader } from '../components/LuxuryHeader';
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

  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [viewMode, setViewMode] = useState<AuthViewMode>('ONBOARDING');
  const [activeRole, setActiveRole] = useState<AuthRole>('STUDENT');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [subject, setSubject] = useState('');

  // Field validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic keyboard height listener to guarantee inputs never get hidden
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFieldFocus = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: yOffset,
        animated: true,
      });
    }, 120);
  };

  const clearValidation = () => {
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setBannerError(null);
    setSuccessMsg(null);
    clearError();
  };

  // If currently in onboarding flow
  if (viewMode === 'ONBOARDING') {
    return (
      <GetStartedScreen
        onFinish={() => {
          clearValidation();
          setViewMode('REGISTER');
        }}
        onLoginPress={() => {
          clearValidation();
          setViewMode('SIGN_IN');
        }}
      />
    );
  }

  const handleSignIn = async () => {
    clearValidation();
    let hasError = false;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your email address.');
      hasError = true;
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      hasError = true;
    }

    if (hasError) return;

    try {
      await login({ email: cleanEmail, password });
      setTab('student_dashboard'); // RootNavigator auto-adjusts based on teacher vs student role
    } catch (err: any) {
      setBannerError(err?.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleRegister = async () => {
    clearValidation();
    let hasError = false;

    const cleanName = fullName.trim();
    if (!cleanName) {
      setNameError('Please enter your full name.');
      hasError = true;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your email address.');
      hasError = true;
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please create a password.');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      hasError = true;
    }

    if (hasError) return;

    try {
      if (activeRole === 'STUDENT') {
        await registerStudent({
          fullName: cleanName,
          email: cleanEmail,
          password,
          phone: phone.trim() || undefined,
          invitationCode: invitationCode.trim() || undefined,
        });
      } else {
        await registerTeacher({
          fullName: cleanName,
          email: cleanEmail,
          password,
          phone: phone.trim() || undefined,
          subject: subject.trim() || 'General',
        });
      }
      setTab('student_dashboard');
    } catch (err: any) {
      setBannerError(err?.message || 'Registration failed. Please check your details.');
    }
  };

  const handleForgotPassword = async () => {
    clearValidation();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your registered email.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await forgotPassword(cleanEmail);
      setSuccessMsg(res.message || 'Password reset link sent to your registered email.');
    } catch (err: any) {
      setBannerError(err?.message || 'Unable to process reset request. Please verify email.');
    }
  };

  const displayedBanner = bannerError || error;

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: spacing.lg,
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 60,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Header */}
          <LuxuryHeader
            showBack={viewMode !== 'SIGN_IN'}
            onBack={() => {
              clearValidation();
              if (viewMode === 'FORGOT_PASSWORD') {
                setViewMode('SIGN_IN');
              } else {
                setViewMode('ONBOARDING');
              }
            }}
          />

          {/* Clean Open Form Flow (Not Boxy, No Heavy Enclosing Cards) */}
          <View style={styles.formContainer}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={[styles.mainTitle, { color: colors.textPrimary, fontFamily: typography.fonts.display }]}>
                {viewMode === 'SIGN_IN' && 'Welcome back'}
                {viewMode === 'REGISTER' && 'Create your account'}
                {viewMode === 'FORGOT_PASSWORD' && 'Reset password'}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.textSecondary, fontFamily: typography.fonts.ui }]}>
                {viewMode === 'SIGN_IN' && 'Enter your credentials to access your academic portal.'}
                {viewMode === 'REGISTER' && 'Join your batch to access attendance, tests, and homework.'}
                {viewMode === 'FORGOT_PASSWORD' && 'Enter your registered email to receive a reset code.'}
              </Text>
            </View>

            {/* Segmented Switcher for Login / Register */}
            {(viewMode === 'SIGN_IN' || viewMode === 'REGISTER') && (
              <SegmentedToggle
                options={[
                  { key: 'SIGN_IN', label: 'Sign In' },
                  { key: 'REGISTER', label: 'Create Account' },
                ]}
                activeKey={viewMode}
                onSelect={(k) => {
                  clearValidation();
                  setViewMode(k);
                }}
              />
            )}

            {/* Role Switcher in Register Mode */}
            {viewMode === 'REGISTER' && (
              <SegmentedToggle
                options={[
                  { key: 'STUDENT', label: 'Student' },
                  { key: 'TEACHER', label: 'Teacher / Faculty' },
                ]}
                activeKey={activeRole}
                onSelect={(r) => {
                  clearValidation();
                  setActiveRole(r);
                }}
              />
            )}

            {/* Status Alerts */}
            <AuthBanner type="error" message={displayedBanner} onDismiss={() => setBannerError(null)} />
            <AuthBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />

            {/* Form Views */}
            {viewMode === 'SIGN_IN' && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                emailError={emailError}
                password={password}
                setPassword={setPassword}
                passwordError={passwordError}
                onSubmit={handleSignIn}
                onForgotPassword={() => {
                  clearValidation();
                  setViewMode('FORGOT_PASSWORD');
                }}
                isLoading={isLoading}
                onFocusField={(field) => {
                  if (field === 'email') handleFieldFocus(40);
                  if (field === 'password') handleFieldFocus(120);
                }}
              />
            )}

            {viewMode === 'REGISTER' && (
              <RegisterForm
                activeRole={activeRole}
                fullName={fullName}
                setFullName={setFullName}
                nameError={nameError}
                email={email}
                setEmail={setEmail}
                emailError={emailError}
                password={password}
                setPassword={setPassword}
                passwordError={passwordError}
                phone={phone}
                setPhone={setPhone}
                invitationCode={invitationCode}
                setInvitationCode={setInvitationCode}
                subject={subject}
                setSubject={setSubject}
                onSubmit={handleRegister}
                isLoading={isLoading}
                onFocusField={(field) => {
                  if (field === 'name') handleFieldFocus(60);
                  if (field === 'email') handleFieldFocus(140);
                  if (field === 'pwd') handleFieldFocus(220);
                  if (field === 'phone') handleFieldFocus(300);
                  if (field === 'extra') handleFieldFocus(380);
                }}
              />
            )}

            {viewMode === 'FORGOT_PASSWORD' && (
              <ForgotPasswordForm
                email={email}
                setEmail={setEmail}
                emailError={emailError}
                onSubmit={handleForgotPassword}
                onBackToLogin={() => {
                  clearValidation();
                  setViewMode('SIGN_IN');
                }}
                isLoading={isLoading}
                onFocusField={() => handleFieldFocus(60)}
              />
            )}
          </View>

          {/* Bottom Footer switch link */}
          {viewMode !== 'FORGOT_PASSWORD' && (
            <AuthFooterToggle
              mode={viewMode === 'SIGN_IN' ? 'SIGN_IN' : 'REGISTER'}
              onToggle={() => {
                clearValidation();
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
    paddingTop: 10,
  },
  formContainer: {
    width: '100%',
    paddingVertical: 8,
  },
  titleSection: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  mainTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'left',
  },
  mainSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
});
