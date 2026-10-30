import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import {
  teacherService,
  FacultyLeaveRecord,
  FacultySalarySlip,
  TeacherTimetableSlot,
} from '../../services/api/teacherService';

type SubView = 'menu' | 'leave' | 'salary' | 'timetable';

export const TeacherMoreScreen: React.FC = () => {
  const { colors, spacing, radii, typography, isDark, setPreference, preference } = useTheme();
  const { session, logout } = useAuthStore();

  const [activeSubView, setActiveSubView] = useState<SubView>('menu');
  const [leaves, setLeaves] = useState<FacultyLeaveRecord[]>([]);
  const [salaries, setSalaries] = useState<FacultySalarySlip[]>([]);
  const [timetable, setTimetable] = useState<TeacherTimetableSlot[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Apply Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStart, setLeaveStart] = useState('2026-11-10');
  const [leaveEnd, setLeaveEnd] = useState('2026-11-11');
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'MEDICAL' | 'ACADEMIC' | 'EMERGENCY'>('CASUAL');
  const [leaveReason, setLeaveReason] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [lList, sList, tList, aList] = await Promise.all([
        teacherService.getLeaves(),
        teacherService.getSalaries(),
        teacherService.getTimetable(),
        teacherService.getAnnouncements(),
      ]);
      setLeaves(lList);
      setSalaries(sList);
      setTimetable(tList);
      setAnnouncements(aList);
    } catch {}
  };

  const handleApplyLeave = async () => {
    if (!leaveReason.trim()) return;
    setIsApplying(true);
    try {
      await teacherService.applyLeave({
        startDate: leaveStart,
        endDate: leaveEnd,
        leaveType,
        reason: leaveReason.trim(),
      });
      setToastMsg({ text: 'Leave application submitted for approval.', type: 'success' });
      setShowLeaveModal(false);
      setLeaveReason('');
      const updated = await teacherService.getLeaves();
      setLeaves(updated);
    } catch {
      setToastMsg({ text: 'Failed to submit leave application.', type: 'error' });
    } finally {
      setIsApplying(false);
    }
  };

  const facultyName = session?.user?.fullName || session?.user?.name || 'Prof. Rajesh Sharma';
  const email = session?.user?.email || 'teacher@padhaipilot.com';
  const instituteName = session?.user?.instituteName || 'Apex IIT-JEE & Medical Academy';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Navigation Breadcrumb / Top Bar */}
        {activeSubView !== 'menu' && (
          <Pressable
            onPress={() => setActiveSubView('menu')}
            style={[styles.backBtn, { marginBottom: spacing.md }]}
          >
            <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>◀ Back to Faculty Services</Caption>
          </Pressable>
        )}

        {toastMsg && (
          <View
            style={[
              styles.msgBanner,
              {
                backgroundColor: toastMsg.type === 'success' ? colors.successSubtle : colors.errorSubtle,
                borderRadius: radii.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Caption style={{ color: toastMsg.type === 'success' ? colors.success : colors.error, fontWeight: 'bold' }}>
              {toastMsg.text}
            </Caption>
          </View>
        )}

        {/* 1. MAIN MENU VIEW */}
        {activeSubView === 'menu' && (
          <>
            {/* Faculty Profile Summary Card */}
            <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
              <View style={styles.profileHeader}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primary, borderRadius: radii.full },
                  ]}
                >
                  <Title style={{ color: '#FFF', fontSize: 20 }}>{facultyName.charAt(0)}</Title>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Subtitle style={{ fontFamily: typography.fonts.display }}>{facultyName}</Subtitle>
                  <Caption>{email}</Caption>
                  <Caption style={{ color: colors.primary, fontWeight: 'bold', marginTop: 2 }}>
                    {instituteName}
                  </Caption>
                </View>
              </View>
            </Card>

            {/* Quick Links Menu */}
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.sm }}>
              Faculty Services & Records
            </Subtitle>

            <Card onPress={() => setActiveSubView('timetable')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Weekly Teaching Timetable</Label>
                  <Caption>Daily lecture slots, rooms & schedules</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            <Card onPress={() => setActiveSubView('leave')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Faculty Leave Self-Service</Label>
                  <Caption>Apply for leave, check approval status & history</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            <Card onPress={() => setActiveSubView('salary')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Salary Slips & Pay Statements</Label>
                  <Caption>Monthly salary breakdown & payment receipts</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            {/* Announcements Card */}
            <Subtitle style={{ fontFamily: typography.fonts.display, marginTop: spacing.md, marginBottom: spacing.sm }}>
              Institute Announcements ({announcements.length})
            </Subtitle>
            {announcements.map((anc) => (
              <Card key={anc.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{anc.title}</Label>
                  {anc.priority && <Badge variant="warning" label={anc.priority} />}
                </View>
                <Caption>{anc.content}</Caption>
              </Card>
            ))}

            {/* Theme & Logout Section */}
            <View style={{ marginTop: spacing.xl }}>
              <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.sm }}>
                App Preferences
              </Subtitle>

              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.menuRow}>
                  <Label style={{ fontWeight: '600', color: colors.textPrimary }}>Theme Appearance</Label>
                  <Pressable
                    onPress={() => setPreference(isDark ? 'light' : 'dark')}
                    style={[styles.themeToggle, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.md }]}
                  >
                    <Caption style={{ fontWeight: 'bold', color: colors.primary }}>
                      {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </Caption>
                  </Pressable>
                </View>
              </Card>

              <Button
                title="Sign Out from Mobile"
                variant="outline"
                onPress={logout}
                style={{ borderColor: colors.error }}
              />
            </View>
          </>
        )}

        {/* 2. LEAVE SELF-SERVICE VIEW */}
        {activeSubView === 'leave' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View>
                <Title style={{ fontFamily: typography.fonts.display }}>Leave Applications</Title>
                <Caption>Casual, medical and academic leave records</Caption>
              </View>
              <Button
                title="+ Apply"
                variant="primary"
                size="small"
                onPress={() => setShowLeaveModal(true)}
              />
            </View>

            {/* Leave Balance Chips */}
            <View style={[styles.balanceRow, { backgroundColor: colors.surfaceElevated, borderRadius: radii.lg, marginBottom: spacing.md }]}>
              <View style={styles.balanceItem}>
                <Label style={{ fontWeight: 'bold', color: colors.primary }}>10</Label>
                <Caption style={{ fontSize: 10 }}>Casual Left</Caption>
              </View>
              <View style={styles.balanceItem}>
                <Label style={{ fontWeight: 'bold', color: colors.success }}>7</Label>
                <Caption style={{ fontSize: 10 }}>Sick / Medical</Caption>
              </View>
              <View style={styles.balanceItem}>
                <Label style={{ fontWeight: 'bold', color: colors.accent }}>3</Label>
                <Caption style={{ fontSize: 10 }}>Academic</Caption>
              </View>
            </View>

            {/* Leave Requests List */}
            {leaves.map((lv) => (
              <Card key={lv.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>
                    {lv.leaveType} LEAVE ({lv.totalDays} Days)
                  </Label>
                  <Badge
                    variant={lv.status === 'APPROVED' ? 'success' : lv.status === 'REJECTED' ? 'error' : 'warning'}
                    label={lv.status}
                  />
                </View>
                <Caption style={{ fontVariant: ['tabular-nums'] }}>
                  {lv.startDate} to {lv.endDate}
                </Caption>
                <Caption style={{ marginTop: 2, color: colors.textSecondary }}>Reason: &quot;{lv.reason}&quot;</Caption>
                {lv.adminRemarks && (
                  <Caption style={{ color: colors.primary, fontStyle: 'italic', marginTop: 2 }}>
                    Admin Note: &quot;{lv.adminRemarks}&quot;
                  </Caption>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* 3. SALARY STATEMENTS VIEW */}
        {activeSubView === 'salary' && (
          <View>
            <Title style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Salary Statements
            </Title>
            <Caption style={{ marginBottom: spacing.md }}>
              Confidential monthly salary slips and payment records
            </Caption>

            {salaries.map((sal) => (
              <Card key={sal.id} variant="elevated" style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Subtitle style={{ fontFamily: typography.fonts.display }}>{sal.payPeriod}</Subtitle>
                  <Badge variant={sal.status === 'PAID' ? 'success' : 'warning'} label={sal.status} />
                </View>

                <View style={[styles.salaryDetails, { borderColor: colors.borderSubtle, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 8 }]}>
                  <View style={styles.salLine}>
                    <Caption>Basic Salary</Caption>
                    <Caption style={{ fontVariant: ['tabular-nums'], fontWeight: '600' }}>₹{sal.basicSalary.toLocaleString()}</Caption>
                  </View>
                  <View style={styles.salLine}>
                    <Caption>HRA</Caption>
                    <Caption style={{ fontVariant: ['tabular-nums'], fontWeight: '600' }}>₹{sal.hra.toLocaleString()}</Caption>
                  </View>
                  <View style={styles.salLine}>
                    <Caption>Special Allowances</Caption>
                    <Caption style={{ fontVariant: ['tabular-nums'], fontWeight: '600' }}>₹{sal.specialAllowance.toLocaleString()}</Caption>
                  </View>
                  <View style={styles.salLine}>
                    <Caption style={{ color: colors.error }}>Statutory Deductions (PF/Tax)</Caption>
                    <Caption style={{ fontVariant: ['tabular-nums'], color: colors.error }}>- ₹{sal.deductions.toLocaleString()}</Caption>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                  <Label style={{ fontWeight: 'bold' }}>Net Remitted</Label>
                  <Label style={{ color: colors.success, fontSize: 16, fontWeight: 'bold', fontVariant: ['tabular-nums'] }}>
                    ₹{sal.netPayable.toLocaleString()}
                  </Label>
                </View>
                {sal.transactionRef && (
                  <Caption style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
                    Txn Ref: {sal.transactionRef} • Paid on {sal.paidOn}
                  </Caption>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* 4. TIMETABLE VIEW */}
        {activeSubView === 'timetable' && (
          <View>
            <Title style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Teaching Schedule
            </Title>
            <Caption style={{ marginBottom: spacing.md }}>Assigned lecture timetable for this week</Caption>

            {timetable.map((tt) => (
              <Card key={tt.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{tt.batchName}</Label>
                    <Caption>{tt.subject} • {tt.room}</Caption>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Badge variant="primary" label={tt.dayOfWeek} />
                    <Caption style={{ marginTop: 2, fontVariant: ['tabular-nums'] }}>{tt.timeSlot}</Caption>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Apply for Leave */}
      <Modal visible={showLeaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Apply for Faculty Leave
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>Select leave category and dates</Caption>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Leave Type</Label>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['CASUAL', 'MEDICAL', 'ACADEMIC'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setLeaveType(t)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: leaveType === t ? colors.primary : colors.surfaceSubtle,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    <Caption style={{ color: leaveType === t ? '#FFF' : colors.textPrimary, fontWeight: 'bold' }}>
                      {t}
                    </Caption>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Label style={{ marginBottom: 4 }}>From Date</Label>
                <TextInput
                  value={leaveStart}
                  onChangeText={setLeaveStart}
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Label style={{ marginBottom: 4 }}>To Date</Label>
                <TextInput
                  value={leaveEnd}
                  onChangeText={setLeaveEnd}
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
                />
              </View>
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Reason for Leave *</Label>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Details of absence and lecture adjustment..."
                placeholderTextColor={colors.textMuted}
                value={leaveReason}
                onChangeText={setLeaveReason}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md, height: 70 }]}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setShowLeaveModal(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title={isApplying ? 'Submitting...' : 'Submit Application'}
                variant="primary"
                size="small"
                onPress={handleApplyLeave}
                loading={isApplying}
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
  backBtn: {
    paddingVertical: 4,
  },
  msgBanner: {
    padding: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  balanceItem: {
    alignItems: 'center',
  },
  salaryDetails: {
    gap: 4,
  },
  salLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderWidth: 1,
    padding: 20,
    elevation: 8,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
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

