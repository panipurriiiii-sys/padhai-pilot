import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../../services/api/client';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Card } from '../../../components/common/Card';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../theme/ThemeContext';
import { errorMessage } from '../../../lib/format';
import { parseDeepLink } from '../../../lib/deepLinks';

/** Pending faculty invitation token received through padhaipilot://join-faculty?token=... */
export const usePendingFacultyInvite = create<{ token: string | null; set: (t: string | null) => void }>((set) => ({
  token: null,
  set: (token) => set({ token }),
}));

/** Returns true when the URL was a faculty-invite link (and stores its token). */
export function captureFacultyInvite(url: string | null | undefined): boolean {
  const parsed = parseDeepLink(url);
  if (parsed?.target !== 'join-faculty') return false;
  const token = parsed.params.token?.trim();
  if (token && token.length >= 16 && token.length <= 512) usePendingFacultyInvite.getState().set(token);
  return true;
}

interface Preview {
  valid: boolean;
  instituteName: string;
  email: string;
  fullName?: string | null;
  designation?: string | null;
}

/** Accept a faculty invitation: public preview, then POST /faculty-invitations/accept, then sign in. */
export const FacultyJoinScreen: React.FC<{ token: string }> = ({ token }) => {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const clear = () => usePendingFacultyInvite.getState().set(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient
      .get<Preview>(`/faculty-invitations/${encodeURIComponent(token)}`)
      .then((p) => {
        if (!active) return;
        setPreview(p);
        setFullName(p.fullName ?? '');
      })
      .catch((e) => active && setLoadError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, [token]);

  const submit = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.post('/faculty-invitations/accept', {
        token,
        password,
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      clear();
      await login({ email: preview.email, password });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const text = (size: number, color: string, weight: '400' | '700' = '400') => ({
    fontFamily: typography.fonts.ui,
    fontSize: size,
    color,
    fontWeight: weight,
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
      >
        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
          <Text style={{ fontFamily: typography.fonts.display, fontSize: 26, fontWeight: '700', color: colors.textPrimary }}>Join as faculty</Text>
          {!preview && !loadError ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
          {loadError ? (
            <Card style={{ marginTop: 16 }}>
              <Text style={text(14, colors.error, '700')}>{loadError}</Text>
              <Text style={[text(12, colors.textMuted), { marginTop: 4 }]}>Ask your institute to send a fresh invitation.</Text>
              <Button title="Back to sign in" variant="outline" style={{ marginTop: 12 }} onPress={clear} />
            </Card>
          ) : null}
          {preview ? (
            <Card style={{ marginTop: 16 }}>
              <Text style={text(15, colors.textPrimary, '700')}>{preview.instituteName}</Text>
              <Text style={[text(12, colors.textMuted), { marginBottom: 12 }]}>
                {`${preview.designation ? `${preview.designation} · ` : ''}${preview.email}`}
              </Text>
              <Input label="Full name" value={fullName} onChangeText={setFullName} />
              <Input label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Input
                label="Password"
                hint="New account: choose a strong password. Existing account: enter your current password."
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                error={error}
              />
              <Button title="Accept invitation" loading={busy} disabled={password.length < 8} onPress={() => void submit()} />
              <Button title="Cancel" variant="ghost" style={{ marginTop: 8 }} onPress={clear} />
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
