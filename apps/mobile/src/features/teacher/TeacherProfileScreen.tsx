import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTheme } from '../../theme/ThemeContext';

export const TeacherProfileScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { session, logout, loginDemo } = useAuthStore();
  const { setTab } = useNavigationStore();

  const handleSwitchToStudent = async () => {
    await loginDemo();
    setTab('student_dashboard');
  };

  const name = session?.user?.fullName || session?.user?.name || '';
  const email = session?.user?.email || '';
  const instName = session?.user?.instituteName || '';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={{ marginBottom: spacing.md }}>
          <Badge label="FACULTY ACCOUNT" variant="primary" />
          <Title style={{ marginTop: 4 }}>Faculty Profile</Title>
          <Caption>PadhaiPilot Academic Operating System</Caption>
        </View>

        {/* Profile Card */}
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <Label style={{ fontSize: 18, color: colors.textPrimary, marginBottom: 2 }}>{name}</Label>
          <Caption style={{ marginBottom: spacing.md }}>{email}</Caption>

          <View style={[styles.infoRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1, paddingTop: spacing.sm }]}>
            <Caption>Role Designation</Caption>
            <Badge label="SENIOR FACULTY" variant="primary" />
          </View>

          <View style={[styles.infoRow, { paddingTop: spacing.xs }]}>
            <Caption>Institute</Caption>
            <Label style={{ color: colors.textPrimary, fontSize: 12 }}>{instName}</Label>
          </View>

          <View style={[styles.infoRow, { paddingTop: spacing.xs }]}>
            <Caption>Department</Caption>
            <Label style={{ color: colors.textPrimary, fontSize: 12 }}>Mathematics & Mechanics</Label>
          </View>
        </Card>

        {/* Switch Portal Sandbox (development builds only) */}
        {__DEV__ && (
        <Card style={{ marginBottom: spacing.lg }}>
          <Subtitle style={{ marginBottom: spacing.xs }}>Role Switcher</Subtitle>
          <Caption style={{ marginBottom: spacing.md }}>
            Preview the student experience with real-time test evaluations and learning materials.
          </Caption>
          <Button
            title="Preview Student Portal"
            variant="secondary"
            onPress={handleSwitchToStudent}
          />
        </Card>
        )}

        {/* Logout */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={logout}
          style={{ borderColor: colors.error }}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});

