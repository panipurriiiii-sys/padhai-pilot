import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption } from '../../../components/common/Typography';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../theme/ThemeContext';

export const ProfileScreen: React.FC = () => {
  const { colors, spacing, preference, setPreference } = useTheme();
  const { session, logout } = useAuthStore();

  const user = session?.user;

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
      >
        <View style={[styles.header, { marginBottom: spacing.xl }]}>
          <Title>Student Profile</Title>
          <Caption style={{ marginTop: spacing.xxs }}>
            Account and device settings
          </Caption>
        </View>

        {/* Student Card */}
        <Card variant="flat" style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
          <View style={[styles.profileRow, { marginBottom: spacing.md }]}>
            <View style={{ flex: 1 }}>
              <Subtitle>{user?.name || 'Student Name'}</Subtitle>
              <Caption style={{ marginTop: spacing.xxs }}>
                {user?.email || 'No email provided'}
              </Caption>
            </View>
            <Badge label={user?.role || 'STUDENT'} variant="primary" />
          </View>

          <View style={[styles.infoGrid, { borderTopColor: colors.borderSubtle, borderTopWidth: 1, paddingTop: spacing.md }]}>
            <View style={styles.infoCol}>
              <Caption>Institute</Caption>
              <Body style={{ fontWeight: '500', marginTop: spacing.xxs }}>
                {user?.instituteName || 'Tuition Center'}
              </Body>
            </View>
            <View style={styles.infoCol}>
              <Caption>Roll Number</Caption>
              <Body style={{ fontWeight: '500', marginTop: spacing.xxs }}>
                {user?.rollNumber || '--'}
              </Body>
            </View>
          </View>
        </Card>

        {/* Theme Preference */}
        <View style={{ marginBottom: spacing.xl }}>
          <Subtitle style={{ marginBottom: spacing.sm }}>Appearance</Subtitle>
          <Card variant="outlined" style={{ padding: spacing.md }}>
            <View style={styles.themeRow}>
              {(['system', 'light', 'dark'] as const).map((pref) => {
                const isSelected = preference === pref;
                return (
                  <Pressable
                    key={pref}
                    onPress={() => setPreference(pref)}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Body
                      style={{
                        color: isSelected ? colors.primaryContrast : colors.textSecondary,
                        fontWeight: isSelected ? '600' : '400',
                        textTransform: 'capitalize',
                        fontSize: 13,
                      }}
                    >
                      {pref}
                    </Body>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {__DEV__ && (
        {/* System info */}
        <View style={{ marginBottom: spacing.lg }}>
          <Subtitle style={{ marginBottom: spacing.xs }}>Role Switcher</Subtitle>
          <Caption style={{ marginBottom: spacing.sm }}>
            Preview the faculty interface with bulk marks entry, study material upload, and teaching diary.
          </Caption>
          <Button
            title="Preview Faculty Portal"
            variant="secondary"
            onPress={async () => {
              const { loginDemoTeacher } = useAuthStore.getState();
              await loginDemoTeacher();
            }}
          />
        </View>
        )}

        <View style={{ marginBottom: spacing.xl }}>
          <Caption align="center">PadhaiPilot Mobile v1.0.0</Caption>
          <Caption align="center" style={{ marginTop: spacing.xxs }}>
            React Native CLI • Live Cloudflare Worker CDN
          </Caption>
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          variant="danger"
          onPress={logout}
          size="lg"
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  header: {},
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoGrid: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
});

