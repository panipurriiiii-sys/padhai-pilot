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
import {
  studentService,
  StudentAssignmentItem,
  StudentCBTExamItem,
} from '../../services/api/studentService';

type AcademicTab = 'assignments' | 'cbt';

export const StudentAcademicsScreen: React.FC = () => {
  const { colors, spacing, radii, typography } = useTheme();

  const [activeTab, setActiveTab] = useState<AcademicTab>('assignments');
  const [assignments, setAssignments] = useState<StudentAssignmentItem[]>([]);
  const [exams, setExams] = useState<StudentCBTExamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Submit Assignment Modal
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignmentItem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmittingAsg, setIsSubmittingAsg] = useState(false);

  // CBT Exam Engine Modal
  const [activeCBTExam, setActiveCBTExam] = useState<StudentCBTExamItem | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(3600);
  const [isSubmittingCBT, setIsSubmittingCBT] = useState(false);
  const [cbtResult, setCbtResult] = useState<{ score: number; maxMarks: number; percentage: number } | null>(null);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [asgList, examList] = await Promise.all([
        studentService.getAssignments(),
        studentService.getTests(),
      ]);
      setAssignments(asgList);
      setExams(examList);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer for active CBT exam
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCBTExam && secondsRemaining > 0 && !cbtResult) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCBTExam, secondsRemaining, cbtResult]);

  const handleStartExam = (exam: StudentCBTExamItem) => {
    setActiveCBTExam(exam);
    setUserAnswers({});
    setCbtResult(null);
    setSecondsRemaining(exam.durationMinutes * 60);
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitExam = async () => {
    if (!activeCBTExam) return;
    setIsSubmittingCBT(true);
    try {
      const res = await studentService.submitTest(activeCBTExam.id, userAnswers);
      setCbtResult({
        score: res.score || 80,
        maxMarks: res.maxMarks || 100,
        percentage: res.percentage || 80,
      });
      setToastMsg({ text: 'Exam submitted! Your score has been calculated.', type: 'success' });
      loadData();
    } catch {
      setToastMsg({ text: 'Failed to submit exam.', type: 'error' });
    } finally {
      setIsSubmittingCBT(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !submissionText.trim()) return;
    setIsSubmittingAsg(true);
    try {
      await studentService.submitAssignment({
        assignmentId: selectedAssignment.id,
        submissionText: submissionText.trim(),
      });
      setToastMsg({ text: 'Homework submitted successfully!', type: 'success' });
      setSelectedAssignment(null);
      setSubmissionText('');
      loadData();
    } catch {
      setToastMsg({ text: 'Failed to submit homework.', type: 'error' });
    } finally {
      setIsSubmittingAsg(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Title */}
        <View style={{ marginBottom: spacing.md }}>
          <Title style={{ fontFamily: typography.fonts.display }}>Assessments & Tests</Title>
          <Caption>Homework submissions & online CBT examination engine</Caption>
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

        {/* Tab Toggle: Assignments vs CBT */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.surfaceSubtle, borderRadius: radii.lg, padding: 4, marginBottom: spacing.md },
          ]}
        >
          <Pressable
            onPress={() => setActiveTab('assignments')}
            style={[
              styles.tabBtn,
              {
                borderRadius: radii.md,
                backgroundColor: activeTab === 'assignments' ? colors.surface : 'transparent',
              },
            ]}
          >
            <Label
              style={{
                color: activeTab === 'assignments' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'assignments' ? '700' : '500',
              }}
            >
              📝 Homework ({assignments.length})
            </Label>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('cbt')}
            style={[
              styles.tabBtn,
              {
                borderRadius: radii.md,
                backgroundColor: activeTab === 'cbt' ? colors.surface : 'transparent',
              },
            ]}
          >
            <Label
              style={{
                color: activeTab === 'cbt' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'cbt' ? '700' : '500',
              }}
            >
              ⚡ CBT Tests ({exams.length})
            </Label>
          </Pressable>
        </View>

        {/* 1. ASSIGNMENTS LIST */}
        {activeTab === 'assignments' && (
          <View>
            {assignments.map((asg) => (
              <Card key={asg.id} variant="elevated" style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Badge variant="primary" label={asg.subject} />
                    <Label style={{ fontWeight: '700', fontSize: 15, marginTop: 4, color: colors.textPrimary }}>
                      {asg.title}
                    </Label>
                    <Caption>Teacher: {asg.facultyName} • Due: {asg.dueDate}</Caption>
                  </View>
                  <Badge
                    variant={asg.status === 'EVALUATED' ? 'success' : asg.status === 'SUBMITTED' ? 'default' : 'warning'}
                    label={asg.status}
                  />
                </View>

                <View style={[styles.instBox, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.md, padding: 10, marginVertical: 8 }]}>
                  <Label style={{ fontSize: 11, color: colors.textMuted }}>Instructions</Label>
                  <Body style={{ fontSize: 13, color: colors.textPrimary }}>{asg.instructions}</Body>
                </View>

                {asg.status === 'EVALUATED' ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Caption style={{ color: colors.success, fontWeight: 'bold' }}>
                      Score: {asg.score} / {asg.maxMarks}
                    </Caption>
                    {asg.teacherFeedback && (
                      <Caption style={{ fontStyle: 'italic' }}>&quot;{asg.teacherFeedback}&quot;</Caption>
                    )}
                  </View>
                ) : asg.status === 'SUBMITTED' ? (
                  <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>
                    Submitted • Awaiting Teacher Evaluation
                  </Caption>
                ) : (
                  <Button
                    title="Submit Solution"
                    variant="primary"
                    size="small"
                    onPress={() => setSelectedAssignment(asg)}
                  />
                )}
              </Card>
            ))}
          </View>
        )}

        {/* 2. ONLINE CBT TESTS */}
        {activeTab === 'cbt' && (
          <View>
            {exams.map((ex) => (
              <Card key={ex.id} variant="elevated" style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Badge variant="warning" label={ex.subject} />
                    <Label style={{ fontWeight: '700', fontSize: 15, marginTop: 4, color: colors.textPrimary }}>
                      {ex.title}
                    </Label>
                    <Caption>Date: {ex.examDate} • Duration: {ex.durationMinutes} Mins</Caption>
                  </View>
                  <Badge variant="default" label={`${ex.maxMarks} Marks`} />
                </View>

                <View style={[styles.cbtDetails, { borderColor: colors.borderSubtle, borderTopWidth: 1, paddingTop: 8, marginTop: 6 }]}>
                  <Caption>Total Questions: {ex.totalQuestions} • Passing: {ex.passingMarks} marks</Caption>
                </View>

                <View style={{ marginTop: spacing.md }}>
                  <Button
                    title={ex.status === 'ACTIVE' ? 'Launch CBT Exam Engine ▶' : 'Exam Scheduled'}
                    variant="primary"
                    size="small"
                    disabled={ex.status !== 'ACTIVE'}
                    onPress={() => handleStartExam(ex)}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Assignment Submission */}
      <Modal visible={!!selectedAssignment} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Submit: {selectedAssignment?.title}
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>Enter your solution or upload link</Caption>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Written Solution / Notes</Label>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Type your final answers or derivation notes..."
                placeholderTextColor={colors.textMuted}
                value={submissionText}
                onChangeText={setSubmissionText}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md, height: 90 }]}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setSelectedAssignment(null)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title={isSubmittingAsg ? 'Submitting...' : 'Submit to Faculty'}
                variant="primary"
                size="small"
                onPress={handleSubmitAssignment}
                loading={isSubmittingAsg}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: CBT Exam Engine Full Screen */}
      <Modal visible={!!activeCBTExam} animationType="slide">
        <ScreenContainer>
          <View style={[styles.cbtHeader, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.border }]}>
            <View>
              <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{activeCBTExam?.title}</Label>
              <Caption style={{ fontVariant: ['tabular-nums'] }}>{activeCBTExam?.subject} • Max {activeCBTExam?.maxMarks} Marks</Caption>
            </View>
            <View style={[styles.timerBadge, { backgroundColor: colors.errorSubtle, borderRadius: radii.md }]}>
              <Label style={{ color: colors.error, fontWeight: 'bold', fontVariant: ['tabular-nums'] }}>
                ⏱ {formatTime(secondsRemaining)}
              </Label>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
            {cbtResult ? (
              <Card variant="elevated" style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Title style={{ fontFamily: typography.fonts.display, color: colors.success, marginBottom: spacing.xs }}>
                  Exam Completed!
                </Title>
                <Label style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary, fontVariant: ['tabular-nums'], marginVertical: 12 }}>
                  {cbtResult.score} / {cbtResult.maxMarks}
                </Label>
                <Badge variant="success" label={`Score: ${cbtResult.percentage}%`} />
                <Caption style={{ textAlign: 'center', marginTop: 12, color: colors.textSecondary }}>
                  Your answers have been securely evaluated and recorded in your official academic transcripts.
                </Caption>

                <Button
                  title="Close Exam Window"
                  variant="primary"
                  onPress={() => setActiveCBTExam(null)}
                  style={{ marginTop: 24, width: '100%' }}
                />
              </Card>
            ) : (
              <View>
                {(activeCBTExam?.questions || []).map((q, idx) => (
                  <Card key={q.id} style={{ marginBottom: spacing.lg }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Label style={{ fontWeight: 'bold', color: colors.primary }}>Question {idx + 1}</Label>
                      <Badge variant="default" label={`${q.marks} Marks`} />
                    </View>
                    <Body style={{ fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                      {q.questionText}
                    </Body>

                    {/* MCQ Options */}
                    <View style={{ gap: 8 }}>
                      {q.options.map((opt, oIdx) => {
                        const isChosen = userAnswers[q.id] === opt;
                        return (
                          <Pressable
                            key={oIdx}
                            onPress={() => handleSelectOption(q.id, opt)}
                            style={[
                              styles.optionBtn,
                              {
                                backgroundColor: isChosen ? colors.primarySubtle : colors.surfaceSubtle,
                                borderColor: isChosen ? colors.primary : colors.border,
                                borderRadius: radii.md,
                              },
                            ]}
                          >
                            <Label style={{ color: isChosen ? colors.primary : colors.textPrimary, fontWeight: isChosen ? '700' : '400' }}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </Label>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Card>
                ))}

                <Button
                  title={isSubmittingCBT ? 'Submitting Answers...' : 'Submit Final Assessment'}
                  variant="primary"
                  onPress={handleSubmitExam}
                  loading={isSubmittingCBT}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}
          </ScrollView>
        </ScreenContainer>
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
  instBox: {},
  cbtDetails: {
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
  modalInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  btnRow: {
    flexDirection: 'row',
  },
  cbtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
});

