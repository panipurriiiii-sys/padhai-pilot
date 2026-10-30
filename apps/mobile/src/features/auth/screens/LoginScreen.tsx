import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Title, Body, Caption } from '../../../components/common/Typography';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../theme/ThemeContext';

export const LoginScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { login, loginDemo, isLoading, error, clearError } = useAuthStore();

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
    } catch {
      // Error is set in store
    }
  };

  const handleDemoLogin = async () => {
    setFormError(null);
    clearError();
    try {
      await loginDemo();
    } catch {
      // Error is set in store
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
          {/* Header */}
          <View style={[styles.header, { marginBottom: spacing.xxxl }]}>
            <Title style={{ marginBottom: spacing.xs }}>PadhaiPilot</Title>
            <Body>Student & Parent Portal</Body>
          </View>

          {/* Form */}
          <View style={[styles.form, { marginBottom: spacing.xxl }]}>
            <Input
              label="Email or Mobile"
              placeholder="e.g. 9876543210 or student@school.com"
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
              <Caption
                color={colors.error}
                style={{ marginBottom: spacing.md }}
              >
                {formError || error}
              </Caption>
            )}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={{ marginTop: spacing.xs }}
            />
          </View>

          {/* 1-Tap Demo Student Login */}
          <View style={[styles.demoContainer, { borderColor: colors.borderSubtle, paddingTop: spacing.xl }]}>
            <Button
              title="Quick Demo Student Sign In"
              variant="secondary"
              onPress={handleDemoLogin}
              loading={isLoading}
              size="md"
            />
            <Caption align="center" style={{ marginTop: spacing.sm }}>
              Instant preview with live classroom evaluation data
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
    alignItems: 'flex-start',
  },
  form: {
    width: '100%',
  },
  demoContainer: {
    width: '100%',
    borderTopWidth: 1,
  },
});

