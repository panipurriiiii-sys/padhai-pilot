import React, { useState } from 'react';
import { Alert, View, StyleSheet, Pressable } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Segmented } from '../../components/common/Segmented';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import {
  useAssignmentsData,
  useSubmitAssignment,
  useSubmitTest,
  useTestsData,
} from '../../hooks/useStudentData';
import { studentService } from '../../services/api/studentService';
import type { StudentAssignmentItem, StudentTestDetails } from '../../services/api/studentService';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate, formatDateTime } from '../../lib/format';
import { openUrl } from '../../lib/links';

type Tab = 'homework' | 'tests';
const ASSIGNMENT_VARIANT = { PENDING: 'warning', SUBMITTED: 'primary', LATE: 'error', GRADED: 'success', RESUBMIT: 'warning' } as const;

const SubmitForm: React.FC<{ item: StudentAssignmentItem; onDone: () => void }> = ({ item, onDone }) => {
  const { spacing } = useTheme();
  const submit = useSubmitAssignment();
  const [content, setContent] = useState(item.submission?.content ?? '');
  const [link, setLink] = useState(item.submission?.attachmentUrl ?? '');

  const send = (isDraft: boolean) =>
    submit.mutate(
      { id: item.id, content: content.trim() || undefined, attachmentUrl: link.trim() || undefined, isDraft },
      {
        onSuccess: (r) => {
          Alert.alert(isDraft ? 'Draft saved' : 'Submitted', r.message);
          if (!isDraft) onDone();
        },
        onError: (e) => Alert.alert('Could not submit', errorMessage(e)),
      },
    );

  return (
    <View style={{ marginTop: spacing.md }}>
      <Input label="Your answer" value={content} onChangeText={setContent} multiline />
      <Input label="Document link (https)" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button title="Save draft" variant="secondary" style={{ flex: 1 }} loading={submit.isPending} onPress={() => send(true)} />
        <Button
          title="Submit"
          style={{ flex: 1 }}
          loading={submit.isPending}
          disabled={!content.trim() && !link.trim()}
          onPress={() => send(false)}
        />
      </View>
    </View>
  );
};

const TestRunner: React.FC<{ testId: string; onClose: () => void }> = ({ testId, onClose }) => {
  const { spacing, colors } = useTheme();
  const [details, setDetails] = useState<StudentTestDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const submit = useSubmitTest();

  React.useEffect(() => {
    studentService
      .getTestDetails(testId)
      .then(setDetails)
      .catch((e) => setError(errorMessage(e)));
  }, [testId]);

  if (error) return <ErrorState message={error} onRetry={onClose} />;
  if (!details) return <Skeleton height={120} />;

  const finish = () =>
    submit.mutate(
      {
        id: testId,
        answers: Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({ questionId, selectedOptionIndex })),
      },
      {
        onSuccess: (r) => {
          Alert.alert('Test submitted', r.feedback || `Score ${r.score}/${r.totalMarks}`);
          onClose();
        },
        onError: (e) => Alert.alert('Could not submit', errorMessage(e)),
      },
    );

  return (
    <Card>
      <Subtitle>{details.title}</Subtitle>
      <Caption>{`${details.durationMinutes} min · ${details.totalMarks} marks`}</Caption>
      {details.instructions ? <Body style={{ marginTop: spacing.xs }}>{details.instructions}</Body> : null}
      {details.questions.map((q, i) => (
        <View key={q.id} style={{ marginTop: spacing.lg }}>
          <Body>{`${i + 1}. ${q.text}`}</Body>
          {q.options.map((opt, idx) => {
            const selected = answers[q.id] === idx;
            return (
              <Pressable
                key={`${q.id}-${idx}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                style={{
                  marginTop: spacing.xs,
                  padding: spacing.md,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySubtle : 'transparent',
                }}
              >
                <Body>{opt}</Body>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        <Button title="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
        <Button title="Submit test" style={{ flex: 1 }} loading={submit.isPending} onPress={finish} />
      </View>
    </Card>
  );
};

export const StudentAcademicsScreen: React.FC = () => {
  const { spacing } = useTheme();
  const [tab, setTab] = useState<Tab>('homework');
  const [openId, setOpenId] = useState<string | null>(null);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const assignments = useAssignmentsData();
  const tests = useTestsData();
  const active = tab === 'homework' ? assignments : tests;

  return (
    <Screen
      eyebrow="ACADEMICS"
      title={tab === 'homework' ? 'Homework' : 'Tests'}
      subtitle={tab === 'homework' ? 'Submit work and read your teacher’s feedback' : 'Scored on the server when you submit'}
      refreshing={active.isRefetching}
      onRefresh={() => active.refetch()}
    >
      <Segmented
        value={tab}
        onChange={(k) => {
          setTab(k);
          setRunningTest(null);
        }}
        options={[
          { key: 'homework', label: 'Homework' },
          { key: 'tests', label: 'Tests' },
        ]}
      />

      {tab === 'homework' ? (
        <QueryBoundary
          query={assignments}
          isEmpty={(a) => a.length === 0}
          emptyTitle="No homework"
          emptyDescription="Assignments published to your batch will appear here."
        >
          {(items) =>
            items.map((a) => {
              const open = openId === a.id;
              const canSubmit = a.status === 'PENDING' || a.status === 'RESUBMIT';
              return (
                <Card key={a.id} style={{ marginBottom: spacing.md }} onPress={() => setOpenId(open ? null : a.id)}>
                  <View style={styles.row}>
                    <Subtitle style={{ flex: 1 }}>{a.title}</Subtitle>
                    <Badge label={a.status} variant={ASSIGNMENT_VARIANT[a.status]} />
                  </View>
                  <Caption>{`${a.subject} · due ${formatDate(a.dueDate)} · ${a.maxMarks} marks`}</Caption>
                  {open ? (
                    <>
                      <Body style={{ marginTop: spacing.sm }}>{a.instructions}</Body>
                      {a.attachmentUrl ? (
                        <Button title="Open brief" variant="secondary" size="sm" style={{ marginTop: spacing.sm }} onPress={() => openUrl(a.attachmentUrl)} />
                      ) : null}
                      {a.submission?.marksObtained != null ? (
                        <Body style={{ marginTop: spacing.sm }}>{`Marks: ${a.submission.marksObtained}/${a.maxMarks}`}</Body>
                      ) : null}
                      {a.submission?.feedback ? <Caption>{`Feedback: ${a.submission.feedback}`}</Caption> : null}
                      {canSubmit ? <SubmitForm item={a} onDone={() => setOpenId(null)} /> : null}
                    </>
                  ) : null}
                </Card>
              );
            })
          }
        </QueryBoundary>
      ) : runningTest ? (
        <TestRunner testId={runningTest} onClose={() => setRunningTest(null)} />
      ) : (
        <QueryBoundary
          query={tests}
          isEmpty={(t) => t.length === 0}
          emptyTitle="No tests"
          emptyDescription="Tests scheduled for your batch will appear here."
        >
          {(items) =>
            items.map((t) => (
              <Card key={t.id} style={{ marginBottom: spacing.md }}>
                <View style={styles.row}>
                  <Subtitle style={{ flex: 1 }}>{t.title}</Subtitle>
                  <Badge label={t.status} variant={t.status === 'ACTIVE' ? 'success' : t.status === 'UPCOMING' ? 'warning' : 'neutral'} />
                </View>
                <Caption>{`${t.subject} · ${formatDateTime(t.scheduledDate)} · ${t.durationMinutes} min · ${t.totalMarks} marks`}</Caption>
                {t.attempt ? (
                  <Body style={{ marginTop: spacing.xs }}>{`Score: ${t.attempt.score}/${t.totalMarks}`}</Body>
                ) : null}
                {t.status === 'ACTIVE' && !t.attempt ? (
                  <Button title="Start test" style={{ marginTop: spacing.sm }} onPress={() => setRunningTest(t.id)} />
                ) : null}
              </Card>
            ))
          }
        </QueryBoundary>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
