import React, { useState } from 'react';
import {
  View,
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

export const LoginScreen: React.FC = () => {
  const { colors, spacing, radii } = useTheme();
  const { login, loginDemo, loginDemoTeacher, isLoading, error, clearError } = useAuthStore();
  const { setTab } = useNavigationStore();

  const [activeRole, setActiveRole] = useState<ActiveRole>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async () => {
    setFormError(null);
    clearError();

    const cleanId = identifier.trim();
    if (!cleanId) {
      setFormError('Please enter your email or registered phone number.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      await login({
        email: cleanId.includes('@') ? cleanId : undefined,
        phone: !cleanId.includes('@') ? cleanId : undefined,
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
    clearError();
    try {
      await loginDemo();
      setTab('student_dashboard');
    } catch {
      // Error handled
    }
  };

  const handleDemoTeacherLogin = async () => {
    setFormError(null);
    clearError();
    try {
      await loginDemoTeacher();
      setTab('teacher_dashboard');
    } catch {
      // Error handled
    }
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
              <Label style={{ color: colors.primaryContrast, fontSize: 18, fontWeight: 'bold' }}>
                P
              </Label>
            </View>
            <Title style={{ marginTop: spacing.sm, marginBottom: spacing.xxs }}>PadhaiPilot</Title>
            <Caption>
              {activeRole === 'STUDENT'
                ? 'Student Academic Portal'
                : 'Faculty & Teacher Administration'}
            </Caption>
          </View>

          {/* Role Segmented Selector */}
          <View
            style={[
              styles.segmentedContainer,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderRadius: radii.lg,
                marginBottom: spacing.xl,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setActiveRole('STUDENT');
                setIdentifier('');
                setPassword('');
                setFormError(null);
              }}
              style={[
                styles.segmentedBtn,
                {
                  backgroundColor: activeRole === 'STUDENT' ? colors.primary : 'transparent',
                  borderRadius: radii.md,
                },
              ]}
            >
              <Label
                style={{
                  color: activeRole === 'STUDENT' ? colors.primaryContrast : colors.textSecondary,
                  fontSize: 12,
                }}
              >
                Student Portal
              </Label>
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveRole('TEACHER');
                setIdentifier('');
                setPassword('');
                setFormError(null);
              }}
              style={[
                styles.segmentedBtn,
                {
                  backgroundColor: activeRole === 'TEACHER' ? colors.primary : 'transparent',
                  borderRadius: radii.md,
                },
              ]}
            >
              <Label
                style={{
                  color: activeRole === 'TEACHER' ? colors.primaryContrast : colors.textSecondary,
                  fontSize: 12,
                }}
              >
                Faculty Portal
              </Label>
            </Pressable>
          </View>

          {/* Form */}
          <View style={[styles.form, { marginBottom: spacing.xl }]}>
            <Input
              label={activeRole === 'STUDENT' ? 'Student Email or Mobile' : 'Faculty Work Email'}
              placeholder={
                activeRole === 'STUDENT'
                  ? 'e.g. student@padhaipilot.com'
                  : 'e.g. teacher@padhaipilot.com'
              }
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (formError) setFormError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              placeholder="Enter your account password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (formError) setFormError(null);
              }}
              secureTextEntry
            />

            {(formError || error) && (
              <Caption color={colors.error} style={{ marginBottom: spacing.md }}>
                {formError || error}
              </Caption>
            )}

            <Button
              title={activeRole === 'STUDENT' ? 'Sign In as Student' : 'Sign In as Faculty'}
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={{ marginTop: spacing.xs }}
            />
          </View>

          {/* 1-Tap Quick Demo Access */}
          <View
            style={[
              styles.demoContainer,
              { borderColor: colors.borderSubtle, paddingTop: spacing.lg },
            ]}
          >
            {activeRole === 'STUDENT' ? (
              <Button
                title="Try Demo Student Account"
                variant="secondary"
                onPress={handleDemoStudentLogin}
                loading={isLoading}
                size="md"
              />
            ) : (
              <Button
                title="Try Demo Faculty Account"
                variant="secondary"
                onPress={handleDemoTeacherLogin}
                loading={isLoading}
                size="md"
              />
            )}
            <Caption align="center" style={{ marginTop: spacing.xs }}>
              Instant one-tap preview with real academic test evaluations
            </Caption>
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    width: '100%',
  },
  demoContainer: {
    width: '100%',
    borderTopWidth: 1,
  },
});
