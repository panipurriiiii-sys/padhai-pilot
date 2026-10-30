import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigationStore } from '../../store/useNavigationStore';
import {
  teacherService,
  TeacherInvitationItem,
} from '../../services/api/teacherService';
import type { BatchSummary, BatchStudentRoster } from '@padhai-pilot/shared';

export const TeacherClassesScreen: React.FC = () => {
  const { colors, spacing, radii, typography } = useTheme();
  const { setTab, setSelectedBatchId } = useNavigationStore();

  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchSummary | null>(null);
  const [roster, setRoster] = useState<BatchStudentRoster | null>(null);
  const [invitations, setInvitations] = useState<TeacherInvitationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Invitation Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMaxUses, setInviteMaxUses] = useState('30');
  const [inviteDays, setInviteDays] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [batchList, invList] = await Promise.all([
        teacherService.getBatches(),
        teacherService.getInvitations(),
      ]);
      setBatches(batchList);
      setInvitations(invList);
      if (batchList.length > 0) {
        setSelectedBatch(batchList[0]);
        const r = await teacherService.getBatchStudents(batchList[0].id);
        setRoster(r);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectBatch = async (batch: BatchSummary) => {
    setSelectedBatch(batch);
    const r = await teacherService.getBatchStudents(batch.id);
    setRoster(r);
  };

  const handleCreateInvite = async () => {
    if (!selectedBatch) return;
    setIsGenerating(true);
    try {
      const inv = await teacherService.createInvitation({
        batchId: selectedBatch.id,
        maxUses: parseInt(inviteMaxUses, 10) || 30,
        expiresInDays: parseInt(inviteDays, 10) || 30,
      });
      setMsg({ text: `Generated invitation code: ${inv.code}`, type: 'success' });
      setShowInviteModal(false);
      const updated = await teacherService.getInvitations();
      setInvitations(updated);
    } catch {
      setMsg({ text: 'Failed to generate invitation code', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeInvite = async (code: string) => {
    try {
      await teacherService.revokeInvitation(code);
      setMsg({ text: `Revoked code ${code}`, type: 'success' });
      const updated = await teacherService.getInvitations();
      setInvitations(updated);
    } catch {
      setMsg({ text: 'Failed to revoke code', type: 'error' });
    }
  };

  const filteredStudents = (roster?.students || []).filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header */}
        <View style={{ marginBottom: spacing.md }}>
          <Title style={{ fontFamily: typography.fonts.display }}>Classes & Roster</Title>
          <Caption>Assigned batches, student learners & invite codes</Caption>
        </View>

        {msg && (
          <View
            style={[
              styles.msgBanner,
              {
                backgroundColor: msg.type === 'success' ? colors.successSubtle : colors.errorSubtle,
                borderRadius: radii.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Caption style={{ color: msg.type === 'success' ? colors.success : colors.error, fontWeight: 'bold' }}>
              {msg.text}
            </Caption>
          </View>
        )}

        {/* Batch Pills Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
          <View style={styles.batchPillsRow}>
            {batches.map((b) => {
              const isSelected = selectedBatch?.id === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => handleSelectBatch(b)}
                  style={[
                    styles.batchPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: radii.lg,
                    },
                  ]}
                >
                  <Label
                    style={{
                      color: isSelected ? colors.primaryContrast : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '500',
                    }}
                  >
                    {b.name}
                  </Label>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Selected Batch Summary Card */}
        {selectedBatch && (
          <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
            <View style={styles.batchCardTop}>
              <View style={{ flex: 1 }}>
                <Subtitle style={{ fontFamily: typography.fonts.display }}>{selectedBatch.name}</Subtitle>
                <Caption style={{ fontVariant: ['tabular-nums'] }}>
                  Code: {selectedBatch.code} • {selectedBatch.gradeLevel} • {selectedBatch.studentCount} Students
                </Caption>
              </View>
              <Badge variant="primary" label={selectedBatch.subject || 'Core Subject'} />
            </View>

            <View style={[styles.actionRow, { marginTop: spacing.md }]}>
              <Button
                title="Mark Attendance"
                variant="primary"
                size="small"
                onPress={() => {
                  setSelectedBatchId(selectedBatch.id);
                  setTab('teacher_attendance');
                }}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="Generate Invite"
                variant="outline"
                size="small"
                onPress={() => setShowInviteModal(true)}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </Card>
        )}

        {/* Search Student Input */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <TextInput
            placeholder="Search students by name, roll number..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              { color: colors.textPrimary, fontFamily: typography.fonts.ui },
            ]}
          />
        </View>

        {/* Student Roster List */}
        <Subtitle style={{ marginBottom: spacing.sm, fontFamily: typography.fonts.display }}>
          Enrolled Learners ({filteredStudents.length})
        </Subtitle>

        {filteredStudents.map((st) => (
          <Card key={st.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.studentRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primarySubtle, borderRadius: radii.full },
                ]}
              >
                <Label style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {st.fullName.charAt(0)}
                </Label>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Label style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {st.fullName}
                </Label>
                <Caption style={{ fontVariant: ['tabular-nums'] }}>
                  {st.rollNumber} {st.email ? `• ${st.email}` : ''}
                </Caption>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Badge
                  variant={st.attendanceRate && st.attendanceRate >= 85 ? 'success' : 'warning'}
                  label={`${st.attendanceRate ?? 92}% Att.`}
                />
              </View>
            </View>
          </Card>
        ))}

        {/* Active Invitations List */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <Subtitle style={{ fontFamily: typography.fonts.display }}>Batch Invitation Codes</Subtitle>
          <Caption>Invite students directly into this tuition batch</Caption>
        </View>

        {invitations.map((inv) => (
          <Card key={inv.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.inviteRow}>
              <View style={{ flex: 1 }}>
                <Label style={{ fontFamily: typography.fonts.data, fontWeight: 'bold', color: colors.primary }}>
                  {inv.code}
                </Label>
                <Caption>
                  Uses: {inv.usedCount}/{inv.maxUses} • Expires: {inv.expiresAt}
                </Caption>
              </View>
              {inv.status === 'ACTIVE' ? (
                <Pressable
                  onPress={() => handleRevokeInvite(inv.code)}
                  style={[styles.revokeBtn, { borderColor: colors.error, borderRadius: radii.sm }]}
                >
                  <Caption style={{ color: colors.error, fontWeight: 'bold' }}>Revoke</Caption>
                </Pressable>
              ) : (
                <Badge variant="default" label={inv.status} />
              )}
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Modal: Generate Invitation Code */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border },
            ]}
          >
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Create Student Invitation
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>
              Generate an access code for {selectedBatch?.name}.
            </Caption>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Maximum Allowed Redemptions</Label>
              <TextInput
                keyboardType="numeric"
                value={inviteMaxUses}
                onChangeText={setInviteMaxUses}
                style={[
                  styles.modalInput,
                  { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md },
                ]}
              />
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Label style={{ marginBottom: 4 }}>Validity Duration (Days)</Label>
              <TextInput
                keyboardType="numeric"
                value={inviteDays}
                onChangeText={setInviteDays}
                style={[
                  styles.modalInput,
                  { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md },
                ]}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setShowInviteModal(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title={isGenerating ? 'Generating...' : 'Create Code'}
                variant="primary"
                size="small"
                onPress={handleCreateInvite}
                loading={isGenerating}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  msgBanner: {
    padding: 10,
  },
  batchPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  batchCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
  },
  searchBar: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    fontSize: 13,
    padding: 0,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revokeBtn: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  modalInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
});
