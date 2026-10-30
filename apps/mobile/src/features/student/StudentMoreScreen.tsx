import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label, StatValue } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import {
  studentService,
  StudentFeeStructure,
  StudentTimetableDay,
  StudentPlannerTask,
  StudentDocumentItem,
  StudentDoubtThread,
} from '../../services/api/studentService';

type SubSection = 'menu' | 'fees' | 'timetable' | 'planner' | 'documents' | 'doubts' | 'join';

export const StudentMoreScreen: React.FC = () => {
  const { colors, spacing, radii, typography, isDark, setPreference } = useTheme();
  const { session, logout, joinInstitute } = useAuthStore();

  const [activeSub, setActiveSub] = useState<SubSection>('menu');
  const [feeData, setFeeData] = useState<StudentFeeStructure | null>(null);
  const [timetable, setTimetable] = useState<StudentTimetableDay[]>([]);
  const [plannerTasks, setPlannerTasks] = useState<StudentPlannerTask[]>([]);
  const [documents, setDocuments] = useState<StudentDocumentItem[]>([]);
  const [doubts, setDoubts] = useState<StudentDoubtThread[]>([]);

  // Add Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('Today');
  const [taskCategory, setTaskCategory] = useState<'HOMEWORK' | 'REVISION' | 'EXAM_PREP'>('HOMEWORK');

  // Ask Doubt Modal
  const [showDoubtModal, setShowDoubtModal] = useState(false);
  const [doubtSubject, setDoubtSubject] = useState('Mathematics');
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Join Institute Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [f, tt, pl, doc, dbt] = await Promise.all([
        studentService.getFees(),
        studentService.getTimetable(),
        studentService.getPlannerTasks(),
        studentService.getDocuments(),
        studentService.getDoubts(),
      ]);
      setFeeData(f);
      setTimetable(tt);
      setPlannerTasks(pl);
      setDocuments(doc);
      setDoubts(dbt);
    } catch {}
  };

  const handleToggleTask = (taskId: string) => {
    setPlannerTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)),
    );
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      const newTask = await studentService.addPlannerTask({
        title: taskTitle.trim(),
        dueDate: taskDueDate,
        category: taskCategory,
      });
      setPlannerTasks((prev) => [newTask, ...prev]);
      setShowTaskModal(false);
      setTaskTitle('');
    } catch {}
  };

  const handleAskDoubt = async () => {
    if (!doubtQuestion.trim()) return;
    setIsAsking(true);
    try {
      const newDoubt = await studentService.askDoubt(doubtSubject, doubtQuestion.trim());
      setDoubts((prev) => [newDoubt, ...prev]);
      setToastMsg({ text: 'Doubt sent to faculty members!', type: 'success' });
      setShowDoubtModal(false);
      setDoubtQuestion('');
    } catch {
      setToastMsg({ text: 'Failed to post doubt.', type: 'error' });
    } finally {
      setIsAsking(false);
    }
  };

  const handleRedeemInvite = async () => {
    if (!inviteCode.trim()) return;
    setIsJoining(true);
    try {
      const res = await joinInstitute(inviteCode.trim());
      setToastMsg({ text: res.message || 'Successfully joined new tuition batch!', type: 'success' });
      setShowJoinModal(false);
      setInviteCode('');
    } catch (err: any) {
      setToastMsg({ text: err.message || 'Invalid or expired invitation code', type: 'error' });
    } finally {
      setIsJoining(false);
    }
  };

  const studentName = session?.user?.fullName || session?.user?.name || 'Aarav Patel';
  const instituteName = session?.user?.instituteName || 'Apex IIT-JEE & Medical Academy';
  const rollNumber = session?.user?.rollNumber || 'APX-2026-001';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Back Button */}
        {activeSub !== 'menu' && (
          <Pressable
            onPress={() => setActiveSub('menu')}
            style={[styles.backBtn, { marginBottom: spacing.md }]}
          >
            <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>◀ Back to Student Services</Caption>
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
        {activeSub === 'menu' && (
          <>
            {/* Student Profile Card */}
            <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
              <View style={styles.profileRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primary, borderRadius: radii.full }]}>
                  <Title style={{ color: '#FFF', fontSize: 20 }}>{studentName.charAt(0)}</Title>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Subtitle style={{ fontFamily: typography.fonts.display }}>{studentName}</Subtitle>
                  <Caption style={{ fontVariant: ['tabular-nums'] }}>Roll: {rollNumber}</Caption>
                  <Caption style={{ color: colors.primary, fontWeight: 'bold', marginTop: 2 }}>
                    {instituteName}
                  </Caption>
                </View>
              </View>

              <Button
                title="+ Join Another Batch / Institute"
                variant="outline"
                size="small"
                onPress={() => setShowJoinModal(true)}
                style={{ marginTop: 12 }}
              />
            </Card>

            {/* Menu Links */}
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.sm }}>
              Student Services
            </Subtitle>

            <Card onPress={() => setActiveSub('fees')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Fees & Payment Receipts</Label>
                  <Caption>Installments, pending dues & official receipts</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            <Card onPress={() => setActiveSub('timetable')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Class Timetable & Schedule</Label>
                  <Caption>Weekly lectures, teacher assignments & rooms</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            <Card onPress={() => setActiveSub('planner')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Personal Study Planner</Label>
                  <Caption>Daily tasks, homework checklist & exam countdown</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            <Card onPress={() => setActiveSub('doubts')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Faculty Doubts Clinic</Label>
                  <Caption>Ask academic doubts & view faculty answers</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            <Card onPress={() => setActiveSub('documents')} style={{ marginBottom: spacing.sm }}>
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>Official Document Center</Label>
                  <Caption>Download certificates, fee receipts & report cards</Caption>
                </View>
                <Label style={{ color: colors.primary }}>▶</Label>
              </View>
            </Card>

            {/* Settings & Sign Out */}
            <View style={{ marginTop: spacing.xl }}>
              <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.sm }}>
                Preferences
              </Subtitle>

              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.menuRow}>
                  <Label style={{ fontWeight: '600', color: colors.textPrimary }}>Appearance</Label>
                  <Pressable
                    onPress={() => setPreference(isDark ? 'light' : 'dark')}
                    style={[styles.themePill, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.md }]}
                  >
                    <Caption style={{ fontWeight: 'bold', color: colors.primary }}>
                      {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </Caption>
                  </Pressable>
                </View>
              </Card>

              <Button
                title="Sign Out from Account"
                variant="outline"
                onPress={logout}
                style={{ borderColor: colors.error }}
              />
            </View>
          </>
        )}

        {/* 2. FEES VIEW */}
        {activeSub === 'fees' && feeData && (
          <View>
            <Title style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Tuition Fees & Receipts
            </Title>
            <Caption style={{ marginBottom: spacing.md }}>Fee breakdown and verified payment receipts</Caption>

            {/* Total Status Card */}
            <Card variant="elevated" style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Caption>TOTAL PAYABLE</Caption>
                  <StatValue color={colors.textPrimary}>₹{feeData.totalFee.toLocaleString()}</StatValue>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Caption>OUTSTANDING</Caption>
                  <StatValue color={feeData.pendingBalance > 0 ? colors.warning : colors.success}>
                    ₹{feeData.pendingBalance.toLocaleString()}
                  </StatValue>
                </View>
              </View>
            </Card>

            {/* Installments List */}
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.sm }}>
              Installment Schedule
            </Subtitle>

            {feeData.installments.map((inst) => (
              <Card key={inst.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{inst.title}</Label>
                    <Caption>Due: {inst.dueDate}</Caption>
                    {inst.receiptNumber && (
                      <Caption style={{ color: colors.primary, fontWeight: '600', marginTop: 2 }}>
                        Receipt: {inst.receiptNumber}
                      </Caption>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Label style={{ fontWeight: 'bold', fontSize: 16, fontVariant: ['tabular-nums'] }}>
                      ₹{inst.amount.toLocaleString()}
                    </Label>
                    <Badge variant={inst.status === 'PAID' ? 'success' : 'warning'} label={inst.status} />
                  </View>
                </View>
              </Card>
            ))}

            {/* Bank Details Card */}
            <Card style={{ marginTop: spacing.md }}>
              <Label style={{ fontWeight: 'bold', marginBottom: 4 }}>Tuition Remittance Bank Info</Label>
              <Caption>A/C Name: {feeData.bankDetails.accountName}</Caption>
              <Caption>A/C Number: {feeData.bankDetails.accountNumber}</Caption>
              <Caption>IFSC: {feeData.bankDetails.ifscCode}</Caption>
              <Caption style={{ color: colors.primary, fontWeight: 'bold', marginTop: 2 }}>
                UPI ID: {feeData.bankDetails.upiId}
              </Caption>
            </Card>
          </View>
        )}

        {/* 3. TIMETABLE VIEW */}
        {activeSub === 'timetable' && (
          <View>
            <Title style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Weekly Timetable
            </Title>
            <Caption style={{ marginBottom: spacing.md }}>Scheduled lectures and classroom assignments</Caption>

            {timetable.map((day, idx) => (
              <View key={idx} style={{ marginBottom: spacing.md }}>
                <Subtitle style={{ fontFamily: typography.fonts.display, fontSize: 16, marginBottom: spacing.xs }}>
                  {day.dayOfWeek}
                </Subtitle>
                {day.slots.map((slot) => (
                  <Card key={slot.id} style={{ marginBottom: spacing.xs }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{slot.subject}</Label>
                        <Caption>{slot.teacherName} • {slot.room}</Caption>
                      </View>
                      <Badge variant="primary" label={slot.timeSlot} />
                    </View>
                  </Card>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* 4. STUDY PLANNER VIEW */}
        {activeSub === 'planner' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View>
                <Title style={{ fontFamily: typography.fonts.display }}>Study Planner</Title>
                <Caption>Checklist, revision tasks & countdowns</Caption>
              </View>
              <Button
                title="+ Add Task"
                variant="primary"
                size="small"
                onPress={() => setShowTaskModal(true)}
              />
            </View>

            {/* Countdown Badge */}
            <Card variant="elevated" style={{ marginBottom: spacing.md, backgroundColor: colors.primarySubtle }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Label style={{ fontWeight: 'bold', color: colors.primary }}>JEE Advanced 2027</Label>
                  <Caption>National Engineering Entrance</Caption>
                </View>
                <Label style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                  45 Days
                </Label>
              </View>
            </Card>

            {/* Tasks List */}
            {plannerTasks.map((t) => (
              <Card
                key={t.id}
                onPress={() => handleToggleTask(t.id)}
                style={{ marginBottom: spacing.sm }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: t.isCompleted ? colors.success : colors.border,
                        backgroundColor: t.isCompleted ? colors.success : 'transparent',
                        borderRadius: radii.xs,
                      },
                    ]}
                  >
                    {t.isCompleted && <Caption style={{ color: '#FFF', fontSize: 10 }}>✓</Caption>}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Label
                      style={{
                        fontWeight: '600',
                        color: t.isCompleted ? colors.textMuted : colors.textPrimary,
                        textDecorationLine: t.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </Label>
                    <Caption>Due: {t.dueDate} • {t.category}</Caption>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* 5. DOUBTS CLINIC VIEW */}
        {activeSub === 'doubts' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View>
                <Title style={{ fontFamily: typography.fonts.display }}>Doubts Clinic</Title>
                <Caption>Direct faculty Q&A and concept clarification</Caption>
              </View>
              <Button
                title="+ Ask Doubt"
                variant="primary"
                size="small"
                onPress={() => setShowDoubtModal(true)}
              />
            </View>

            {doubts.map((d) => (
              <Card key={d.id} variant="elevated" style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Badge variant="primary" label={d.subject} />
                  <Badge variant={d.status === 'RESOLVED' ? 'success' : 'warning'} label={d.status} />
                </View>

                <Label style={{ fontWeight: '700', marginVertical: 4, color: colors.textPrimary }}>
                  Q: {d.question}
                </Label>

                {d.answer ? (
                  <View style={[styles.ansBox, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.md, padding: 10, marginTop: 6 }]}>
                    <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>
                      {d.facultyName || 'Faculty Answer'}:
                    </Caption>
                    <Body style={{ fontSize: 13, marginTop: 2, color: colors.textPrimary }}>{d.answer}</Body>
                  </View>
                ) : (
                  <Caption style={{ fontStyle: 'italic', marginTop: 4 }}>Awaiting faculty response...</Caption>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* 6. DOCUMENTS VIEW */}
        {activeSub === 'documents' && (
          <View>
            <Title style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              My Official Documents
            </Title>
            <Caption style={{ marginBottom: spacing.md }}>Published report cards, fee receipts and certificates</Caption>

            {documents.map((doc) => (
              <Card key={doc.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{doc.title}</Label>
                    <Caption>Issued: {doc.issueDate} {doc.fileSize ? `• ${doc.fileSize}` : ''}</Caption>
                  </View>
                  <Button
                    title="Download"
                    variant="outline"
                    size="small"
                    onPress={() => Linking.openURL(doc.fileUrl).catch(() => {})}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Add Planner Task */}
      <Modal visible={showTaskModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Add Study Task
            </Subtitle>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Task Description</Label>
              <TextInput
                placeholder="e.g. Solve 20 questions on Vectors"
                placeholderTextColor={colors.textMuted}
                value={taskTitle}
                onChangeText={setTaskTitle}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Due</Label>
              <TextInput
                placeholder="e.g. Today / Tomorrow"
                placeholderTextColor={colors.textMuted}
                value={taskDueDate}
                onChangeText={setTaskDueDate}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setShowTaskModal(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="Add Task"
                variant="primary"
                size="small"
                onPress={handleAddTask}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Ask Doubt */}
      <Modal visible={showDoubtModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Ask Faculty Doubt
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>Your question will be sent directly to subject faculty</Caption>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Subject</Label>
              <TextInput
                value={doubtSubject}
                onChangeText={setDoubtSubject}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Your Question *</Label>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Specific doubt or formula derivation question..."
                placeholderTextColor={colors.textMuted}
                value={doubtQuestion}
                onChangeText={setDoubtQuestion}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md, height: 70 }]}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setShowDoubtModal(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title={isAsking ? 'Sending...' : 'Send Doubt'}
                variant="primary"
                size="small"
                onPress={handleAskDoubt}
                loading={isAsking}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Join Institute Invitation Code */}
      <Modal visible={showJoinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Redeem Invitation Code
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>Enter code provided by your tuition class or teacher</Caption>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Invitation Code</Label>
              <TextInput
                placeholder="e.g. APEX-JEE-2026"
                placeholderTextColor={colors.textMuted}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md, fontVariant: ['tabular-nums'] }]}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setShowJoinModal(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title={isJoining ? 'Verifying...' : 'Join Batch'}
                variant="primary"
                size="small"
                onPress={handleRedeemInvite}
                loading={isJoining}
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
  profileRow: {
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
  themePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ansBox: {},
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
  modalInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  btnRow: {
    flexDirection: 'row',
  },
});
