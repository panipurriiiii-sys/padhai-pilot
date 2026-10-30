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
import {
  teacherService,
  TeacherAssignment,
  TeacherSubmissionItem,
} from '../../services/api/teacherService';
import type { BatchSummary } from '@padhai-pilot/shared';

export const TeacherAssignmentsScreen: React.FC = () => {
  const { colors, spacing, radii, typography } = useTheme();

  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [submissions, setSubmissions] = useState<TeacherSubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [batchId, setBatchId] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-05');
  const [maxMarks, setMaxMarks] = useState('50');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grade Modal
  const [gradingSubmission, setGradingSubmission] = useState<TeacherSubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bList, aList] = await Promise.all([
        teacherService.getBatches(),
        teacherService.getAssignments(),
      ]);
      setBatches(bList);
      setAssignments(aList);
      if (bList.length > 0 && !batchId) {
        setBatchId(bList[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAssignment = async (asg: TeacherAssignment) => {
    setSelectedAssignment(asg);
    const subs = await teacherService.getAssignmentSubmissions(asg.id);
    setSubmissions(subs);
  };

  const handleCreateAssignment = async () => {
    if (!title.trim() || !batchId) return;
    setIsSubmitting(true);
    try {
      await teacherService.createAssignment({
        title: title.trim(),
        batchId,
        subject,
        dueDate,
        maxMarks: parseFloat(maxMarks) || 50,
        instructions: instructions.trim(),
      });
      setMsg({ text: 'Assignment published successfully!', type: 'success' });
      setShowCreateModal(false);
      setTitle('');
      setInstructions('');
      loadData();
    } catch {
      setMsg({ text: 'Failed to publish assignment', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission) return;
    try {
      await teacherService.gradeSubmission({
        submissionId: gradingSubmission.id,
        score: parseFloat(gradeScore) || 0,
        feedback: gradeFeedback.trim(),
      });
      setMsg({ text: `Graded ${gradingSubmission.studentName} successfully`, type: 'success' });
      setGradingSubmission(null);
      if (selectedAssignment) {
        const subs = await teacherService.getAssignmentSubmissions(selectedAssignment.id);
        setSubmissions(subs);
      }
    } catch {
      setMsg({ text: 'Failed to record grade', type: 'error' });
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Title style={{ fontFamily: typography.fonts.display }}>Assignments</Title>
            <Caption>Homework, problem sets & submissions review</Caption>
          </View>
          <Button
            title="+ New"
            variant="primary"
            size="small"
            onPress={() => setShowCreateModal(true)}
          />
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

        {/* Assignments List */}
        {assignments.map((asg) => (
          <Card
            key={asg.id}
            onPress={() => handleSelectAssignment(asg)}
            style={[
              { marginBottom: spacing.md },
              selectedAssignment?.id === asg.id && { borderColor: colors.primary, borderWidth: 1.5 },
            ]}
          >
            <View style={styles.asgHeader}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{asg.title}</Label>
                <Caption>
                  {asg.subject} • Due: {asg.dueDate} • Max: {asg.maxMarks} marks
                </Caption>
              </View>
              <Badge variant="primary" label={`${asg.submissionsCount} Subs`} />
            </View>

            <View style={[styles.asgFooter, { marginTop: spacing.sm }]}>
              <Caption style={{ fontVariant: ['tabular-nums'] }}>
                Evaluated: {asg.evaluatedCount}/{asg.submissionsCount}
              </Caption>
              <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>
                {selectedAssignment?.id === asg.id ? 'Viewing Submissions ▼' : 'Tap to Grade ▶'}
              </Caption>
            </View>
          </Card>
        ))}

        {/* Selected Submissions List */}
        {selectedAssignment && (
          <View style={{ marginTop: spacing.md }}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Submissions for &quot;{selectedAssignment.title}&quot;
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>
              Tap on any submission to grade and leave feedback
            </Caption>

            {submissions.map((sub) => (
              <Card
                key={sub.id}
                onPress={() => {
                  setGradingSubmission(sub);
                  setGradeScore(sub.score ? String(sub.score) : '');
                  setGradeFeedback(sub.feedback || '');
                }}
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.subRow}>
                  <View style={{ flex: 1 }}>
                    <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{sub.studentName}</Label>
                    <Caption>{sub.rollNumber} • Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</Caption>
                    {sub.feedback && (
                      <Caption style={{ color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 }}>
                        Remark: &quot;{sub.feedback}&quot;
                      </Caption>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Badge
                      variant={sub.status === 'EVALUATED' ? 'success' : 'warning'}
                      label={sub.status === 'EVALUATED' ? `${sub.score}/${selectedAssignment.maxMarks}` : 'Pending'}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Create Assignment */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Publish Homework / Assignment
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>Set deadline, marks and instructions</Caption>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Assignment Title *</Label>
              <TextInput
                placeholder="e.g. Definite Integrals DPP #14"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Label style={{ marginBottom: 4 }}>Subject</Label>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Label style={{ marginBottom: 4 }}>Due Date</Label>
                <TextInput
                  value={dueDate}
                  onChangeText={setDueDate}
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
                />
              </View>
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Max Marks</Label>
              <TextInput
                keyboardType="numeric"
                value={maxMarks}
                onChangeText={setMaxMarks}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Instructions</Label>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Specific problems to solve, steps required..."
                placeholderTextColor={colors.textMuted}
                value={instructions}
                onChangeText={setInstructions}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md, height: 70 }]}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setShowCreateModal(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title={isSubmitting ? 'Publishing...' : 'Publish'}
                variant="primary"
                size="small"
                onPress={handleCreateAssignment}
                loading={isSubmitting}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Grade Submission */}
      <Modal visible={!!gradingSubmission} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Subtitle style={{ fontFamily: typography.fonts.display, marginBottom: spacing.xs }}>
              Grade: {gradingSubmission?.studentName}
            </Subtitle>
            <Caption style={{ marginBottom: spacing.md }}>
              Out of {selectedAssignment?.maxMarks} marks
            </Caption>

            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: 4 }}>Score Obtained *</Label>
              <TextInput
                keyboardType="numeric"
                placeholder="e.g. 48"
                placeholderTextColor={colors.textMuted}
                value={gradeScore}
                onChangeText={setGradeScore}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md }]}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Label style={{ marginBottom: 4 }}>Teacher Feedback</Label>
              <TextInput
                multiline
                numberOfLines={2}
                placeholder="e.g. Good derivation, check boundary limits."
                placeholderTextColor={colors.textMuted}
                value={gradeFeedback}
                onChangeText={setGradeFeedback}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.md, height: 60 }]}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="small"
                onPress={() => setGradingSubmission(null)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="Submit Grade"
                variant="primary"
                size="small"
                onPress={handleSaveGrade}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  msgBanner: {
    padding: 10,
  },
  asgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  asgFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
    paddingTop: 8,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

