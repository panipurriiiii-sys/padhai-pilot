import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label, StatValue } from '../../../components/common/Typography';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { useTheme } from '../../../theme/ThemeContext';
import {
  studentService,
  AssessmentResultItem,
  AttendanceSummary,
} from '../../../services/api/studentService';

type ResultsTab = 'results' | 'attendance';

export const ResultsScreen: React.FC = () => {
  const { colors, spacing, radii, typography } = useTheme();

  const [activeTab, setActiveTab] = useState<ResultsTab>('results');
  const [results, setResults] = useState<AssessmentResultItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Correction Request Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState('2026-10-26');
  const [corrSubject, setCorrSubject] = useState('Mathematics');
  const [corrReason, setCorrReason] = useState('');
  const [isSubmittingCorr, setIsSubmittingCorr] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rList, att] = await Promise.all([
        studentService.getResults(),
        studentService.getAttendance(),
      ]);
      setResults(rList);
      setAttendance(att);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = useMemo(() => {
    if (!results || results.length === 0) return { totalTests: 0, averagePercentage: 0, highestScore: 0 };
    const total = results.length;
    const avg = results.reduce((sum, item) => sum + (item.percentage || 0), 0) / total;
    const highest = Math.max(...results.map((i) => i.percentage || 0));
    return {
      totalTests: total,
      averagePercentage: Math.round(avg),
      highestScore: Math.round(highest),
    };
  }, [results]);

  const handleSendCorrection = async () => {
    if (!corrReason.trim()) return;
    setIsSubmittingCorr(true);
    try {
      await studentService.requestAttendanceCorrection({
        date: corrDate,
        subject: corrSubject,
        reason: corrReason.trim(),
      });
      setToastMsg({ text: 'Attendance correction request submitted to faculty.', type: 'success' });
      setShowCorrectionModal(false);
      setCorrReason('');
    } catch {
      setToastMsg({ text: 'Failed to submit correction request.', type: 'error' });
    } finally {
      setIsSubmittingCorr(false);
    }
  };

  const openReportCardPdf = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Title */}
        <View style={{ marginBottom: spacing.md }}>
          <Title style={{ fontFamily: typography.fonts.display }}>Academic Performance</Title>
          <Caption>Published exam scorecards & attendance tracking</Caption>
        </View>

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

        {/* Tab Toggle: Results vs Attendance */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.surfaceSubtle, borderRadius: radii.lg, padding: 4, marginBottom: spacing.md },
          ]}
        >
          <Pressable
            onPress={() => setActiveTab('results')}
            style={[
              styles.tabBtn,
              {
                borderRadius: radii.md,
                backgroundColor: activeTab === 'results' ? colors.surface : 'transparent',
              },
            ]}
          >
            <Label
              style={{
                color: activeTab === 'results' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'results' ? '700' : '500',
              }}
            >
              ★ Exam Results ({results.length})
            </Label>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('attendance')}
            style={[
              styles.tabBtn,
              {
                borderRadius: radii.md,
                backgroundColor: activeTab === 'attendance' ? colors.surface : 'transparent',
              },
            ]}
          >
            <Label
              style={{
                color: activeTab === 'attendance' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'attendance' ? '700' : '500',
              }}
            >
              ✓ Attendance ({attendance?.percentage || 92}%)
            </Label>
          </Pressable>
        </View>

        {/* 1. EXAM RESULTS VIEW */}
        {activeTab === 'results' && (
          <View>
            {/* Overview Stats Bar */}
            <View style={[styles.statsRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
              <Card style={{ flex: 1 }}>
                <Caption>AVERAGE SCORE</Caption>
                <StatValue color={colors.primary}>{metrics.averagePercentage}%</StatValue>
                <Caption>Across all tests</Caption>
              </Card>
              <Card style={{ flex: 1 }}>
                <Caption>HIGHEST SCORE</Caption>
                <StatValue color={colors.success}>{metrics.highestScore}%</StatValue>
                <Caption>Peak performance</Caption>
              </Card>
            </View>

            {/* Assessment Cards */}
            {results.map((res) => (
              <Card key={res.id} variant="elevated" style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Badge variant="primary" label={res.subject} />
                    <Label style={{ fontWeight: '700', fontSize: 16, marginTop: 4, color: colors.textPrimary }}>
                      {res.title}
                    </Label>
                    <Caption style={{ fontVariant: ['tabular-nums'] }}>Date: {res.examDate}</Caption>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Label style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                      {res.marksObtained}/{res.maxMarks}
                    </Label>
                    <Caption style={{ fontWeight: 'bold', color: colors.success }}>
                      {Math.round(res.percentage)}% • Grade {res.grade || 'A'}
                    </Caption>
                  </View>
                </View>

                {res.rank && (
                  <View style={[styles.rankBadge, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4, marginVertical: 4 }]}>
                    <Caption style={{ fontWeight: 'bold', color: colors.primary }}>
                      🏆 Batch Rank: #{res.rank} of {res.totalStudents || 38} students
                    </Caption>
                  </View>
                )}

                {res.remarks && (
                  <Caption style={{ fontStyle: 'italic', color: colors.textSecondary, marginVertical: 4 }}>
                    Faculty Note: &quot;{res.remarks}&quot;
                  </Caption>
                )}

                {res.reportCardUrl && (
                  <Button
                    title="Download Official Report Card PDF"
                    variant="outline"
                    size="small"
                    onPress={() => openReportCardPdf(res.reportCardUrl)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </Card>
            ))}
          </View>
        )}

        {/* 2. ATTENDANCE TRACKER & CORRECTION REQUESTS */}
        {activeTab === 'attendance' && (
          <View>
            {/* Attendance Gauge Card */}
            <Card variant="elevated" style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Title style={{ fontFamily: typography.fonts.display, color: colors.primary, fontSize: 28, fontVariant: ['tabular-nums'] }}>
                    {attendance?.percentage ?? 92}%
                  </Title>
                  <Caption>Aggregate Academic Presence</Caption>
                </View>
                <Badge
                  variant={attendance && attendance.percentage >= 85 ? 'success' : 'warning'}
                  label={attendance && attendance.percentage >= 75 ? 'ELIGIBLE FOR EXAMS' : 'SHORTAGE ALERT'}
                />
              </View>

              {/* Status Breakdown Chips */}
              <View style={[styles.attBreakdown, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 10, marginTop: 10 }]}>
                <Caption style={{ color: colors.success, fontWeight: 'bold' }}>
                  ✓ {attendance?.presentCount || 46} Present
                </Caption>
                <Caption style={{ color: colors.error, fontWeight: 'bold' }}>
                  ✕ {attendance?.absentCount || 3} Absent
                </Caption>
                <Caption style={{ color: colors.warning, fontWeight: 'bold' }}>
                  ⏱ {attendance?.lateCount || 1} Late
                </Caption>
              </View>

              <Button
                title="Request Attendance Correction"
                variant="outline"
                size="small"
                onPress={() => setShowCorrectionModal(true)}
                style={{ marginTop: 12 }}
              />
            </Card>

            {/* Attendance History Log */}
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.sm }}>
              Class Session History
            </Subtitle>

            {(attendance?.records || []).map((rec) => (
              <Card key={rec.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Label style={{ fontWeight: '700', color: colors.textPrimary }}>
                      {rec.subjectName || 'Core Lecture'}
                    </Label>
                    <Caption style={{ fontVariant: ['tabular-nums'] }}>{rec.date}</Caption>
                    {rec.remarks && <Caption style={{ fontStyle: 'italic', color: colors.textSecondary }}>{rec.remarks}</Caption>}
                  </View>
                  <Badge
                    variant={
                      rec.status === 'PRESENT'
                        ? 'success'
                        : rec.status === 'ABSENT'
                        ? 'error'
                        : rec.status === 'LATE'
                        ? 'warning'
                        : 'primary'
                    }
                    label={rec.status}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Attendance Correction Request */}
      <Modal visible={showCorrectionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Attendance Correction Request
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>
              Submit proof or reason for marked absence to your faculty
            </Caption>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Date of Session</Label>
              <TextInput
                value={corrDate}
                onChangeText={setCorrDate}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Subject</Label>
              <TextInput
                value={corrSubject}
                onChangeText={setCorrSubject}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Reason for Correction *</Label>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="e.g. Present in class, marked absent by mistake..."
                placeholderTextColor={colors.textMuted}
                value={corrReason}
                onChangeText={setCorrReason}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md, height: 70 }]}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setShowCorrectionModal(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title={isSubmittingCorr ? 'Sending...' : 'Send Request'}
                variant="primary"
                size="small"
                onPress={handleSendCorrection}
                loading={isSubmittingCorr}
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
  tabBar: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
  },
  rankBadge: {
    alignSelf: 'flex-start',
  },
  attBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
